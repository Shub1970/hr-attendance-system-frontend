import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE;

async function proxyEmployeeRequest(id: string, method: "PUT" | "DELETE", body?: unknown) {
  try {
    const response = await fetch(`${API_BASE}/employees/${id}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "application/json";
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return NextResponse.json({ detail: "Unable to reach employee service." }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!API_BASE) {
    return NextResponse.json({ detail: "API base URL is not configured." }, { status: 500 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body." }, { status: 400 });
  }

  return proxyEmployeeRequest(id, "PUT", body);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!API_BASE) {
    return NextResponse.json({ detail: "API base URL is not configured." }, { status: 500 });
  }

  const { id } = await params;

  return proxyEmployeeRequest(id, "DELETE");
}
