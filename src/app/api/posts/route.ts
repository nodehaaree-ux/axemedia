import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, platform, status, scheduledAt, clientId, imageUrl, tags } = body;
    if (!title || !platform) {
      return NextResponse.json({ error: "Titulli dhe platforma janë të detyrueshme" }, { status: 400 });
    }
    const post = await prisma.post.create({
      data: {
        title,
        content,
        platform,
        status: status || "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        clientId: clientId ? parseInt(clientId) : null,
        imageUrl,
        tags,
      },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
