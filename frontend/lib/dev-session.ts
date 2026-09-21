import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "kabadiwala_dev_session";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.DEV_AUTH_SECRET;

  if (!secret) {
    throw new Error("DEV_AUTH_SECRET is not configured.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createDevSession(userId: string) {
  const expiresAt = Math.floor(
    (Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000) / 1000,
  );

  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyDevSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parts = value.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userId, expiresAtText, providedSignature] = parts;
  const expiresAt = Number(expiresAtText);

  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expectedSignature = sign(`${userId}.${expiresAt}`);

  const provided = Buffer.from(providedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (provided.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(provided, expected)) {
    return null;
  }

  return {
    userId,
    expiresAt,
  };
}

export const DEV_SESSION_COOKIE_NAME = COOKIE_NAME;
