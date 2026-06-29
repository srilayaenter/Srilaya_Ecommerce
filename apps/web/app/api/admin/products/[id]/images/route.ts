import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET — list images for a product
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(images);
}

// POST — add an image
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager", "inventory_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const { url, alt } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const count = await prisma.productImage.count({ where: { productId: id } });
  const image = await prisma.productImage.create({
    data: { productId: id, url, alt: alt ?? "", position: count },
  });
  return NextResponse.json(image);
}

// PATCH — reorder or update alt text  { images: [{ id, position, alt }] }
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager", "inventory_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: productId } = await params;
  const { images } = await req.json() as { images: { id: string; position: number; alt?: string }[] };

  await Promise.all(
    images.map(img =>
      prisma.productImage.update({
        where: { id: img.id, productId },
        data: { position: img.position, alt: img.alt },
      })
    )
  );
  return NextResponse.json({ success: true });
}

// DELETE — remove one image  ?imageId=xxx
export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager", "inventory_staff"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: productId } = await params;
  const imageId = new URL(req.url).searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  await prisma.productImage.delete({ where: { id: imageId, productId } });
  return NextResponse.json({ success: true });
}
