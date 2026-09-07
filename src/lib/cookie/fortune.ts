import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FALLBACK = [
  "The oven is community-run. So is your luck.",
  "Sub-second finality. Infinite crumbs.",
  "Cheap deploys beat expensive opinions.",
  "A validator set is a kitchen crew.",
  "Memo is memory. Memory is on-chain.",
  "Nightly signs. The chain remembers.",
  "Fees so small they taste like sugar.",
  "Build something degenerate. Document it well.",
];

function pickFallback() {
  return FALLBACK[Math.floor(Math.random() * FALLBACK.length)] ?? FALLBACK[0];
}

export const mintFortune = createServerFn({ method: "POST" })
  .validator(z.object({ note: z.string().max(80).optional() }))
  .handler(async ({ data }): Promise<{ fortune: string; source: "grok" | "oven" }> => {
    const note = (data.note ?? "").trim().slice(0, 80);
    const apiKey = process.env.XAI_API_KEY;
    let line = pickFallback();
    let source: "grok" | "oven" = "oven";

    if (apiKey) {
      try {
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 48,
            temperature: 0.9,
            messages: [
              {
                role: "system",
                content:
                  "Write one short fortune-cookie line for Cookie Chain, a community SVM. Max 12 words. No quotes, no hashtags, no emoji.",
              },
              {
                role: "user",
                content: note ? `Crumb from baker: ${note}` : "Bake a fortune for the oven.",
              },
            ],
          }),
        });
        if (res.ok) {
          const body = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const text = body.choices?.[0]?.message?.content?.trim();
          if (text) {
            line = text.replace(/^["']|["']$/g, "").slice(0, 140);
            source = "grok";
          }
        }
      } catch {
        // keep oven fallback
      }
    }

    const fortune = note ? `OVEN:${line} | crumb:${note}` : `OVEN:${line}`;
    return { fortune: fortune.slice(0, 180), source };
  });
