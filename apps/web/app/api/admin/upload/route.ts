import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import { isAdminRole } from "@/lib/permissions";
import { checkRateLimit, getIp } from "@/lib/rateLimit";
import { adminRateLimit } from "@/lib/adminGuard";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = adminRateLimit((session.user as any).id ?? (session.user as any).email ?? "unknown");
  if (rl) return rl;
  if (!checkRateLimit(`admin-upload:${getIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string | null) ?? "naturals/products";
  const slug = form.get("slug") as string | null;
  const position = form.get("position") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "A valid product slug is required for naming" }, { status: 400 });
  }
  if (position !== null && !/^\d+$/.test(position)) {
    return NextResponse.json({ error: "Invalid position" }, { status: 400 });
  }

  // Filenames always follow {slug}.{ext} (main image) or {slug}-{position}.{ext}
  // (gallery image) — never a random name — so this endpoint stays in sync
  // with scripts/migrate-image-naming.mjs's convention. upsert:true so
  // re-uploading a product's image replaces it in place instead of leaking
  // orphaned files in storage.
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const name = position !== null ? `${slug}-${position}.${ext}` : `${slug}.${ext}`;
  const path = `${folder}/${name}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const client = getSupabaseAdmin();
  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
