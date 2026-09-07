# The Oven — Cookie Chain cApp

A public, Nightly-first web app on **Cookie Chain** (community SVM).

Connect Nightly, switch onto `https://rpc.cookiescan.io`, bake a crumb: a **Memo program** instruction plus a tiny **System Program** self-transfer. The UI waits for confirmation, shows errors, lists wallet activity from the Cookie RPC, and surfaces live chain pulse (slot, TPS sample, runtime version, COOK balance).

## Why this meets the brief

| Requirement | How The Oven does it |
|---|---|
| Built on Cookie Chain (SVM) | All reads/writes go to `https://rpc.cookiescan.io` |
| Nightly wallet required | `window.nightly.solana` connect + `changeNetwork({ genesisHash, url })` |
| Display connected address | Header + CookieScan link |
| Transaction execution | Memo + self-transfer, signed in Nightly |
| Confirmation handling | Poll `getSignatureStatuses` until confirmed/finalized |
| Error handling / feedback | Rejected sigs, empty COOK (bridge hint), RPC errors |
| App-specific data | Fortune text, bake status, wallet signature feed |
| Analytics / dashboard | Slot, TPS sample, Agave version, COOK balance |
| Ecosystem links | Cookiebox, Cookieswap/Candy Shop, CookieScan, cookie-mcp, Hyperlane bridge |
| Open source + README | This repo |
| Public deploy | Vite static build — host on Vercel / Netlify / GitHub Pages |

### Addresses used

- **Cookie RPC:** `https://rpc.cookiescan.io`
- **Genesis hash (Nightly network switch):** `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2`
- **Memo program:** `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- **System program:** native SVM system program (self-transfer of 5000 lamports)
- **Explorer:** https://cookiescan.io
- **Bridge:** https://hyperlane.cookiescan.io

No custom program deploy in v1. The brief asks for meaningful on-chain interaction, not a mandatory new program ID. Memo + system transfer is a real Cookie Chain transaction you can open on CookieScan.

## Setup

```bash
# Nightly extension: https://nightly.app
# Bridge COOK: https://hyperlane.cookiescan.io

npm install
npm run dev
```

Open the printed local URL. Install Nightly, approve the Cookie Chain network switch, bake.

```bash
npm run build
npm run preview
```

`dist/` is the static site. Point Vercel/Netlify at this folder (framework: Vite).

## User flow

1. Install [Nightly](https://nightly.app).
2. Bridge COOK from Solana via [Hyperlane](https://hyperlane.cookiescan.io) if the Cookie wallet is empty.
3. Click **Connect Nightly**. Approve `changeNetwork` if the popup appears.
4. Optional note → **Bake on-chain**.
5. Watch pending → confirmed (or a human error).
6. Open the signature on CookieScan. Activity table refreshes from RPC.

## Demo thread (copy for X)

1/ The Oven is a Cookie Chain cApp. Nightly in, crumb out. One signature writes a fortune to the Memo program on the community SVM.

2/ Flow: Connect Nightly → switch RPC to rpc.cookiescan.io → bake. Confirmation + errors live in the UI. Activity is your real signatures.

3/ Need COOK on Cookie Chain first? Bridge from Solana here: https://hyperlane.cookiescan.io

4/ Kitchen links: CookieScan, Cookiebox, Cookieswap, cookie-mcp. Then drop this thread in Telegram: https://t.me/TheCookieNetChain

## Submission checklist

- [ ] Push this repo to GitHub (public)
- [ ] Deploy `dist/` and paste the live URL
- [ ] Record Nightly connect + bake + CookieScan confirmation
- [ ] Post the X thread (include the bridge)
- [ ] Share the thread in Cookie Chain Telegram

## Stack

Vite, React 19, `@solana/web3.js` via esm.sh, Cookie Chain JSON-RPC, Nightly injected Solana provider.
