const UPSTREAM = "https://gongaji-service-article-staging-m3gra3glsq-et.a.run.app/v1/public/article"

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const upstreamUrl = `${UPSTREAM}${url.search}`

  try {
    const res = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
    })
    const body = await res.text()
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch {
    return Response.json({ status_code: 502, status: false, message: "Upstream article error" }, { status: 502 })
  }
}

