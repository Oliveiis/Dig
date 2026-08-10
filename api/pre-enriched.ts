import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HK_ISLAND_MVP_POIS } from "../src/data/hk-island-mvp";

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
) {
  try {
    res.json(HK_ISLAND_MVP_POIS);
  } catch {
    res.json([]);
  }
}
