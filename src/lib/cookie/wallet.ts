import { COOKIE_GENESIS, COOKIE_RPC } from "./constants";

export type NightlySolana = {
  connect: () => Promise<{ publicKey?: unknown; address?: string } | undefined>;
  disconnect?: () => Promise<void>;
  publicKey?: unknown;
  changeNetwork?: (n: { genesisHash: string; url?: string }) => Promise<void>;
  signAndSendTransaction?: (tx: unknown) => Promise<{ signature?: string } | string>;
  signTransaction?: (tx: unknown) => Promise<{ serialize: (opts?: unknown) => Uint8Array }>;
  isDemo?: boolean;
};

export const DEMO_COOKIE_ADDRESS = "8uY6sMQKqgHsb1S1trEYeH25974Zv93jHn1A46Hn6GaV";

export function getNightly(): NightlySolana | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    nightly?: { solana?: NightlySolana };
    phantom?: { solana?: NightlySolana };
    solana?: NightlySolana;
  };
  return w.nightly?.solana ?? w.phantom?.solana ?? w.solana ?? null;
}

export function isWalletInjected(): boolean {
  return getNightly() !== null;
}

export function pubkeyToString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toBase58" in value) {
    const fn = (value as { toBase58?: () => string }).toBase58;
    if (typeof fn === "function") return fn.call(value);
  }
  return String(value);
}

export async function connectNightly(): Promise<{ provider: NightlySolana; address: string }> {
  const provider = getNightly();
  if (!provider) {
    throw new Error("Nightly is not injected in this tab. Install Nightly, then open this app in a normal browser window.");
  }
  if (provider.changeNetwork) {
    try {
      await provider.changeNetwork({ genesisHash: COOKIE_GENESIS, url: COOKIE_RPC });
    } catch {
      // User may already be on Cookie Chain or dismiss the prompt; still try connect.
    }
  }
  const res = await provider.connect();
  const address = pubkeyToString(res?.publicKey ?? res?.address ?? provider.publicKey);
  if (!address) throw new Error("Nightly connected but returned no public key.");
  return { provider, address };
}

export function connectDemoAddress(customAddr?: string): { provider: NightlySolana; address: string } {
  const addr = (customAddr || DEMO_COOKIE_ADDRESS).trim();
  const provider: NightlySolana = {
    isDemo: true,
    connect: async () => ({ address: addr }),
    disconnect: async () => {},
    publicKey: addr,
  };
  return { provider, address: addr };
}
