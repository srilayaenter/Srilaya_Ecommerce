import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isOwner } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function normalise(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Convert PDF to images using pdf-parse for text, falling back to base64 for vision
async function extractFromPdf(buffer: Buffer): Promise<{ text: string } | null> {
  try {
    const pdfParse = (await import('pdf-parse')).default as unknown as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return { text: data.text };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured in .env' }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const buffer   = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'application/octet-stream';
  const isPdf    = file.name.endsWith('.pdf') || mimeType === 'application/pdf';
  const isImage  = mimeType.startsWith('image/');

  // Build the message content for Claude
  let messageContent: Anthropic.MessageParam['content'];

  if (isPdf) {
    // Try text extraction first (faster, cheaper)
    const extracted = await extractFromPdf(buffer);
    if (extracted?.text && extracted.text.trim().length > 100) {
      // Send as text
      messageContent = [
        {
          type: 'text',
          text: `Here is the text extracted from a purchase bill PDF. Extract all purchased items.\n\n${extracted.text}`,
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ];
    } else {
      // Send PDF directly via document API
      messageContent = [
        {
          type: 'document' as any,
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: buffer.toString('base64'),
          },
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ];
    }
  } else if (isImage) {
    const validMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)
      ? mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      : 'image/jpeg';
    messageContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: validMime,
          data: buffer.toString('base64'),
        },
      },
      { type: 'text', text: EXTRACTION_PROMPT },
    ];
  } else {
    return NextResponse.json({ error: 'Upload a PDF or image file (JPG, PNG, WebP)' }, { status: 400 });
  }

  // Call Claude
  let aiResponse: string;
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: messageContent }],
    });
    aiResponse = (msg.content[0] as any).text ?? '';
  } catch (e: any) {
    return NextResponse.json({ error: `AI parsing failed: ${e.message}` }, { status: 500 });
  }

  // Parse the JSON Claude returns
  let extracted: { vendor: string; date: string; items: { name: string; qty: number; unit: string; price?: number }[] };
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    extracted = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({
      error: 'Could not parse AI response. The bill may be unclear or unreadable.',
      rawAiResponse: aiResponse,
    }, { status: 422 });
  }

  // Match items to existing raw materials
  const materials = await prisma.rawMaterial.findMany({ select: { id: true, name: true, unit: true } });
  const matByNorm: Record<string, { id: string; name: string; unit: string }> = {};
  for (const m of materials) matByNorm[normalise(m.name)] = m;

  const matched: {
    name: string; qty: number; unit: string; price?: number;
    rawMaterialId: string; rawMaterialName: string; isNew: boolean;
  }[] = [];
  const unmatched: { name: string; qty: number; unit: string; price?: number }[] = [];

  for (const item of extracted.items) {
    const norm = normalise(item.name);
    // Fuzzy: exact match, or starts-with, or contains
    const found = matByNorm[norm]
      ?? Object.values(matByNorm).find(m => normalise(m.name).includes(norm) || norm.includes(normalise(m.name)));

    if (found) {
      matched.push({
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        price: item.price,
        rawMaterialId: found.id,
        rawMaterialName: found.name,
        isNew: false,
      });
    } else {
      unmatched.push({ name: item.name, qty: item.qty, unit: item.unit, price: item.price });
    }
  }

  return NextResponse.json({
    vendor: extracted.vendor,
    date: extracted.date,
    matched,
    unmatched,
  });
}

const EXTRACTION_PROMPT = `
You are reading a purchase bill/invoice. Extract all purchased items.

Return ONLY a JSON object in this exact format — no explanation, no markdown:
{
  "vendor": "vendor/supplier name or Unknown",
  "date": "date on the bill or today",
  "items": [
    { "name": "product name", "qty": 5.0, "unit": "kg", "price": 197.00 },
    ...
  ]
}

Rules:
- qty must be a number (convert grams to kg: 500g → 0.5, 250g → 0.25)
- unit should be "kg", "g", "litre", or "nos"
- price is per-unit price if visible, otherwise omit
- Include every line item that looks like a product purchase
- Ignore tax totals, shipping, grand total rows
- Use the actual product name as written on the bill
`.trim();
