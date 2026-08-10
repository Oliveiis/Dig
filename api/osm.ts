import type { VercelRequest, VercelResponse } from "@vercel/node";

const OVERPASS_INSTANCES = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.kappatheta.me/api/interpreter",
  "https://overpass.paws.fi/api/interpreter",
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const candidates = [...OVERPASS_INSTANCES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  const controllers = candidates.map(() => new AbortController());

  const requests = candidates.map(async (instanceUrl, index) => {
    const controller = controllers[index];
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(instanceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "DigStreetExplorer/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  });

  try {
    const data = await Promise.any(requests);
    controllers.forEach((controller) => controller.abort());
    return res.json(data);
  } catch (error) {
    controllers.forEach((controller) => controller.abort());
    console.warn("All raced Overpass instances failed:", error);
    return res.status(502).json({
      error: "All Overpass instances failed or timed out",
    });
  }
}
