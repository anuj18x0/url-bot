"""
QR code generation service.

Generates QR code images and returns them as base64-encoded PNGs.
"""

import base64
import io

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer


def generate_qr_base64(url: str) -> str:
    """
    Generate a QR code for the given URL and return as a base64-encoded PNG.

    Args:
        url: The URL to encode in the QR code.

    Returns:
        Base64-encoded PNG string (suitable for data URI embedding).
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Create styled QR code with rounded modules for a modern look
    img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(),
        fill_color="#1a1a2e",
        back_color="#ffffff",
    )

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64_string = base64.b64encode(buffer.read()).decode("utf-8")

    return b64_string
