import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COOKIE_RPC } from "./constants";

const ALLOWED = new Set([
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
  "sendRawTransaction",
]);

async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  if (!ALLOWED.has(method)) {
    throw new Error(`RPC method not allowed: ${method}`);
  }
  const res = await fetch(COOKIE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Cookie RPC HTTP ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message?: string } };
  if (json.error) throw new Error(json.error.message ?? "Cookie RPC error");
  return json.result as T;
}

export type PulseSample = { slot: number; tps: number };
export type ChainPulse = {
  slot: number;
  version: string;
  health: string;
  tps: number | null;
  samples: PulseSample[];
  circulating: number | null;
};

export const fetchPulse = createServerFn({ method: "POST" }).handler(
  async (): Promise<ChainPulse> => {
    const [slot, version, health, samples, supply] = await Promise.all([
      rpc<number>("getSlot"),
      rpc<{ "solana-core"?: string }>("getVersion"),
      rpc<string>("getHealth").catch(() => "unknown"),
      rpc<
        {
          slot: number;
          numTransactions: number;
          samplePeriodSecs: number;
        }[]
      >("getRecentPerformanceSamples", [12]).catch(() => []),
      rpc<{ value?: { circulating?: number } }>("getSupply").catch(() => null),
    ]);

    const mapped: PulseSample[] = (samples ?? [])
      .slice()
      .reverse()
      .map((s) => ({
        slot: s.slot,
        tps: s.samplePeriodSecs ? Math.round(s.numTransactions / s.samplePeriodSecs) : 0,
      }));

    return {
      slot,
      version: version?.["solana-core"] ?? "unknown",
      health,
      tps: mapped.at(-1)?.tps ?? null,
      samples: mapped,
      circulating: supply?.value?.circulating ?? null,
    };
  },
);

export type WalletView = {
  lamports: number;
  cook: number;
};

export const fetchWalletView = createServerFn({ method: "POST" })
  .validator(z.object({ address: z.string().min(32).max(64) }))
  .handler(async ({ data }): Promise<WalletView> => {
    const lamports = await rpc<number>("getBalance", [data.address, { commitment: "confirmed" }]);
    return { lamports, cook: lamports / 1_000_000_000 };
  });

export type ActivityRow = {
  signature: string;
  slot: number;
  failed: boolean;
  memo: string | null;
  blockTime: number | null;
};

export const fetchActivity = createServerFn({ method: "POST" })
  .validator(z.object({ address: z.string().min(32).max(64) }))
  .handler(async ({ data }): Promise<ActivityRow[]> => {
    const rows = await rpc<
      {
        signature: string;
        slot: number;
        err: unknown;
        memo?: string | null;
        blockTime?: number | null;
      }[]
    >("getSignaturesForAddress", [data.address, { limit: 12 }]);
    return (rows ?? []).map((r) => ({
      signature: r.signature,
      slot: r.slot,
      failed: Boolean(r.err),
      memo: r.memo ?? null,
      blockTime: r.blockTime ?? null,
    }));
  });

export const fetchBlockhash = createServerFn({ method: "POST" }).handler(async () => {
  const latest = await rpc<{
    value: { blockhash: string; lastValidBlockHeight: number };
  }>("getLatestBlockhash", [{ commitment: "confirmed" }]);
  return latest.value;
});

export const sendRawBake = createServerFn({ method: "POST" })
  .validator(z.object({ raw: z.string().min(32) }))
  .handler(async ({ data }): Promise<{ signature: string }> => {
    const signature = await rpc<string>("sendRawTransaction", [
      data.raw,
      { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed" },
    ]);
    return { signature };
  });

export const confirmSignature = createServerFn({ method: "POST" })
  .validator(z.object({ signature: z.string().min(32) }))
  .handler(async ({ data }): Promise<{ status: "confirmed" | "pending" | "failed"; err?: string }> => {
    for (let i = 0; i < 24; i += 1) {
      const st = await rpc<{
        value: ({ confirmationStatus?: string; err?: unknown } | null)[];
      }>("getSignatureStatuses", [[data.signature]]);
      const value = st?.value?.[0];
      if (value?.err) {
        return { status: "failed", err: JSON.stringify(value.err) };
      }
      if (value?.confirmationStatus === "confirmed" || value?.confirmationStatus === "finalized") {
        return { status: "confirmed" };
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return { status: "pending" };
  });
