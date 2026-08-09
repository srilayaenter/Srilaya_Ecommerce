import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isOwner } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

type ImportLine = { rawMaterialId: string; qty: number; note?: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!checkRateLimit(`admin-import:${getIp(req)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { lines, invoiceRef } = await req.json() as { lines: ImportLine[]; invoiceRef?: string };

  if (!lines?.length) return NextResponse.json({ error: 'No lines' }, { status: 400 });

  const note = invoiceRef ? `Evenmore invoice: ${invoiceRef}` : 'Evenmore invoice import';

  await prisma.$transaction(
    lines.map(l =>
      prisma.rawMaterial.update({
        where: { id: l.rawMaterialId },
        data: {
          stockQty: { increment: l.qty },
          stockLogs: {
            create: { type: 'purchase', qty: l.qty, note },
          },
        },
      })
    )
  );

  return NextResponse.json({ ok: true, count: lines.length });
}
