import { NextResponse } from "next/server";

export async function GET() {
  await Promise.resolve();
  return NextResponse.json({ message: "OK" });
}
