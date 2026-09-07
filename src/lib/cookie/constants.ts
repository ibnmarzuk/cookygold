export const COOKIE_RPC = "https://rpc.cookiescan.io";
export const COOKIE_GENESIS = "9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2";
export const EXPLORER = "https://cookiescan.io";
export const BRIDGE = "https://hyperlane.cookiescan.io";
export const DOCS = "https://docs.cookiechain.wtf";
export const HOME = "https://www.cookiechain.wtf";
export const COOKIEBOX = "https://agg.cookiebox.app";
export const COOKIESWAP = "https://swap.cookiescan.io";
export const NIGHTLY = "https://nightly.app";
export const COOKIE_MCP = "https://github.com/cookiechain/cookie-mcp";
export const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const BAKE_LAMPORTS = 5_000;

export function shortAddr(addr: string, size = 4) {
  if (addr.length <= size * 2 + 1) return addr;
  return `${addr.slice(0, size)}…${addr.slice(-size)}`;
}

export function explorerTx(sig: string) {
  return `${EXPLORER}/tx/${sig}`;
}

export function explorerAddr(addr: string) {
  return `${EXPLORER}/address/${addr}`;
}
