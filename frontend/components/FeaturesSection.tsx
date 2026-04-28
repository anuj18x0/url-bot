"use client";

import { motion, Variants } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BrainCircuitIcon, LinkIcon, BarChart3Icon } from "lucide-react";

const features = [
  {
    icon: BrainCircuitIcon,
    title: "AI Agent Intelligence",
    description:
      "Not just a chatbot — a full agent that decides when to call APIs, fetch analytics, or respond conversationally.",
  },
  {
    icon: LinkIcon,
    title: "Real Bitly Integration",
    description:
      "Creates genuine Bitly short links with QR codes. No fake shorteners — production-ready links you can share instantly.",
  },
  {
    icon: BarChart3Icon,
    title: "Click Analytics",
    description:
      "Track link performance with real-time click data. Ask the agent and get beautiful analytics breakdowns.",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function FeaturesSection() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Built Different
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            More than a link shortener — it&apos;s an intelligent assistant.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants}>
              <Card className="group relative h-full transition-shadow duration-300 hover:shadow-md">
                <CardHeader>
                  <div
                    className="mb-2 flex size-10 items-center justify-center rounded-lg bg-foreground text-background"
                  >
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
