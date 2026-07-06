import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/setup
 * Creates the first admin user if none exist.
 * Call this once on first run: http://localhost:3000/api/setup
 */
export async function GET() {
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return NextResponse.json(
        { message: "Setup already completed. Users already exist." },
        { status: 400 }
      );
    }

    const password = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.create({
      data: {
        name:     "Administrator",
        email:    "admin@axemedia.al",
        password,
        role:     "admin",
        active:   true,
      },
    });

    return NextResponse.json({
      message:         "Admin user created successfully!",
      email:           user.email,
      defaultPassword: "admin123",
      note:            "Please change the password after first login.",
    });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
