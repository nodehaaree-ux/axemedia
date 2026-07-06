import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file) return NextResponse.json({ error: "Nuk u gjet skedari" }, { status: 400 });

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Format i pavlefshëm. Lejohen: JPG, PNG, WEBP, SVG" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Skedari është shumë i madh (max 5MB)" }, { status: 400 });
    }

    const ext      = file.name.split(".").pop() || "png";
    const filename = `logo-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const logoUrl = `/uploads/${filename}`;

    const existing = await prisma.companySettings.findUnique({ where: { id: 1 } });
    if (existing) {
      await prisma.companySettings.update({ where: { id: 1 }, data: { logoUrl } });
    } else {
      await prisma.companySettings.create({ data: { logoUrl } });
    }

    return NextResponse.json({ url: logoUrl });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("POST /api/settings/logo error:", err);
    return NextResponse.json({ error: "Gabim gjatë ngarkimit" }, { status: 500 });
  }
}
