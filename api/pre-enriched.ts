import { readPreEnriched } from "./_lib/enrich";

export default async function handler(_req: any, res: any) {
  return res.json(readPreEnriched());
}
