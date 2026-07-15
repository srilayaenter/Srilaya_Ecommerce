import crypto from "crypto";

function getEncKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return crypto.createHash("sha256").update(secret).digest(); // 32 bytes
}

// Secrets are stored as "enc:<hex_iv>:<hex_ciphertext>" using AES-256-CBC
// keyed from NEXTAUTH_SECRET. Plain secrets (legacy) are accepted on read.

export function encryptTotpSecret(plain: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `enc:${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptTotpSecret(stored: string): string {
  if (!stored.startsWith("enc:")) return stored; // legacy plain value
  const [, ivHex, dataHex] = stored.split(":");
  const decipher = crypto.createDecipheriv("aes-256-cbc", getEncKey(), Buffer.from(ivHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
