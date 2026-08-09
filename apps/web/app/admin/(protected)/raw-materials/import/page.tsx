import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isOwner } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import ImportClient from './ImportClient';
import { Lightbulb } from "@phosphor-icons/react/dist/ssr";

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.role ?? '')) notFound();

  const aiEnabled = !!(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here'
  );

  const materials = await prisma.rawMaterial.findMany({
    select: { id: true, name: true, unit: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Import Purchase Bill</h1>
          <p className="text-sm text-[#8D6E63] mt-1">
            {aiEnabled
              ? 'AI reads any bill automatically — PDF, photo, or WhatsApp screenshot'
              : 'Enter purchase details manually · Add AI scanning anytime by setting ANTHROPIC_API_KEY'}
          </p>
        </div>
        <Link href="/admin/raw-materials"
          className="text-sm text-[#006A38] font-bold hover:underline">← Raw Materials</Link>
      </div>

      {!aiEnabled && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <Lightbulb size={14} weight="regular" className="inline-block mr-1" /><strong>AI bill scanning is available</strong> — get an Anthropic API key at{' '}
          <span className="font-mono bg-blue-100 px-1 rounded">console.anthropic.com</span> and add{' '}
          <span className="font-mono bg-blue-100 px-1 rounded">ANTHROPIC_API_KEY=sk-ant-...</span> to{' '}
          <span className="font-mono bg-blue-100 px-1 rounded">apps/web/.env</span> to enable photo/PDF scanning.
          Costs ≈ ₹1–2 per scan.
        </div>
      )}

      <ImportClient aiEnabled={aiEnabled} materials={materials} />
    </div>
  );
}
