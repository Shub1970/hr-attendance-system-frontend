import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE;

export async function POST(request: Request) {
  if (!API_BASE) {
    return NextResponse.json({ detail: "API base URL is not configured." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return NextResponse.json({ detail: "Unable to reach attendance service." }, { status: 502 });
  }
}
