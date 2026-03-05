// ============================================
// ENCRYPTION — Application-layer field encryption
// ============================================
// Used for OAuth tokens stored in ConnectedAccount.
// AES-256 symmetric encryption with a per-app key.
// ============================================

import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function getKey(): string {
  if (!ENCRYPTION_KEY) {
    throw new Error(
      "FATAL: ENCRYPTION_KEY environment variable is not set. Cannot start server.",
    );
  }
  return ENCRYPTION_KEY;
}

export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, getKey()).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getKey());
  return bytes.toString(CryptoJS.enc.Utf8);
}
