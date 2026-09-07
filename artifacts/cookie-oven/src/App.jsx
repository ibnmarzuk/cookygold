import { useCallback, useEffect, useState } from 'react'
import {
  BRIDGE,
  COOKIEBOX,
  COOKIESWAP,
  COOKIE_GENESIS,
  COOKIE_RPC,
  DOCS,
  EXPLORER,
  HOME,
  bakeFortune,
  confirmSig,
  connectNightly,
  connection,
  explorerAddr,
  explorerTx,
  fetchActivity,
  fetchBalance,
  fetchPulse,
  sendBake,
  shortAddr,
} from './chain.js'

export default function App() {
  const [wallet, setWallet] = useState(null)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState(null)
  const [pulse, setPulse] = useState(null)
  const [balance, setBalance] = useState(null)
  const [activity, setActivity] = useState([])
  const [nightlyOn, setNightlyOn] = useState(false)

  useEffect(() => {
    setNightlyOn(Boolean(window.nightly?.solana))
    const t = setInterval(() => setNightlyOn(Boolean(window.nightly?.solana)), 1500)
    return () => clearInterval(t)
  }, [])

  const refresh = useCallback(async (publicKey) => {
    try {
      const [p, b, a] = await Promise.all([
        fetchPulse(),
        publicKey ? fetchBalance(publicKey) : Promise.resolve(null),
        publicKey ? fetchActivity(publicKey) : Promise.resolve([]),
      ])
      setPulse(p)
      setBalance(b)
      setActivity(a)
    } catch (err) {
      console.warn(err)
    }
  }, [])

  useEffect(() => {
    refresh(wallet?.publicKey)
    const id = setInterval(() => refresh(wallet?.publicKey), 12_000)
    return () => clearInterval(id)
  }, [wallet, refresh])

  async function onConnect() {
    setBusy('connect')
    setStatus({ kind: 'pending', text: 'Opening Nightly… switch the adapter to Cookie Chain if prompted.' })
    try {
      const session = await connectNightly()
      setWallet(session)
      setStatus({
        kind: 'ok',
        text: `Connected ${session.publicKey.toBase58()}\nNetwork RPC ${COOKIE_RPC}\nGenesis ${COOKIE_GENESIS}`,
      })
      await refresh(session.publicKey)
    } catch (err) {
      setStatus({ kind: 'bad', text: err.message || String(err) })
    } finally {
      setBusy('')
    }
  }

  function onDisconnect() {
    try { wallet?.provider?.disconnect?.() } catch {}
    setWallet(null)
    setBalance(null)
    setActivity([])
    setStatus({ kind: 'ok', text: 'Disconnected.' })
  }

  async function onBake() {
    if (!wallet) {
      setStatus({ kind: 'bad', text: 'Connect Nightly first.' })
      return
    }
    setBusy('bake')
    const fortune = bakeFortune(note)
    setStatus({ kind: 'pending', text: `Building memo + self-transfer…\n${fortune}` })
    try {
      const sent = await sendBake({
        provider: wallet.provider,
        publicKey: wallet.publicKey,
        fortune,
      })
      setStatus({
        kind: 'pending',
        text: `Submitted ${sent.signature}\nWaiting for confirmed commitment on Cookie Chain…`,
      })
      try {
        await confirmSig(sent.signature, sent.lastValidBlockHeight)
      } catch (confirmErr) {
        await pollSignature(sent.signature)
        if (String(confirmErr).includes('landed with an on-chain error')) throw confirmErr
      }
      setStatus({
        kind: 'ok',
        text: `Baked.\n${sent.signature}\nFortune locked in the memo program.`,
        sig: sent.signature,
      })
      setNote('')
      await refresh(wallet.publicKey)
    } catch (err) {
      setStatus({ kind: 'bad', text: humanError(err) })
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="mark">🍪</div>
          <div>
            <h1>The Oven</h1>
            <p>Cookie Chain cApp · Nightly · memo bake · live SVM pulse</p>
          </div>
        </div>
        <div className="wallet-box">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className={`pill ${nightlyOn ? 'ok' : 'warn'}`}>
              {nightlyOn ? 'Nightly injected' : 'Nightly missing'}
            </span>
            <span className="pill">rpc.cookiescan.io</span>
          </div>
          {wallet ? (
            <>
              <div className="addr">
                <a href={explorerAddr(wallet.publicKey.toBase58())} target="_blank" rel="noreferrer">
                  {shortAddr(wallet.publicKey.toBase58())}
                </a>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <span className="pill ok">
                  {balance ? `${balance.cook.toFixed(6)} COOK` : 'balance…'}
                </span>
                <button className="ghost" onClick={onDisconnect}>Disconnect</button>
              </div>
            </>
          ) : (
            <button className="primary" disabled={Boolean(busy)} onClick={onConnect}>
              {busy === 'connect' ? 'Connecting…' : 'Connect Nightly'}
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="card">
          <h2>Bake a crumb on Cookie Chain.</h2>
          <p className="lede">
            One Nightly signature writes a fortune into the Memo program and pokes the SVM with a tiny self-transfer.
            Sub-second culture, cents for gas.
          </p>
          <label htmlFor="note">Optional crumb (80 chars)</label>
          <textarea
            id="note"
            value={note}
            maxLength={80}
            onChange={(e) => setNote(e.target.value)}
            placeholder="gm oven / Ilorin baker / ship the cApp"
          />
          <div className="row">
            <button className="primary" disabled={Boolean(busy) || !wallet} onClick={onBake}>
              {busy === 'bake' ? 'Baking…' : 'Bake on-chain'}
            </button>
            <a className="pill" href={BRIDGE} target="_blank" rel="noreferrer">Cookie Chain Bridge →</a>
          </div>
          {status && (
            <div className={`status ${status.kind}`}>
              {status.text}
              {status.sig && (
                <>
                  {'\n'}
                  <a href={explorerTx(status.sig)} target="_blank" rel="noreferrer">Open on CookieScan</a>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Chain pulse</h3>
          <div className="stats">
            <div className="stat">
              <b>{pulse?.slot?.toLocaleString() ?? '—'}</b>
              <span>confirmed slot</span>
            </div>
            <div className="stat">
              <b>{pulse?.tps ?? '—'}</b>
              <span>approx TPS</span>
            </div>
            <div className="stat">
              <b>{pulse?.version ?? '—'}</b>
              <span>Agave / SVM core</span>
            </div>
            <div className="stat">
              <b>{balance ? balance.cook.toFixed(4) : '—'}</b>
              <span>wallet COOK</span>
            </div>
          </div>
          <p style={{ color: '#b89a72', fontSize: 12, marginTop: 14 }}>
            Genesis <code>{COOKIE_GENESIS.slice(0, 8)}…</code>
          </p>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Your oven activity</h3>
          {activity.length === 0 ? (
            <p className="empty">Connect and bake. Signatures for this wallet appear here from Cookie RPC.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>signature</th>
                  <th>slot</th>
                  <th>status</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.signature}>
                    <td>
                      <a href={explorerTx(row.signature)} target="_blank" rel="noreferrer">
                        {shortAddr(row.signature)}
                      </a>
                      {row.memo ? <div style={{ color: '#b89a72' }}>{row.memo}</div> : null}
                    </td>
                    <td>{row.slot}</td>
                    <td>{row.err ? 'failed' : 'ok'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Ecosystem rails</h3>
          <p className="empty">
            Required Nightly path plus the public Cookie kitchen. Bridge COOK from Solana before you bake if the wallet is empty.
          </p>
          <div className="links">
            <a href={HOME} target="_blank" rel="noreferrer">cookiechain.wtf</a>
            <a href={DOCS} target="_blank" rel="noreferrer">Docs</a>
            <a href={EXPLORER} target="_blank" rel="noreferrer">CookieScan</a>
            <a href={BRIDGE} target="_blank" rel="noreferrer">Hyperlane Bridge</a>
            <a href={COOKIEBOX} target="_blank" rel="noreferrer">Cookiebox</a>
            <a href={COOKIESWAP} target="_blank" rel="noreferrer">Candy Shop / Cookieswap</a>
            <a href="https://nightly.app" target="_blank" rel="noreferrer">Get Nightly</a>
            <a href="https://github.com/cookiechain/cookie-mcp" target="_blank" rel="noreferrer">cookie-mcp</a>
          </div>
        </div>
      </section>

      <footer>
        Open source cApp for the Cookie Chain builder brief. No custody. Nightly signs on your machine.
        Program used: Solana Memo (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr) + System Program self-transfer.
      </footer>
    </div>
  )
}

function humanError(err) {
  const msg = err?.message || String(err)
  if (/rejected|denied|cancel/i.test(msg)) return 'Signature rejected in Nightly.'
  if (/insufficient|no record of a prior credit|0x1/i.test(msg)) {
    return 'Not enough COOK for fees. Bridge from Solana: https://hyperlane.cookiescan.io'
  }
  return msg
}

async function pollSignature(signature) {
  for (let i = 0; i < 20; i += 1) {
    const st = await connection.getSignatureStatuses([signature])
    const value = st?.value?.[0]
    if (value?.err) throw new Error('Transaction landed with an on-chain error: ' + JSON.stringify(value.err))
    if (value?.confirmationStatus === 'confirmed' || value?.confirmationStatus === 'finalized') return value
    await new Promise((r) => setTimeout(r, 400))
  }
}
