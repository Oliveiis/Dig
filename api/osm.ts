import { fetchOsm } from "./_lib/enrich";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const data = await fetchOsm(query);
    return res.json(data);
  } catch {
    return res.status(502).json({ error: "All Overpass instances failed or timed out" });
  }
}
