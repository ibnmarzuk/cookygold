import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { BAKE_LAMPORTS, MEMO_PROGRAM } from "./constants";

export function buildBakeTx(fromBase58: string, fortune: string, blockhash: string) {
  const from = new PublicKey(fromBase58);
  const encoded = new TextEncoder().encode(fortune);
  const memoIx = new TransactionInstruction({
    keys: [],
    programId: new PublicKey(MEMO_PROGRAM),
    data: encoded as unknown as Buffer,
  });
  const tipIx = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: from,
    lamports: BAKE_LAMPORTS,
  });
  const tx = new Transaction().add(memoIx, tipIx);
  tx.feePayer = from;
  tx.recentBlockhash = blockhash;
  return tx;
}

export function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
