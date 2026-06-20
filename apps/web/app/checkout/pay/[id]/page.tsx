import { prisma } from "../../../../lib/db";
import { notFound, redirect } from "next/navigation";
import { toNum } from "../../../../lib/decimal";
import { BRAND } from "../../../../lib/brand";
import PayButton from "./PayButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentGatewayPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Retrieve order details securely from the database rows
  const order = await prisma.order.findUnique({
    where: { id: id },
    include: {
      items: {
        include: {
          variant: { include: { product: true } }
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  if (order.status !== 'pending') {
    redirect('/product');
  }

  const orderTotal = toNum(order.total);
  const upiId = "srilayaenterprises@sbi";

  return (
    <div className="bg-slate-50/50 min-h-screen py-12 text-slate-800">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Order Meta Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Awaiting Payment Authorization
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-2">
              Complete Payment for Order #{order.id.slice(0, 8)}
            </h1>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Total Amount Due</span>
            <span className="text-2xl font-black text-brand-green">₹{orderTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          
          {/* Main Payment Options Left Column */}
          <div className="md:col-span-3 space-y-6">
            
            {/* UPI Option Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="p-1 bg-emerald-50 rounded-lg text-sm">📱</span> Pay Instantly via UPI App
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/60 p-5 rounded-xl border border-slate-100">
                <div className="w-32 h-32 bg-white rounded-xl border-2 border-slate-200 flex flex-col items-center justify-center text-center shadow-inner flex-shrink-0 relative">
                  <div className="absolute inset-2 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_50%,#ccc_50%,#ccc_75%,transparent_75%,transparent)] [background-size:8px_8px] opacity-20"></div>
                  <span className="text-[10px] font-bold text-slate-400 relative z-10 tracking-wider">UPI QR CODE</span>
                  <span className="text-[9px] text-brand-green font-mono font-bold mt-1 relative z-10">Scan to Pay</span>
                </div>
                
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Scan this dynamic checkpoint using any active UPI application (**Google Pay, PhonePe, Paytm, or BHIM**).
                  </p>
                  <div className="pt-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Official Payee VPA Address</span>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block mt-1">
                      {upiId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Bank Transfer Frame */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="p-1 bg-amber-50 rounded-lg text-sm">🏦</span> Or Direct Manual Bank Transfer
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-xl text-xs font-medium border border-slate-100">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Account Name</span>
                  <span className="font-bold text-slate-700">{BRAND.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Bank Name</span>
                  <span className="font-bold text-slate-700">State Bank of India</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Account Number</span>
                  <span className="font-mono font-bold text-slate-700">XXXXXXXX9482</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">IFSC Routing Code</span>
                  <span className="font-mono font-bold text-brand-green">SBIN0040182</span>
                </div>
              </div>
            </div>

          </div>

          {/* Verification Gateway Launching Card */}
          <div className="md:col-span-2 space-y-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Gateway Authentication</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Click the secure button below to launch our online payment window and safely process your transaction.
              </p>
              
              {/* Fixed: Nullish coalescing operators fall back cleanly to strip any string | null mismatch */}
              <PayButton 
                orderId={order.id}
                amount={orderTotal}
                customerName={order.customerName || ""}
                customerEmail={order.email || ""}
                customerPhone={order.phone || ""}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}