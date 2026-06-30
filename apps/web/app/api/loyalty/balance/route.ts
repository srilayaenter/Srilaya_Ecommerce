import { NextResponse } from "next/server";
import { getBalance } from "@/lib/loyalty";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ balance: 0 });
  }
  const balance = await getBalance(email);
  return NextResponse.json({ balance });
}
