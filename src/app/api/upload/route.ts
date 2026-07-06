import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE_BYTES = 40 * 1024 * 1024; // 40MB (4000x4000 PNG can be large)
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "posts");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nuk u gjet asnjë skedar" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Vetëm skedarë JPG dhe PNG lejohen" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Skedari është shumë i madh (max 40MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload dir exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename preserving extension
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/posts/${filename}`;
    return NextResponse.json({ url, filename });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gabim gjatë ngarkimit të skedarit" }, { status: 500 });
  }
}
