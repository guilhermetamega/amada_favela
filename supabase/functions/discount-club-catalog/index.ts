import { corsHeaders, handleCors, json } from "../_shared/http.ts";

const CATALOG_URL = "https://lojasdomandela.com/lojas-1.json";

Deno.serve(async (request: Request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (request.method !== "GET") {
    return json(405, { error: "Método não permitido." }, { Allow: "GET, OPTIONS" });
  }

  try {
    const upstream = await fetch(CATALOG_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(25_000),
    });
    if (!upstream.ok) {
      return json(502, { error: `A API de lojas respondeu com status ${upstream.status}.` });
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      return json(502, { error: "A API de lojas não retornou JSON." });
    }

    const catalog = await upstream.json();
    return json(200, catalog, {
      ...corsHeaders,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    });
  } catch (error) {
    console.error("discount-club-catalog: upstream request failed", error);
    return json(502, { error: "Não foi possível acessar o catálogo de lojas agora." });
  }
});
