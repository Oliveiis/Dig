import type { VercelRequest, VercelResponse } from "@vercel/node";
import preEnrichedData from "../src/data/dig-pois.json";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.json(preEnrichedData);
  } catch {
    res.json([]);
  }
}
