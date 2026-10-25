import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { AppError } from "../errors/AppError.js";

const cursorSchema = z.strictObject({
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}(?::\d{2})?$/),
  id: z.string().min(1),
  fingerprint: z.string().length(64),
});

export type CursorData = z.infer<typeof cursorSchema>;

const getSecret = () => {
  const secret = process.env.CURSOR_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("CURSOR_SECRET must contain at least 32 characters");
  }

  return secret;
};

export function getFilterFingerprint(filters: object): string {
  return createHash("sha256")
    .update(JSON.stringify(filters))
    .digest("hex");
}

export function encodeCursor(payload: CursorData): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function decodeCursor(
  cursor: string,
  expectedFingerprint: string
): CursorData {
  const invalid = () =>
    new AppError(400, "Invalid or expired cursor", "INVALID_CURSOR");

  const parts = cursor.split(".");

  if (parts.length !== 2) throw invalid();

  const [body, signature] = parts;

  const expectedSignature = createHmac("sha256", getSecret())
    .update(body)
    .digest();

  let receivedSignature: Buffer;

  try {
    receivedSignature = Buffer.from(signature, "base64url");
  } catch {
    throw invalid();
  }

  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    throw invalid();
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw invalid();
  }

  const result = cursorSchema.safeParse(decoded);

  if (!result.success || result.data.fingerprint !== expectedFingerprint) {
    throw invalid();
  }

  return result.data;
}