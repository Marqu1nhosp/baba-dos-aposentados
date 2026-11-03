const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function createToken(password: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`baba-admin:${password}`),
  );
  return toHex(signature);
}

export async function isValidSessionToken(token: string | undefined) {
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!token || !password || !secret) return false;

  const expected = await createToken(password, secret);
  return token === expected;
}

export async function createSessionToken(password: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return createToken(password, secret);
}
