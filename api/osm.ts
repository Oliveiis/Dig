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

  // Shuffle instances to distribute load
  const shuffledInstances = [...OVERPASS_INSTANCES].sort(
    () => Math.random() - 0.5
  );

  for (const instanceUrl of shuffledInstances) {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

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

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(
            `Overpass instance ${instanceUrl} failed with status ${response.status} (Attempt ${attempts}/${maxAttempts})`
          );
          if (
            response.status === 504 ||
            response.status === 429 ||
            response.status === 502 ||
            response.status === 503
          ) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1500 * attempts)
            );
            continue;
          }
          break;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn(
            `Overpass instance ${instanceUrl} returned non-JSON content: ${contentType}`
          );
          break;
        }

        const text = await response.text();
        try {
          const data = JSON.parse(text);
          return res.json(data);
        } catch (parseError) {
          console.error(
            `Failed to parse JSON from ${instanceUrl}:`,
            text.substring(0, 100)
          );
          break;
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.warn(
            `Overpass instance ${instanceUrl} timed out (Attempt ${attempts}/${maxAttempts})`
          );
          continue;
        } else {
          console.error(
            `Error fetching from OSM instance ${instanceUrl}:`,
            error.message || error
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
      }
    }
  }

  res.status(502).json({ error: "All Overpass instances failed or timed out" });
}
