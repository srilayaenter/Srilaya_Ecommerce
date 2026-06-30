import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalised } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email: normalised, password: hashed, role: "customer" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
