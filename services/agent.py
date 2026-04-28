"""
AI Agent with tool-calling capability.

Uses Google Gemini with structured tool definitions to intelligently
decide when to shorten URLs, fetch analytics, or respond conversationally.
"""

import os
import json
from typing import Any

from google import genai
from google.genai import types

from services.bitly import shorten_url, get_click_analytics
from services.qr import generate_qr_base64
from services.memory import memory_store
from services.database import database
from services.tracking import create_tracker, update_tracker_bitly_url

# --- Tool Definitions for Gemini Function Calling ---

SHORTEN_URL_TOOL = types.FunctionDeclaration(
    name="shorten_url",
    description=(
        "Shorten a long URL using the Bitly API. Use this tool when the user "
        "asks to shorten a URL, create a short link, or provides a long URL "
        "they want shortened. Returns the shortened Bitly link."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "long_url": types.Schema(
                type=types.Type.STRING,
                description="The full long URL to shorten (must include http:// or https://)",
            ),
        },
        required=["long_url"],
    ),
)

GET_ANALYTICS_TOOL = types.FunctionDeclaration(
    name="get_click_analytics",
    description=(
        "Get click analytics and statistics for a Bitly short link. Use this "
        "tool when the user asks about clicks, analytics, statistics, or "
        "performance of a short link. Returns total clicks and daily breakdown."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "bitlink": types.Schema(
                type=types.Type.STRING,
                description="The Bitly short link to get analytics for (e.g., 'bit.ly/abc123')",
            ),
        },
        required=["bitlink"],
    ),
)

TOOLS = types.Tool(function_declarations=[SHORTEN_URL_TOOL, GET_ANALYTICS_TOOL])

SYSTEM_PROMPT = """You are LinkBot, an intelligent AI assistant specialized in URL management and shortening.

Your capabilities:
1. **Shorten URLs**: You can shorten any valid URL using the Bitly API via the `shorten_url` tool.
2. **Link Analytics**: You can fetch click analytics for any Bitly short link using the `get_click_analytics` tool.
3. **General Knowledge**: You can answer questions about URLs, link management, SEO, and digital marketing.

Behavior guidelines:
- When a user provides a URL or asks to shorten something, use the `shorten_url` tool.
- When a user asks about clicks, analytics, or performance of a link, use the `get_click_analytics` tool.
- For general questions, respond conversationally with helpful information.
- Always be concise, friendly, and helpful.
- If you use a tool, explain the results clearly to the user.
- When shortening a URL, confirm the original URL and present the short link clearly.
- If a URL seems invalid or missing a protocol, ask the user to provide the full URL.

{memory_context}"""


def _build_system_prompt(memory_context: str) -> str:
    """Build the system prompt with injected memory context."""
    if memory_context:
        context_block = f"\nRelevant context from previous conversations:\n{memory_context}\n"
    else:
        context_block = ""
    return SYSTEM_PROMPT.format(memory_context=context_block)


async def _execute_tool(
    function_call: types.FunctionCall, user_id: str | None = None
) -> dict[str, Any]:
    """
    Execute a tool call and return the result.

    Args:
        function_call: The function call from Gemini.
        user_id: Optional user ID for tracking link ownership.

    Returns:
        Dictionary with tool execution results.
    """
    name = function_call.name
    args = dict(function_call.args) if function_call.args else {}

    if name == "shorten_url":
        long_url = args.get("long_url", "")
        if not long_url.startswith(("http://", "https://")):
            long_url = "https://" + long_url

        # Step 0: Check for existing tracker (Deduplication)
        existing = await database.find_existing_tracker(long_url, user_id)
        if existing and existing.get("bitly_url"):
            bitly_url = existing["bitly_url"]
            qr_base64 = generate_qr_base64(bitly_url)
            return {
                "tool": "shorten_url",
                "result": {
                    "link": bitly_url,
                    "long_url": long_url,
                    "qr_code_base64": qr_base64,
                    "tracker_code": existing["code"],
                    "reused": True
                }
            }

        # Step 1: Create our internal tracker first
        tracker_data = await create_tracker(
            original_url=long_url,
            user_id=user_id,
        )
        tracker_url = tracker_data["tracker_url"]
        tracker_code = tracker_data["code"]

        # Step 2: Shorten OUR tracker URL using Bitly
        # This makes the flow: Bitly -> Tracker -> Original URL
        bitly_result = await shorten_url(tracker_url)
        bitly_url = bitly_result["link"]
        
        # Step 3: Update our database with the Bitly URL for this tracker
        await update_tracker_bitly_url(tracker_code, bitly_url)

        # Step 4: Generate QR code for the final Bitly link
        qr_base64 = generate_qr_base64(bitly_url)

        result = {
            "link": bitly_url,
            "long_url": long_url,
            "qr_code_base64": qr_base64,
            "tracker_code": tracker_code,
        }
        return {"tool": "shorten_url", "result": result}

    elif name == "get_click_analytics":
        bitlink = args.get("bitlink", "")
        result = await get_click_analytics(bitlink)
        return {"tool": "get_click_analytics", "result": result}

    else:
        return {"tool": name, "error": f"Unknown tool: {name}"}


