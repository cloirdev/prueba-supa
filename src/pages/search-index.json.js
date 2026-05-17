import { buildSearchIndex } from "../lib/searchIndex.js";

export async function GET() {
  const items = await buildSearchIndex();
  return new Response(JSON.stringify(items), {
    headers: { "Content-Type": "application/json" },
  });
}
