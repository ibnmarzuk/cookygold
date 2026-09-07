import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from 'https://esm.sh/@solana/web3.js@1.98.4'
import { Buffer } from 'https://esm.sh/buffer@6.0.3'

export const COOKIE_RPC = 'https://rpc.cookiescan.io'
export const COOKIE_WSS = 'wss://rpc.cookiescan.io'
export const COOKIE_GENESIS = '9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2'
export const EXPLORER = 'https://cookiescan.io'
export const BRIDGE = 'https://hyperlane.cookiescan.io'
export const DOCS = 'https://docs.cookiechain.wtf'
export const HOME = 'https://www.cookiechain.wtf'
export const COOKIEBOX = 'https://agg.cookiebox.app'
export const COOKIESWAP = 'https://swap.cookiescan.io'
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

export const connection = new Connection(COOKIE_RPC, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60_000,
})

export function getNightly() {
  return window.nightly?.solana ?? null
}

export async function switchToCookieChain(provider) {
  if (!provider?.changeNetwork) {
    throw new Error('Nightly changeNetwork is missing. Update Nightly and stay on the Solana adapter.')
  }
  await provider.changeNetwork({
    genesisHash: COOKIE_GENESIS,
    url: COOKIE_RPC,
  })
}

export async function connectNightly() {
  const provider = getNightly()
  if (!provider) {
    throw new Error('Nightly wallet not found. Install the Nightly extension from nightly.app, then refresh.')
  }
  try {
    await switchToCookieChain(provider)
  } catch (err) {
    console.warn('changeNetwork prompt failed or was skipped', err)
  }
  const res = await provider.connect()
  const pubkey =
    res?.publicKey ??
    provider.publicKey ??
    res?.address
  if (!pubkey) throw new Error('Nightly connected but returned no public key.')
  const publicKey = typeof pubkey === 'string' ? new PublicKey(pubkey) : new PublicKey(pubkey.toString())
  return { provider, publicKey }
}

export function shortAddr(addr) {
  const s = String(addr)
  return s.slice(0, 4) + '…' + s.slice(-4)
}

export async function fetchPulse() {
  const [slot, version, supply, perf] = await Promise.all([
    connection.getSlot('confirmed'),
    connection.getVersion(),
    connection.getSupply({ commitment: 'confirmed' }).catch(() => null),
    connection.getRecentPerformanceSamples(4).catch(() => []),
  ])
  const tps = Array.isArray(perf) && perf[0]?.numTransactions && perf[0]?.samplePeriodSecs
    ? Math.round(perf[0].numTransactions / perf[0].samplePeriodSecs)
    : null
  return {
    slot,
    version: version?.['solana-core'] ?? 'unknown',
    circulating: supply?.value?.circulating ?? null,
    total: supply?.value?.total ?? null,
    tps,
  }
}

export async function fetchBalance(publicKey) {
  const lamports = await connection.getBalance(publicKey, 'confirmed')
  return {
    lamports,
    cook: lamports / LAMPORTS_PER_SOL,
  }
}

export async function fetchActivity(publicKey, limit = 12) {
  const sigs = await connection.getSignaturesForAddress(publicKey, { limit })
  return sigs.map((s) => ({
    signature: s.signature,
    slot: s.slot,
    err: s.err,
    memo: s.memo,
    blockTime: s.blockTime,
  }))
}

const FORTUNES = [
  'The oven is community-run. So is your luck.',
  'Sub-second finality. Infinite crumbs.',
  'Toly said fork SVM. You just did culture.',
  'Cheap deploys beat expensive opinions.',
  'A validator set is a kitchen crew.',
  'Bridge in. Bake. Bridge out. Repeat.',
  'Memo is memory. Memory is on-chain.',
  'Nightly signs. The chain remembers.',
  'Fees so small they taste like sugar.',
  'Build something degenerate. Document it well.',
]

export function bakeFortune(userNote) {
  const pick = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
  const note = (userNote || '').trim().slice(0, 80)
  const body = note ? `${pick} | crumb: ${note}` : pick
  return `OVEN:${body}`.slice(0, 180)
}

export function buildBakeTx({ from, fortune, lamports = 5000 }) {
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(fortune, 'utf8'),
  })
  const tipIx = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: from,
    lamports,
  })
  const tx = new Transaction().add(memoIx, tipIx)
  tx.feePayer = from
  return tx
}

export async function sendBake({ provider, publicKey, fortune }) {
  const latest = await connection.getLatestBlockhash('confirmed')
  const tx = buildBakeTx({ from: publicKey, fortune })
  tx.recentBlockhash = latest.blockhash

  if (typeof provider.signAndSendTransaction === 'function') {
    const result = await provider.signAndSendTransaction(tx)
    const signature = result?.signature ?? result
    if (!signature) throw new Error('Wallet returned no signature.')
    return { signature: String(signature), blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }
  }

  if (typeof provider.signTransaction === 'function') {
    const signed = await provider.signTransaction(tx)
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
    })
    return { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }
  }

  throw new Error('Nightly provider cannot sign transactions on this page.')
}

export async function confirmSig(signature) {
  for (let i = 0; i < 24; i += 1) {
    const st = await connection.getSignatureStatuses([signature])
    const value = st?.value?.[0]
    if (value?.err) {
      throw new Error('Transaction landed with an on-chain error: ' + JSON.stringify(value.err))
    }
    if (value?.confirmationStatus === 'confirmed' || value?.confirmationStatus === 'finalized') {
      return value
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('Timed out waiting for confirmation. Check CookieScan with the signature.')
}

export function explorerTx(sig) {
  return `${EXPLORER}/tx/${sig}`
}

export function explorerAddr(addr) {
  return `${EXPLORER}/address/${addr}`
}

export { PublicKey, LAMPORTS_PER_SOL }