async def run_agent(
    user_message: str, session_id: str = "default", user_id: str | None = None
) -> dict[str, Any]:
    """
    Run the AI agent for a user message.

    This is the main orchestrator that:
    1. Retrieves relevant memory context
    2. Sends the message to Gemini with tool definitions
    3. If Gemini calls a tool, executes it and feeds results back
    4. Returns the final response with any structured data

    Args:
        user_message: The user's message.
        session_id: Session identifier for memory retrieval.

    Returns:
        Dictionary with 'reply', and optionally 'short_url', 'qr_code_base64',
        'analytics', etc.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    # Step 1: Retrieve relevant memory context (now async with MongoDB)
    relevant_memories = await memory_store.retrieve_relevant(session_id, user_message, top_k=3)
    recent_history = await memory_store.get_recent_history(session_id, n=3)

    memory_parts = []
    if relevant_memories:
        memory_parts.append("Semantically relevant past interactions:")
        for mem in relevant_memories:
            memory_parts.append(f"  - {mem}")
    if recent_history:
        memory_parts.append("Recent conversation history:")
        for hist in recent_history:
            memory_parts.append(f"  - {hist}")

    memory_context = "\n".join(memory_parts)
    system_prompt = _build_system_prompt(memory_context)

    # Step 2: Send to Gemini with tools
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message)],
            )
        ],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=[TOOLS],
            temperature=0.7,
        ),
    )

    # Step 3: Check if Gemini wants to call a tool
    result_data: dict[str, Any] = {"reply": ""}

    candidate = response.candidates[0]
    parts = candidate.content.parts

    # Check for function calls
    function_calls = [p for p in parts if p.function_call is not None]

    if function_calls:
        # Execute all tool calls
        tool_results = []
        for fc_part in function_calls:
            try:
                tool_result = await _execute_tool(fc_part.function_call, user_id=user_id)
                tool_results.append(tool_result)

                # Attach structured data to response
                if tool_result.get("tool") == "shorten_url":
                    r = tool_result["result"]
                    result_data["short_url"] = r.get("link")
                    result_data["long_url"] = r.get("long_url")
                    result_data["qr_code_base64"] = r.get("qr_code_base64")
                    # result_data["tracking"] = r.get("tracking") # No longer needed in simple flow

                elif tool_result.get("tool") == "get_click_analytics":
                    result_data["analytics"] = tool_result["result"]

            except Exception as e:
                tool_results.append({"tool": fc_part.function_call.name, "error": str(e)})

        # Step 4: Feed tool results back to Gemini for natural language response
        function_response_parts = []
        for fc_part, tr in zip(function_calls, tool_results):
            function_response_parts.append(
                types.Part.from_function_response(
                    name=fc_part.function_call.name,
                    response=tr.get("result", {"error": tr.get("error", "Unknown error")}),
                )
            )

        # Second call with tool results
        follow_up_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_message)],
                ),
                types.Content(
                    role="model",
                    parts=[p for p in parts],  # Include the function call parts
                ),
                types.Content(
                    role="user",
                    parts=function_response_parts,
                ),
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
            ),
        )

        result_data["reply"] = follow_up_response.text or "Done!"

    else:
        # No tool call — direct text response
        result_data["reply"] = response.text or "I'm not sure how to help with that."

    # Step 5: Generate embeddings for persistence
    user_embedding = await memory_store.generate_embedding(user_message)
    reply_embedding = await memory_store.generate_embedding(result_data["reply"])

    # Step 6: Persist to MongoDB with vectors
    await database.save_message(
        session_id=session_id, 
        role="user", 
        content=user_message,
        embedding=user_embedding
    )
    await database.save_message(
        session_id=session_id,
        role="assistant",
        content=result_data["reply"],
        embedding=reply_embedding,
        short_url=result_data.get("short_url"),
        long_url=result_data.get("long_url"),
        analytics=result_data.get("analytics"),
    )

    # Save URL to history if shortened
    if result_data.get("short_url") and result_data.get("long_url"):
        await database.save_url(
            result_data["long_url"],
            result_data["short_url"],
            session_id,
        )

    return result_data
