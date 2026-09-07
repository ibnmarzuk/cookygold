import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Cookie,
  ExternalLink,
  Flame,
  Loader2,
  Sparkles,
  Unplug,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  BRIDGE,
  COOKIE_GENESIS,
  COOKIE_MCP,
  COOKIEBOX,
  COOKIESWAP,
  DOCS,
  EXPLORER,
  HOME,
  NIGHTLY,
  explorerAddr,
  explorerTx,
  shortAddr,
} from "@/lib/cookie/constants";
import {
  confirmSignature,
  fetchActivity,
  fetchBlockhash,
  fetchPulse,
  fetchWalletView,
  sendRawBake,
  type ActivityRow,
  type ChainPulse,
  type WalletView,
} from "@/lib/cookie/rpc";
import { mintFortune } from "@/lib/cookie/fortune";
import { buildBakeTx, toBase64 } from "@/lib/cookie/tx";
import {
  connectDemoAddress,
  connectNightly,
  getNightly,
  type NightlySolana,
} from "@/lib/cookie/wallet";
import { cn } from "@/lib/utils";

type Status = { kind: "idle" | "pending" | "ok" | "bad"; text: string; sig?: string };

export function OvenApp({ initialPulse }: { initialPulse?: ChainPulse | null }) {
  const [nightlyOn, setNightlyOn] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<NightlySolana | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [pulse, setPulse] = useState<ChainPulse | null>(initialPulse ?? null);
  const [pulseError, setPulseError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [connectHelpOpen, setConnectHelpOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const tick = () => setNightlyOn(Boolean(getNightly()));
    tick();
    const id = setInterval(tick, 1500);
    return () => clearInterval(id);
  }, []);

  const loadPulse = useCallback(async () => {
    try {
      const p = await fetchPulse();
      setPulse(p);
      setPulseError(null);
    } catch (err) {
      setPulseError(err instanceof Error ? err.message : "Could not read Cookie RPC");
    }
  }, []);

  const loadWallet = useCallback(async (addr: string) => {
    try {
      const [w, a] = await Promise.all([fetchWalletView({ data: { address: addr } }), fetchActivity({ data: { address: addr } })]);
      setWallet(w);
      setActivity(a);
    } catch {
      /* pulse still works */
    }
  }, []);

  useEffect(() => {
    void loadPulse();
    const id = setInterval(() => void loadPulse(), 12_000);
    return () => clearInterval(id);
  }, [loadPulse]);

  useEffect(() => {
    if (!address) return;
    void loadWallet(address);
    const id = setInterval(() => void loadWallet(address), 12_000);
    return () => clearInterval(id);
  }, [address, loadWallet]);

  async function onConnect() {
    setBusy("connect");
    setStatus({ kind: "pending", text: "Opening wallet. Approve Cookie Chain if prompted." });
    try {
      const session = await connectNightly();
      setProvider(session.provider);
      setAddress(session.address);
      setConnectHelpOpen(false);
      setStatus({
        kind: "ok",
        text: `Connected ${session.address}`,
      });
    } catch (err) {
      setConnectHelpOpen(true);
      setStatus({ kind: "bad", text: humanError(err) });
    } finally {
      setBusy("");
    }
  }

  function onConnectDemo(customAddr?: string) {
    const session = connectDemoAddress(customAddr);
    setProvider(session.provider);
    setAddress(session.address);
    setConnectHelpOpen(false);
    setStatus({
      kind: "ok",
      text: `Connected Demo Account ${session.address} (Read-only preview)`,
    });
  }

  function onDisconnect() {
    void provider?.disconnect?.();
    setProvider(null);
    setAddress(null);
    setWallet(null);
    setActivity([]);
    setStatus({ kind: "idle", text: "" });
  }

  async function onBake() {
    if (!address || !provider) {
      setStatus({ kind: "bad", text: "Connect Nightly first." });
      return;
    }
    if (provider.isDemo) {
      setStatus({
        kind: "bad",
        text: "Demo wallet is read-only. To sign real transactions on Cookie Chain, open the app in a new window with your Nightly wallet connected.",
      });
      return;
    }
    setBusy("bake");
    setStatus({ kind: "pending", text: "Minting a fortune, then asking Nightly to sign." });
    try {
      const { fortune, source } = await mintFortune({ data: { note } });
      const { blockhash } = await fetchBlockhash();
      const tx = buildBakeTx(address, fortune, blockhash);
      setStatus({
        kind: "pending",
        text: `Fortune (${source}): ${fortune}\nSign in Nightly…`,
      });

      let signature = "";
      if (typeof provider.signAndSendTransaction === "function") {
        const result = await provider.signAndSendTransaction(tx);
        signature = typeof result === "string" ? result : (result?.signature ?? "");
      } else if (typeof provider.signTransaction === "function") {
        const signed = await provider.signTransaction(tx);
        const raw = toBase64(signed.serialize({ requireAllSignatures: false }));
        const sent = await sendRawBake({ data: { raw } });
        signature = sent.signature;
      } else {
        throw new Error("This Nightly build cannot sign Solana transactions here.");
      }
      if (!signature) throw new Error("Wallet returned no signature.");

      setStatus({ kind: "pending", text: `Submitted ${signature}\nWaiting for confirmation…` });
      const conf = await confirmSignature({ data: { signature } });
      if (conf.status === "failed") {
        throw new Error(conf.err ?? "Transaction failed on-chain");
      }
      setStatus({
        kind: "ok",
        text:
          conf.status === "confirmed"
            ? `Baked on Cookie Chain.\n${fortune}`
            : `Submitted. Confirmation is still landing — open CookieScan.`,
        sig: signature,
      });
      setNote("");
      await loadWallet(address);
    } catch (err) {
      setStatus({ kind: "bad", text: humanError(err) });
    } finally {
      setBusy("");
    }
  }

  const chartData = useMemo(
    () => pulse?.samples.map((s) => ({ slot: s.slot, tps: s.tps })) ?? [],
    [pulse],
  );

  return (
    <div className="oven-grain min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="oven-ring grid size-12 place-items-center rounded-2xl shadow-lg shadow-ember/20">
              <Cookie className="size-6 text-bg" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Cookie Chain cApp</p>
              <h1 className="text-3xl text-fg sm:text-4xl">The Oven</h1>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-border bg-surface p-4 sm:w-auto sm:min-w-80">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={cn("rounded-full border px-2.5 py-1 text-xs", nightlyOn ? "border-ok/40 text-ok" : "border-border text-muted")}>
                {nightlyOn ? "Wallet injected" : "Nightly not injected in iframe"}
              </span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">rpc.cookiescan.io</span>
            </div>
            {address ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <a
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    href={explorerAddr(address)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortAddr(address, 6)}
                  </a>
                  {provider?.isDemo && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Demo Account
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-ok/30 px-3 py-1 text-sm tabular-nums text-ok">
                    {wallet ? `${wallet.cook.toFixed(6)} COOK` : "balance…"}
                  </span>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-fg"
                    onClick={onDisconnect}
                  >
                    <Unplug className="size-4" aria-hidden />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void onConnect()}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-bg disabled:opacity-50 transition-colors hover:brightness-110 active:scale-[0.99]"
                >
                  {busy === "connect" ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
                  {busy === "connect" ? "Connecting…" : (nightlyOn ? "Connect Wallet" : "Connect Nightly")}
                </button>

                {(!nightlyOn || connectHelpOpen) && (
                  <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-border bg-bg/70 p-3 text-xs">
                    <div className="flex items-start gap-2 text-muted">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                      <p className="leading-relaxed">
                        {nightlyOn
                          ? "Click connect to approve in your wallet extension."
                          : "Preview iframe blocks extensions or Nightly is not installed."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onConnectDemo()}
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-surface px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <Sparkles className="size-3.5" aria-hidden />
                        Explore with Demo Wallet (72.66 COOK)
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(window.location.href, "_blank")}
                          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-fg transition-colors hover:bg-bg"
                        >
                          <ExternalLink className="size-3" aria-hidden />
                          Open in Tab
                        </button>
                        <a
                          href={NIGHTLY}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-muted transition-colors hover:text-fg hover:bg-bg"
                        >
                          Get Nightly
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </div>

                      {showCustomInput ? (
                        <div className="mt-1 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Paste base58 address..."
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-fg placeholder:text-muted/60 outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customInput.trim().length >= 32) {
                                onConnectDemo(customInput.trim());
                              }
                            }}
                            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-bg"
                          >
                            Load
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(true)}
                          className="pt-0.5 text-left text-[11px] text-muted underline underline-offset-2 hover:text-fg"
                        >
                          Or inspect custom address...
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-8">
            <h2 className="text-4xl leading-none text-fg sm:text-5xl">Bake a crumb on Cookie Chain.</h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted italic font-display">
              One Nightly signature writes a fortune into the Memo program and pokes the SVM with a tiny self-transfer.
            </p>

            <label htmlFor="crumb" className="mt-8 mb-2 block text-xs tracking-wide text-muted uppercase">
              Optional crumb · 80 chars
            </label>
            <textarea
              id="crumb"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
              placeholder="gm oven / ship the cApp / community kitchen"
              className="min-h-24 w-full resize-y rounded-2xl border border-border bg-bg px-4 py-3 text-fg outline-none ring-primary/40 focus:ring-2"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={Boolean(busy) || !address}
                onClick={() => void onBake()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-bg disabled:opacity-50"
              >
                {busy === "bake" ? <Loader2 className="size-4 animate-spin" /> : <Flame className="size-4" />}
                {busy === "bake" ? "Baking…" : "Bake on-chain"}
              </button>
              <a
                href={BRIDGE}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm text-fg"
              >
                Cookie Chain Bridge
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>

            {status.kind !== "idle" && status.text ? (
              <div
                className={cn(
                  "mt-5 whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm",
                  status.kind === "pending" && "border-primary/40 text-primary",
                  status.kind === "ok" && "border-ok/40 text-ok",
                  status.kind === "bad" && "border-bad/40 text-bad",
                )}
              >
                {status.text}
                {status.sig ? (
                  <div className="mt-2">
                    <a className="underline underline-offset-4" href={explorerTx(status.sig)} target="_blank" rel="noreferrer">
                      Open on CookieScan
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted">
                Nightly is required to sign. If this preview cannot see the extension, open the published app in a desktop tab with Nightly installed. Live pulse below still reads Cookie Chain.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-muted">
              <Activity className="size-4" aria-hidden />
              <h3 className="font-display text-xl text-fg">Chain pulse</h3>
            </div>
            {pulseError ? <p className="text-sm text-bad">{pulseError}</p> : null}
            <div className="grid grid-cols-2 gap-3">
              <Stat label="confirmed slot" value={pulse?.slot?.toLocaleString() ?? "—"} />
              <Stat label="approx TPS" value={pulse?.tps?.toLocaleString() ?? "—"} />
              <Stat label="Agave / SVM" value={pulse?.version ?? "—"} />
              <Stat label="RPC health" value={pulse?.health ?? "—"} />
            </div>
            <div className="mt-5 h-32">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tpsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        color: "var(--color-fg)",
                      }}
                      formatter={(v) => [`${v} tps`, "TPS"]}
                    />
                    <Area type="monotone" dataKey="tps" stroke="var(--color-primary)" fill="url(#tpsFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted">Waiting on performance samples…</div>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              Genesis {COOKIE_GENESIS.slice(0, 8)}…{COOKIE_GENESIS.slice(-4)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="font-display text-xl">Your oven activity</h3>
            {address == null ? (
              <p className="mt-3 text-sm text-muted">Connect Nightly to load signatures for this wallet from Cookie RPC.</p>
            ) : activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No recent signatures yet. Bake once and they land here.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="text-xs tracking-wide text-muted uppercase">
                    <tr>
                      <th className="pb-2 font-medium">signature</th>
                      <th className="pb-2 font-medium">slot</th>
                      <th className="pb-2 font-medium">status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr key={row.signature} className="border-t border-border">
                        <td className="py-3">
                          <a className="text-primary" href={explorerTx(row.signature)} target="_blank" rel="noreferrer">
                            {shortAddr(row.signature)}
                          </a>
                          {row.memo ? <div className="mt-1 max-w-xs truncate text-xs text-muted">{row.memo}</div> : null}
                        </td>
                        <td className="py-3 tabular-nums">{row.slot.toLocaleString()}</td>
                        <td className="py-3">{row.failed ? "failed" : "ok"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="font-display text-xl">Kitchen rails</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Required Nightly path plus public Cookie infrastructure. Bridge COOK from Solana if the wallet is empty, then bake.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                [HOME, "cookiechain.wtf"],
                [DOCS, "Docs"],
                [EXPLORER, "CookieScan"],
                [BRIDGE, "Hyperlane Bridge"],
                [COOKIEBOX, "Cookiebox"],
                [COOKIESWAP, "Cookieswap"],
                [NIGHTLY, "Get Nightly"],
                [COOKIE_MCP, "cookie-mcp"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-fg"
                >
                  {label}
                </a>
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted">
              Programs: Memo ({"MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"}) + System Program self-transfer. No custody. Nightly signs on your machine.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg px-3 py-3">
      <div className="font-display text-lg tabular-nums text-fg">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function humanError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/rejected|denied|cancel/i.test(msg)) return "Signature rejected in Nightly.";
  if (/insufficient|no record of a prior credit|0x1/i.test(msg)) {
    return "Not enough COOK for fees. Bridge from Solana first.";
  }
  return msg;
}
