import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

const ALLOWED_ROLES = ["owner", "admin", "manager"];
// NOTE: Supabase Storage's CDN caches objects by path and does not reliably
// bust that cache on upsert/overwrite (observed: identical eTag returned after
// delete+recreate with different content). Use a NEW path suffixed with the
// APK's versionCode for every release rather than overwriting this path in place.
const APK_PATH = "private/srilaya-ops/app-release-v3.apk";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Storage not configured on this environment" }, { status: 503 });
  }

  const { data, error } = await client.storage.from(STORAGE_BUCKET).download(APK_PATH);

  if (error || !data) {
    return NextResponse.json(
      { error: "APK not found in storage yet. Upload it to the media bucket at " + APK_PATH },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="SriLaYaOps.apk"',
    },
  });
}
