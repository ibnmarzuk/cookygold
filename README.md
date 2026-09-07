# The Oven — Cookie Chain cApp

Nightly-first web app on **Cookie Chain** (community SVM).

Connect Nightly, switch onto `https://rpc.cookiescan.io`, bake a crumb: a **Memo program** fortune plus a tiny **System Program** self-transfer. The UI waits for confirmation, shows errors, lists wallet activity from Cookie RPC, and surfaces live chain pulse (slot, TPS, runtime version, COOK balance).

## Brief coverage

| Requirement | The Oven |
|---|---|
| Built on Cookie Chain (SVM) | Reads and writes via `rpc.cookiescan.io` |
| Nightly required | `window.nightly.solana` + `changeNetwork` |
| Display address | Header + CookieScan link |
| Transaction execution | Memo + self-transfer, signed in Nightly |
| Confirmation | Poll `getSignatureStatuses` |
| Errors / feedback | Rejects, empty COOK, RPC errors |
| App data | Fortune, bake status, signature feed |
| Dashboard | Slot, TPS chart, Agave version |
| Ecosystem | Cookiebox, Cookieswap, CookieScan, cookie-mcp, Hyperlane |
| Open source + README | This repo |

## Addresses

- Cookie RPC: `https://rpc.cookiescan.io`
- Genesis hash: `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2`
- Memo: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- Explorer: https://cookiescan.io
- Bridge: https://hyperlane.cookiescan.io

## User flow

1. Install [Nightly](https://nightly.app).
2. Bridge COOK via [Hyperlane](https://hyperlane.cookiescan.io) if empty.
3. Connect Nightly. Approve Cookie Chain network switch.
4. Optional note → Bake on-chain.
5. Watch pending → confirmed. Open the signature on CookieScan.

## Demo thread (X)

1/ The Oven is a Cookie Chain cApp. Nightly in, crumb out. One signature writes a fortune to the Memo program on the community SVM.

2/ Flow: Connect Nightly → switch RPC to rpc.cookiescan.io → bake. Confirmation + errors live in the UI. Activity is your real signatures.

3/ Need COOK on Cookie Chain first? Bridge from Solana: https://hyperlane.cookiescan.io

4/ Kitchen: CookieScan, Cookiebox, Cookieswap, cookie-mcp. Share this thread in Telegram: https://t.me/TheCookieNetChain
