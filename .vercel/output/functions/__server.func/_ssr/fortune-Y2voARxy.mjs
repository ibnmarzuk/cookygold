import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fortune-Y2voARxy.js
var FALLBACK = [
	"The oven is community-run. So is your luck.",
	"Sub-second finality. Infinite crumbs.",
	"Cheap deploys beat expensive opinions.",
	"A validator set is a kitchen crew.",
	"Memo is memory. Memory is on-chain.",
	"Nightly signs. The chain remembers.",
	"Fees so small they taste like sugar.",
	"Build something degenerate. Document it well."
];
function pickFallback() {
	return FALLBACK[Math.floor(Math.random() * FALLBACK.length)] ?? FALLBACK[0];
}
var mintFortune_createServerFn_handler = createServerRpc({
	id: "907727ddbfc44c154aed1df5c21733358069360d999122ab058a40a50f532c13",
	name: "mintFortune",
	filename: "src/lib/cookie/fortune.ts"
}, (opts) => mintFortune.__executeServer(opts));
var mintFortune = createServerFn({ method: "POST" }).validator(object({ note: string().max(80).optional() })).handler(mintFortune_createServerFn_handler, async ({ data }) => {
	const note = (data.note ?? "").trim().slice(0, 80);
	const apiKey = process.env.XAI_API_KEY;
	let line = pickFallback();
	let source = "oven";
	if (apiKey) try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				max_tokens: 48,
				temperature: .9,
				messages: [{
					role: "system",
					content: "Write one short fortune-cookie line for Cookie Chain, a community SVM. Max 12 words. No quotes, no hashtags, no emoji."
				}, {
					role: "user",
					content: note ? `Crumb from baker: ${note}` : "Bake a fortune for the oven."
				}]
			})
		});
		if (res.ok) {
			const text = (await res.json()).choices?.[0]?.message?.content?.trim();
			if (text) {
				line = text.replace(/^["']|["']$/g, "").slice(0, 140);
				source = "grok";
			}
		}
	} catch {}
	return {
		fortune: (note ? `OVEN:${line} | crumb:${note}` : `OVEN:${line}`).slice(0, 180),
		source
	};
});
//#endregion
export { mintFortune_createServerFn_handler };
