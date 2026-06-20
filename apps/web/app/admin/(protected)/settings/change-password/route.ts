import { prisma } from "../../../../../lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { email, currentPassword, newPassword } = await request.json();

    if (!session || session.user?.email !== email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });

  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password", details: error.message },
      { status: 500 }
    );
  }
}