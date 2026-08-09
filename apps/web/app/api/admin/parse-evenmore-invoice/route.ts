import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isOwner } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

// Evenmore product name → normalised key (same as EB dict keys)
const EVENMORE_ALIASES: Record<string, string> = {
  // exact matches (lowercase) work automatically via normalise()
  // add aliases here if Evenmore uses different casing/abbreviations
  'barnyard millet flakes': 'barnyard flakes',
  'foxtail millet flakes': 'foxtail flakes',
  'little millet flakes': 'little flakes',
  'pearl millet flakes': 'pearl flakes',
  'kodo millet flakes': 'kodo flakes',
  'barnyard millet flour': 'barnyard flour',
  'foxtail millet flour': 'foxtail flour',
  'little millet flour': 'little flour',
  'pearl millet flour': 'pearl flour',
  'barnyard millet rava': 'barnyard rava',
  'foxtail millet rava': 'foxtail rava',
  'little millet rava': 'little rava',
  'pearl millet rava': 'pearl rava',
  'kodo millet rava': 'w sorghum rava',
  'barnyard millet rice': 'barnyard rice',
  'foxtail millet rice': 'foxtail rice',
  'little millet rice': 'little rice',
  'kodo millet rice': 'kodo rice',
  'barnyard millet parboiled rice': 'barnyard parboiled rice',
  'foxtail millet parboiled rice': 'foxtail parboiled rice',
  'little millet parboiled rice': 'little parboiled rice',
  'kodo millet parboiled rice': 'kodo parboiled rice',
  'palm jaggery': 'palm jaggery powder',
  'coconut jaggery': 'coconut jaggery powder',
  'white sorghum': 'white sorghum rice',
  'red sorghum': 'r sorghum',
  'jowar': 'r sorghum',
  'white jowar': 'white sorghum rice',
};

function normalise(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Parse lines from Evenmore PDF text.
// Evenmore invoices typically have rows like:
//   "Barnyard Flakes    5.000 Kg    ₹197.00    ₹985.00"
// We look for lines containing a unit (Kg / Gm / Nos) and a quantity before it.
function parseInvoiceLines(text: string): { raw: string; name: string; qty: number; unit: string }[] {
  const results: { raw: string; name: string; qty: number; unit: string }[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Pattern: <Name>  <qty> <unit>  [price] [total]
  // qty is a decimal number, unit is Kg|Gm|Ltr|Nos (case-insensitive)
  const lineRe = /^(.+?)\s+([\d,]+(?:\.\d+)?)\s*(kg|kgs|gm|gms|g|ltr|nos|pcs)\b/i;

  for (const line of lines) {
    const m = line.match(lineRe);
    if (!m) continue;

    const rawName = m[1].replace(/\d+[\d\s]*$/, '').trim(); // strip trailing serial numbers
    const qty     = parseFloat(m[2].replace(/,/g, ''));
    const unit    = m[3].toLowerCase().startsWith('g') && !m[3].toLowerCase().startsWith('kg') ? 'g' : 'kg';
    const qtyKg   = unit === 'g' ? qty / 1000 : qty;

    if (qty <= 0 || rawName.length < 3) continue;

    results.push({ raw: line, name: rawName, qty: qtyKg, unit: 'kg' });
  }

  return results;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!checkRateLimit(`admin-parse:${getIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = '';
  try {
    // Dynamic import to avoid Edge runtime issues
    // pdf-parse v2 ships ESM with no .default — cast to any to handle both CJS/ESM shapes
    const mod = await import('pdf-parse') as any;
    const pdfParse = (mod.default ?? mod) as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    text = data.text;
  } catch (e) {
    return NextResponse.json({ error: 'Could not parse PDF. Is it a valid Evenmore invoice?' }, { status: 422 });
  }

  const rawLines = parseInvoiceLines(text);

  // Fetch existing raw materials for matching
  const materials = await prisma.rawMaterial.findMany({ select: { id: true, name: true } });
  const matByName: Record<string, string> = {};
  for (const m of materials) matByName[normalise(m.name)] = m.id;

  const matched: { name: string; qty: number; rawMaterialId: string; rawMaterialName: string }[] = [];
  const unmatched: { name: string; qty: number }[] = [];

  for (const line of rawLines) {
    const norm     = normalise(line.name);
    const aliased  = EVENMORE_ALIASES[norm] ?? norm;
    const matId    = matByName[aliased] ?? matByName[norm];

    if (matId) {
      const rm = materials.find(m => m.id === matId)!;
      matched.push({ name: line.name, qty: line.qty, rawMaterialId: matId, rawMaterialName: rm.name });
    } else {
      unmatched.push({ name: line.name, qty: line.qty });
    }
  }

  return NextResponse.json({ matched, unmatched, rawText: text.slice(0, 3000) });
}
