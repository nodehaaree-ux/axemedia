import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content, platform, status, scheduledAt, clientId, imageUrl, tags } = body;
    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        platform,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        clientId: clientId ? parseInt(clientId) : null,
        imageUrl,
        tags,
        publishedAt: status === "published" ? new Date() : null,
      },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.post.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
