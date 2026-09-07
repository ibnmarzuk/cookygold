import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
import { s as COOKIE_RPC } from "./constants-BTNxadDz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rpc-BSiVQgH-.js
var ALLOWED = /* @__PURE__ */ new Set([
	"getSlot",
	"getVersion",
	"getHealth",
	"getSupply",
	"getRecentPerformanceSamples",
	"getBalance",
	"getSignaturesForAddress",
	"getLatestBlockhash",
	"getGenesisHash",
	"getSignatureStatuses",
	"sendRawTransaction"
]);
async function rpc(method, params = []) {
	if (!ALLOWED.has(method)) throw new Error(`RPC method not allowed: ${method}`);
	const res = await fetch(COOKIE_RPC, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method,
			params
		})
	});
	if (!res.ok) throw new Error(`Cookie RPC HTTP ${res.status}`);
	const json = await res.json();
	if (json.error) throw new Error(json.error.message ?? "Cookie RPC error");
	return json.result;
}
var fetchPulse_createServerFn_handler = createServerRpc({
	id: "172b184b5f9ee7f55c04ac42467d8050ede2f16397cff473cac704402f649078",
	name: "fetchPulse",
	filename: "src/lib/cookie/rpc.ts"
}, (opts) => fetchPulse.__executeServer(opts));
var fetchPulse = createServerFn({ method: "POST" }).handler(fetchPulse_createServerFn_handler, async () => {
	const [slot, version, health, samples, supply] = await Promise.all([
		rpc("getSlot"),
		rpc("getVersion"),
		rpc("getHealth").catch(() => "unknown"),
		rpc("getRecentPerformanceSamples", [12]).catch(() => []),
		rpc("getSupply").catch(() => null)
	]);
	const mapped = (samples ?? []).slice().reverse().map((s) => ({
		slot: s.slot,
		tps: s.samplePeriodSecs ? Math.round(s.numTransactions / s.samplePeriodSecs) : 0
	}));
	return {
		slot,
		version: version?.["solana-core"] ?? "unknown",
		health,
		tps: mapped.at(-1)?.tps ?? null,
		samples: mapped,
		circulating: supply?.value?.circulating ?? null
	};
});
var fetchWalletView_createServerFn_handler = createServerRpc({
	id: "cde8304b1bd44f8f6b25ae1303be7e2643b712f741ca76dd1f62bdda4206c287",
	name: "fetchWalletView",
	filename: "src/lib/cookie/rpc.ts"
}, (opts) => fetchWalletView.__executeServer(opts));
var fetchWalletView = createServerFn({ method: "POST" }).validator(object({ address: string().min(32).max(64) })).handler(fetchWalletView_createServerFn_handler, async ({ data }) => {
	const lamports = await rpc("getBalance", [data.address, { commitment: "confirmed" }]);
	return {
		lamports,
		cook: lamports / 1e9
	};
});
var fetchActivity_createServerFn_handler = createServerRpc({
	id: "329869b973338fbd7ee4dd70762aefe4e3a90d83e0deaba63557d5d6f3f1c2e2",
	name: "fetchActivity",
	filename: "src/lib/cookie/rpc.ts"
}, (opts) => fetchActivity.__executeServer(opts));
var fetchActivity = createServerFn({ method: "POST" }).validator(object({ address: string().min(32).max(64) })).handler(fetchActivity_createServerFn_handler, async ({ data }) => {
	return (await rpc("getSignaturesForAddress", [data.address, { limit: 12 }]) ?? []).map((r) => ({
		signature: r.signature,
		slot: r.slot,
		failed: Boolean(r.err),
		memo: r.memo ?? null,
		blockTime: r.blockTime ?? null
	}));
});
var fetchBlockhash_createServerFn_handler = createServerRpc({
	id: "b646e72e597ad485cfd7321cfcc5ba5c88ff100ba34bacb12ca4d754d26823b8",
	name: "fetchBlockhash",
	filename: "src/lib/cookie/rpc.ts"
}, (opts) => fetchBlockhash.__executeServer(opts));
var fetchBlockhash = createServerFn({ method: "POST" }).handler(fetchBlockhash_createServerFn_handler, async () => {
	return (await rpc("getLatestBlockhash", [{ commitment: "confirmed" }])).value;
});
var sendRawBake_createServerFn_handler = createServerRpc({
	id: "2a2d21ac019b419c3f1c84c6787a4fd71e929f1043639d734ee00ff4228a4e53",
	name: "sendRawBake",
	filename: "src/lib/cookie/rpc.ts"
}, (opts) => sendRawBake.__executeServer(opts));
var sendRawBake = createServerFn({ method: "POST" }).validator(object({ raw: string().min(32) })).handler(sendRawBake_createServerFn_handler, async ({ data }) => {
	return { signature: await rpc("sendRawTransaction", [data.raw, {
		encoding: "base64",
		skipPreflight: false,
		preflightCommitment: "confirmed"
	}]) };
});
var confirmSignature_createServerFn_handler = createServerRpc({
	id: "e946a3677858f0178ef12fede53057d6ec6a879662148ccfb87648a8f9ce1869",
	name: "confirmSignature",
	filename: "src/lib/cookie/rpc.ts"
}, (opts) => confirmSignature.__executeServer(opts));
var confirmSignature = createServerFn({ method: "POST" }).validator(object({ signature: string().min(32) })).handler(confirmSignature_createServerFn_handler, async ({ data }) => {
	for (let i = 0; i < 24; i += 1) {
		const value = (await rpc("getSignatureStatuses", [[data.signature]]))?.value?.[0];
		if (value?.err) return {
			status: "failed",
			err: JSON.stringify(value.err)
		};
		if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") return { status: "confirmed" };
		await new Promise((r) => setTimeout(r, 400));
	}
	return { status: "pending" };
});
//#endregion
export { confirmSignature_createServerFn_handler, fetchActivity_createServerFn_handler, fetchBlockhash_createServerFn_handler, fetchPulse_createServerFn_handler, fetchWalletView_createServerFn_handler, sendRawBake_createServerFn_handler };
