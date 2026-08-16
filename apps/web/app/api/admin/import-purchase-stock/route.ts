import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isOwner } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rateLimit';
import { adminRateLimit } from '@/lib/adminGuard';

type ImportLine = {
  rawMaterialId?: string;       // existing material
  newName?: string;             // new material to create
  newUnit?: string;
  newCostPerUnit?: number;
  qty: number;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rl = adminRateLimit((session!.user as any).id ?? (session!.user as any).email ?? "unknown");
  if (rl) return rl;
  if (!checkRateLimit(`admin-import:${getIp(req)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { lines, vendor, billRef, billDate } = await req.json() as {
    lines: ImportLine[];
    vendor?: string;
    billRef?: string;
    billDate?: string;
  };

  if (!lines?.length) return NextResponse.json({ error: 'No lines provided' }, { status: 400 });

  const note = [
    vendor ? `Vendor: ${vendor}` : null,
    billRef ? `Ref: ${billRef}` : null,
    billDate ? `Date: ${billDate}` : null,
    'Purchase import',
  ].filter(Boolean).join(' · ');

  let created = 0, updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      if (line.qty <= 0) continue;

      let matId = line.rawMaterialId;

      // Create new raw material if needed
      if (!matId && line.newName) {
        const existing = await tx.rawMaterial.findFirst({
          where: { name: { equals: line.newName, mode: 'insensitive' } },
        });
        if (existing) {
          matId = existing.id;
        } else {
          const newMat = await tx.rawMaterial.create({
            data: {
              name: line.newName,
              unit: line.newUnit ?? 'kg',
              costPerUnit: line.newCostPerUnit ?? null,
              stockQty: 0,
            },
          });
          matId = newMat.id;
          created++;
        }
      }

      if (!matId) continue;

      await tx.rawMaterial.update({
        where: { id: matId },
        data: {
          stockQty: { increment: line.qty },
          ...(line.newCostPerUnit ? { costPerUnit: line.newCostPerUnit } : {}),
          stockLogs: {
            create: { type: 'purchase', qty: line.qty, note },
          },
        },
      });
      updated++;
    }
  });

  return NextResponse.json({ ok: true, created, updated });
}
