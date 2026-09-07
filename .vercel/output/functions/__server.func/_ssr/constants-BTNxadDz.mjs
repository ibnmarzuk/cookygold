//#region node_modules/.nitro/vite/services/ssr/assets/constants-BTNxadDz.js
var COOKIE_RPC = "https://rpc.cookiescan.io";
var COOKIE_GENESIS = "9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2";
var EXPLORER = "https://cookiescan.io";
var BRIDGE = "https://hyperlane.cookiescan.io";
var DOCS = "https://docs.cookiechain.wtf";
var HOME = "https://www.cookiechain.wtf";
var COOKIEBOX = "https://agg.cookiebox.app";
var COOKIESWAP = "https://swap.cookiescan.io";
var NIGHTLY = "https://nightly.app";
var COOKIE_MCP = "https://github.com/cookiechain/cookie-mcp";
var MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
var BAKE_LAMPORTS = 5e3;
function shortAddr(addr, size = 4) {
	if (addr.length <= size * 2 + 1) return addr;
	return `${addr.slice(0, size)}…${addr.slice(-size)}`;
}
function explorerTx(sig) {
	return `${EXPLORER}/tx/${sig}`;
}
function explorerAddr(addr) {
	return `${EXPLORER}/address/${addr}`;
}
//#endregion
export { COOKIE_GENESIS as a, DOCS as c, MEMO_PROGRAM as d, NIGHTLY as f, shortAddr as h, COOKIESWAP as i, EXPLORER as l, explorerTx as m, BRIDGE as n, COOKIE_MCP as o, explorerAddr as p, COOKIEBOX as r, COOKIE_RPC as s, BAKE_LAMPORTS as t, HOME as u };
