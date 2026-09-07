import { o as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createServerFn } from "./ssr.mjs";
import { i as string, r as object } from "../_libs/zod.mjs";
import { a as Flame, c as Activity, i as LoaderCircle, n as Unplug, o as ExternalLink, s as Cookie, t as Wallet } from "../_libs/lucide-react.mjs";
import { a as fetchBlockhash, c as sendRawBake, i as fetchActivity, l as createSsrRpc, n as Route, o as fetchPulse, r as confirmSignature, s as fetchWalletView } from "./router-Dz3t96xx.mjs";
import { a as COOKIE_GENESIS, c as DOCS, d as MEMO_PROGRAM, f as NIGHTLY, h as shortAddr, i as COOKIESWAP, l as EXPLORER, m as explorerTx, n as BRIDGE, o as COOKIE_MCP, p as explorerAddr, r as COOKIEBOX, s as COOKIE_RPC, t as BAKE_LAMPORTS, u as HOME } from "./constants-BTNxadDz.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { i as Tooltip, n as Area, r as ResponsiveContainer, t as AreaChart } from "../_libs/recharts+[...].mjs";
import { i as TransactionInstruction, n as SystemProgram, r as Transaction, t as PublicKey } from "../_libs/@solana/web3.js.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CXlpDbBl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var mintFortune = createServerFn({ method: "POST" }).validator(object({ note: string().max(80).optional() })).handler(createSsrRpc("907727ddbfc44c154aed1df5c21733358069360d999122ab058a40a50f532c13"));
function buildBakeTx(fromBase58, fortune, blockhash) {
	const from = new PublicKey(fromBase58);
	const encoded = new TextEncoder().encode(fortune);
	const memoIx = new TransactionInstruction({
		keys: [],
		programId: new PublicKey(MEMO_PROGRAM),
		data: encoded
	});
	const tipIx = SystemProgram.transfer({
		fromPubkey: from,
		toPubkey: from,
		lamports: BAKE_LAMPORTS
	});
	const tx = new Transaction().add(memoIx, tipIx);
	tx.feePayer = from;
	tx.recentBlockhash = blockhash;
	return tx;
}
function toBase64(bytes) {
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary);
}
function getNightly() {
	if (typeof window === "undefined") return null;
	return window.nightly?.solana ?? null;
}
function pubkeyToString(value) {
	if (!value) return "";
	if (typeof value === "string") return value;
	if (typeof value === "object" && value !== null && "toBase58" in value) {
		const fn = value.toBase58;
		if (typeof fn === "function") return fn.call(value);
	}
	return String(value);
}
async function connectNightly() {
	const provider = getNightly();
	if (!provider) throw new Error("Nightly is not injected in this tab. Install Nightly, then open this app in a normal browser window.");
	if (provider.changeNetwork) try {
		await provider.changeNetwork({
			genesisHash: COOKIE_GENESIS,
			url: COOKIE_RPC
		});
	} catch {}
	const res = await provider.connect();
	const address = pubkeyToString(res?.publicKey ?? res?.address ?? provider.publicKey);
	if (!address) throw new Error("Nightly connected but returned no public key.");
	return {
		provider,
		address
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function OvenApp({ initialPulse }) {
	const [nightlyOn, setNightlyOn] = (0, import_react.useState)(false);
	const [address, setAddress] = (0, import_react.useState)(null);
	const [provider, setProvider] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)({
		kind: "idle",
		text: ""
	});
	const [pulse, setPulse] = (0, import_react.useState)(initialPulse ?? null);
	const [pulseError, setPulseError] = (0, import_react.useState)(null);
	const [wallet, setWallet] = (0, import_react.useState)(null);
	const [activity, setActivity] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const tick = () => setNightlyOn(Boolean(getNightly()));
		tick();
		const id = setInterval(tick, 1500);
		return () => clearInterval(id);
	}, []);
	const loadPulse = (0, import_react.useCallback)(async () => {
		try {
			const p = await fetchPulse();
			setPulse(p);
			setPulseError(null);
		} catch (err) {
			setPulseError(err instanceof Error ? err.message : "Could not read Cookie RPC");
		}
	}, []);
	const loadWallet = (0, import_react.useCallback)(async (addr) => {
		try {
			const [w, a] = await Promise.all([fetchWalletView({ data: { address: addr } }), fetchActivity({ data: { address: addr } })]);
			setWallet(w);
			setActivity(a);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		loadPulse();
		const id = setInterval(() => void loadPulse(), 12e3);
		return () => clearInterval(id);
	}, [loadPulse]);
	(0, import_react.useEffect)(() => {
		if (!address) return;
		loadWallet(address);
		const id = setInterval(() => void loadWallet(address), 12e3);
		return () => clearInterval(id);
	}, [address, loadWallet]);
	async function onConnect() {
		setBusy("connect");
		setStatus({
			kind: "pending",
			text: "Opening Nightly. Approve Cookie Chain if prompted."
		});
		try {
			const session = await connectNightly();
			setProvider(session.provider);
			setAddress(session.address);
			setStatus({
				kind: "ok",
				text: `Connected ${session.address}`
			});
		} catch (err) {
			setStatus({
				kind: "bad",
				text: humanError(err)
			});
		} finally {
			setBusy("");
		}
	}
	function onDisconnect() {
		provider?.disconnect?.();
		setProvider(null);
		setAddress(null);
		setWallet(null);
		setActivity([]);
		setStatus({
			kind: "idle",
			text: ""
		});
	}
	async function onBake() {
		if (!address || !provider) {
			setStatus({
				kind: "bad",
				text: "Connect Nightly first."
			});
			return;
		}
		setBusy("bake");
		setStatus({
			kind: "pending",
			text: "Minting a fortune, then asking Nightly to sign."
		});
		try {
			const { fortune, source } = await mintFortune({ data: { note } });
			const { blockhash } = await fetchBlockhash();
			const tx = buildBakeTx(address, fortune, blockhash);
			setStatus({
				kind: "pending",
				text: `Fortune (${source}): ${fortune}\nSign in Nightly…`
			});
			let signature = "";
			if (typeof provider.signAndSendTransaction === "function") {
				const result = await provider.signAndSendTransaction(tx);
				signature = typeof result === "string" ? result : result?.signature ?? "";
			} else if (typeof provider.signTransaction === "function") {
				const raw = toBase64((await provider.signTransaction(tx)).serialize({ requireAllSignatures: false }));
				signature = (await sendRawBake({ data: { raw } })).signature;
			} else throw new Error("This Nightly build cannot sign Solana transactions here.");
			if (!signature) throw new Error("Wallet returned no signature.");
			setStatus({
				kind: "pending",
				text: `Submitted ${signature}\nWaiting for confirmation…`
			});
			const conf = await confirmSignature({ data: { signature } });
			if (conf.status === "failed") throw new Error(conf.err ?? "Transaction failed on-chain");
			setStatus({
				kind: "ok",
				text: conf.status === "confirmed" ? `Baked on Cookie Chain.\n${fortune}` : `Submitted. Confirmation is still landing — open CookieScan.`,
				sig: signature
			});
			setNote("");
			await loadWallet(address);
		} catch (err) {
			setStatus({
				kind: "bad",
				text: humanError(err)
			});
		} finally {
			setBusy("");
		}
	}
	const chartData = (0, import_react.useMemo)(() => pulse?.samples.map((s) => ({
		slot: s.slot,
		tps: s.tps
	})) ?? [], [pulse]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "oven-grain min-h-screen",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "oven-ring grid size-12 place-items-center rounded-2xl shadow-lg shadow-ember/20",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cookie, {
								className: "size-6 text-bg",
								"aria-hidden": true
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-[0.18em] text-muted uppercase",
							children: "Cookie Chain cApp"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-3xl text-fg sm:text-4xl",
							children: "The Oven"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-full rounded-2xl border border-border bg-surface p-4 sm:w-auto sm:min-w-80",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("rounded-full border px-2.5 py-1 text-xs", nightlyOn ? "border-ok/40 text-ok" : "border-border text-muted"),
								children: nightlyOn ? "Nightly injected" : "Nightly missing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-border px-2.5 py-1 text-xs text-muted",
								children: "rpc.cookiescan.io"
							})]
						}), address ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "font-medium text-primary underline-offset-4 hover:underline",
								href: explorerAddr(address),
								target: "_blank",
								rel: "noreferrer",
								children: shortAddr(address, 6)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full border border-ok/30 px-3 py-1 text-sm tabular-nums text-ok",
									children: wallet ? `${wallet.cook.toFixed(6)} COOK` : "balance…"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-fg",
									onClick: onDisconnect,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, {
										className: "size-4",
										"aria-hidden": true
									}), "Disconnect"]
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: Boolean(busy),
							onClick: () => void onConnect(),
							className: "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-bg disabled:opacity-50",
							children: [busy === "connect" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }), busy === "connect" ? "Connecting…" : "Connect Nightly"]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-4 lg:grid-cols-[1.2fr_0.8fr]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-border bg-surface p-5 sm:p-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-4xl leading-none text-fg sm:text-5xl",
								children: "Bake a crumb on Cookie Chain."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-xl text-lg leading-relaxed text-muted italic font-display",
								children: "One Nightly signature writes a fortune into the Memo program and pokes the SVM with a tiny self-transfer."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "crumb",
								className: "mt-8 mb-2 block text-xs tracking-wide text-muted uppercase",
								children: "Optional crumb · 80 chars"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "crumb",
								value: note,
								maxLength: 80,
								onChange: (e) => setNote(e.target.value),
								placeholder: "gm oven / ship the cApp / community kitchen",
								className: "min-h-24 w-full resize-y rounded-2xl border border-border bg-bg px-4 py-3 text-fg outline-none ring-primary/40 focus:ring-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: Boolean(busy) || !address,
									onClick: () => void onBake(),
									className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-bg disabled:opacity-50",
									children: [busy === "bake" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "size-4" }), busy === "bake" ? "Baking…" : "Bake on-chain"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: BRIDGE,
									target: "_blank",
									rel: "noreferrer",
									className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm text-fg",
									children: ["Cookie Chain Bridge", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, {
										className: "size-3.5",
										"aria-hidden": true
									})]
								})]
							}),
							status.kind !== "idle" && status.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("mt-5 whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm", status.kind === "pending" && "border-primary/40 text-primary", status.kind === "ok" && "border-ok/40 text-ok", status.kind === "bad" && "border-bad/40 text-bad"),
								children: [status.text, status.sig ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "underline underline-offset-4",
										href: explorerTx(status.sig),
										target: "_blank",
										rel: "noreferrer",
										children: "Open on CookieScan"
									})
								}) : null]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 text-sm text-muted",
								children: "Nightly is required to sign. If this preview cannot see the extension, open the published app in a desktop tab with Nightly installed. Live pulse below still reads Cookie Chain."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-border bg-surface p-5 sm:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 flex items-center gap-2 text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, {
									className: "size-4",
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-display text-xl text-fg",
									children: "Chain pulse"
								})]
							}),
							pulseError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-bad",
								children: pulseError
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "confirmed slot",
										value: pulse?.slot?.toLocaleString() ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "approx TPS",
										value: pulse?.tps?.toLocaleString() ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "Agave / SVM",
										value: pulse?.version ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										label: "RPC health",
										value: pulse?.health ?? "—"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5 h-32",
								children: chartData.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
									width: "100%",
									height: "100%",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
										data: chartData,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
												id: "tpsFill",
												x1: "0",
												y1: "0",
												x2: "0",
												y2: "1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "0%",
													stopColor: "var(--color-primary)",
													stopOpacity: .35
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
													offset: "100%",
													stopColor: "var(--color-primary)",
													stopOpacity: 0
												})]
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
												contentStyle: {
													background: "var(--color-bg)",
													border: "1px solid var(--color-border)",
													borderRadius: 12,
													color: "var(--color-fg)"
												},
												formatter: (v) => [`${v} tps`, "TPS"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
												type: "monotone",
												dataKey: "tps",
												stroke: "var(--color-primary)",
												fill: "url(#tpsFill)",
												strokeWidth: 2
											})
										]
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-full place-items-center text-sm text-muted",
									children: "Waiting on performance samples…"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-muted",
								children: [
									"Genesis ",
									COOKIE_GENESIS.slice(0, 8),
									"…",
									COOKIE_GENESIS.slice(-4)
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-4 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-border bg-surface p-5 sm:p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-xl",
							children: "Your oven activity"
						}), address == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "Connect Nightly to load signatures for this wallet from Cookie RPC."
						}) : activity.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "No recent signatures yet. Bake once and they land here."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-full min-w-[28rem] text-left text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "text-xs tracking-wide text-muted uppercase",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "pb-2 font-medium",
											children: "signature"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "pb-2 font-medium",
											children: "slot"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "pb-2 font-medium",
											children: "status"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: activity.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-t border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "py-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												className: "text-primary",
												href: explorerTx(row.signature),
												target: "_blank",
												rel: "noreferrer",
												children: shortAddr(row.signature)
											}), row.memo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-1 max-w-xs truncate text-xs text-muted",
												children: row.memo
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-3 tabular-nums",
											children: row.slot.toLocaleString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-3",
											children: row.failed ? "failed" : "ok"
										})
									]
								}, row.signature)) })]
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-3xl border border-border bg-surface p-5 sm:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-xl",
								children: "Kitchen rails"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm leading-relaxed text-muted",
								children: "Required Nightly path plus public Cookie infrastructure. Bridge COOK from Solana if the wallet is empty, then bake."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 flex flex-wrap gap-2",
								children: [
									[HOME, "cookiechain.wtf"],
									[DOCS, "Docs"],
									[EXPLORER, "CookieScan"],
									[BRIDGE, "Hyperlane Bridge"],
									[COOKIEBOX, "Cookiebox"],
									[COOKIESWAP, "Cookieswap"],
									[NIGHTLY, "Get Nightly"],
									[COOKIE_MCP, "cookie-mcp"]
								].map(([href, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href,
									target: "_blank",
									rel: "noreferrer",
									className: "inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-fg",
									children: label
								}, href))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-6 text-xs leading-relaxed text-muted",
								children: [
									"Programs: Memo (",
									"MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
									") + System Program self-transfer. No custody. Nightly signs on your machine."
								]
							})
						]
					})]
				})
			]
		})
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-bg px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-display text-lg tabular-nums text-fg",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs text-muted",
			children: label
		})]
	});
}
function humanError(err) {
	const msg = err instanceof Error ? err.message : String(err);
	if (/rejected|denied|cancel/i.test(msg)) return "Signature rejected in Nightly.";
	if (/insufficient|no record of a prior credit|0x1/i.test(msg)) return "Not enough COOK for fees. Bridge from Solana first.";
	return msg;
}
function Home() {
	const initialPulse = Route.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OvenApp, { initialPulse });
}
//#endregion
export { Home as component };
