import { sign } from "jsonwebtoken";

export function generateAccessToken(payload: { id: string }) {
  if (process.env.SIGNING_KEY)
    return sign(payload, process.env.SIGNING_KEY, { expiresIn: 600 });
  return "";
}
