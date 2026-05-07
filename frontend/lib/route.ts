import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/gateway/schema/efda`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { message: "Schema fetch failed", error: String(e) },
      { status: 500 }
    );
  }
}