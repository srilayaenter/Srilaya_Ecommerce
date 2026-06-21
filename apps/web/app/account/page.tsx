import { cookies } from "next/headers";
import { prisma } from "../../lib/db";
import { redirect } from "next/navigation";
import { toNum } from "../../lib/decimal";
import Link from "next/link";

export default async function CustomerAccountPage() {
  // In a full production app, this would be your NextAuth / Supabase session token
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get('userEmail')?.value;

  // Temporary fallback for testing if no auth session exists
  const customerEmail = sessionEmail || "john@example.com"; 

  // Fetch the customer's past orders and profile data
  const customerOrders = await prisma.order.findMany({
    where: { email: customerEmail },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { variant: { include: { product: true } } }
      }
    }
  });

  // Strict workflow states from PRD
  const workflowSteps = [
    { id: 'pending', label: 'Order Placed' },
    { id: 'processing', label: 'Processing' },
    { id: 'packed', label: 'Packed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'completed', label: 'Delivered' }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-12 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Page Header - Earthy Brown Theme */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold text-[#212121] tracking-tight font-poppins">
            My Account
          </h1>
          <p className="text-[#8D6E63] text-[16px] mt-1 font-medium">
            Manage your organic essentials, track orders, and update your delivery addresses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden">
              <div className="p-6 bg-[#FFF8E1] border-b border-[#E0E0E0] text-center">
                <div className="w-16 h-16 bg-[#4CAF50] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-sm">
                  {customerEmail.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-[#212121]">{customerEmail.split('@')[0]}</h3>
                <p className="text-[#9E9E9E] text-[12px]">{customerEmail}</p>
              </div>
              <nav className="p-2 flex flex-col">
                <a href="#orders" className="px-4 py-3 text-[#4CAF50] bg-[#4CAF50]/10 font-semibold rounded-md transition-colors">
                  📦 My Orders
                </a>
                <a href="#profile" className="px-4 py-3 text-[#424242] hover:bg-[#F5F5F5] font-medium rounded-md transition-colors">
                  👤 Profile Details
                </a>
                <a href="#addresses" className="px-4 py-3 text-[#424242] hover:bg-[#F5F5F5] font-medium rounded-md transition-colors">
                  📍 Saved Addresses
                </a>
                <button className="px-4 py-3 text-[#F44336] hover:bg-[#F44336]/10 font-medium rounded-md transition-colors text-left mt-4 border-t border-[#E0E0E0]">
                  Log Out
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area - Order History */}
          <div className="md:col-span-3 space-y-6" id="orders">
            <h2 className="text-[24px] font-semibold text-[#212121] font-poppins border-b border-[#E0E0E0] pb-4">
              Order History
            </h2>

            {customerOrders.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E0E0E0] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                <span className="text-4xl block mb-4">🛒</span>
                <h3 className="text-[#212121] font-bold text-[20px] mb-2">No orders placed yet</h3>
                <p className="text-[#9E9E9E] mb-6">Explore our organic catalog and place your first order.</p>
                <Link href="/product">
                  <button className="bg-[#4CAF50] text-white px-[24px] py-[12px] rounded-[8px] font-medium hover:bg-[#388E3C] transition-all duration-300">
                    Browse Products
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Safe mapping with explicit 'any' to bypass Prisma synchronization delays */}
                {customerOrders.map((order: any) => {
                  const total = toNum(order.total);
                  
                  // Determine active step index based on DB status
                  const activeIndex = workflowSteps.findIndex(s => s.id === order.status) >= 0 
                    ? workflowSteps.findIndex(s => s.id === order.status) 
                    : 0;

                  return (
                    <div key={order.id} className="bg-white rounded-lg border border-[#E0E0E0] shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 overflow-hidden">
                      
                      {/* Order Card Header */}
                      <div className="bg-[#FFF8E1] p-4 border-b border-[#E0E0E0] flex flex-wrap justify-between items-center gap-4">
                        <div>
                          <span className="text-[#9E9E9E] text-[12px] font-medium uppercase tracking-wider block">Order ID</span>
                          <span className="text-[#212121] font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-[#9E9E9E] text-[12px] font-medium uppercase tracking-wider block">Date Placed</span>
                          <span className="text-[#424242] font-medium">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9E9E9E] text-[12px] font-medium uppercase tracking-wider block">Total Amount</span>
                          <span className="text-[#4CAF50] font-bold">₹{total.toFixed(2)}</span>
                        </div>
                        <Link href={`/orders/${order.id}`}>
                          <button className="bg-transparent border-2 border-[#4CAF50] text-[#4CAF50] px-4 py-2 rounded-[8px] text-[14px] font-semibold hover:bg-[#4CAF50] hover:text-white transition-all duration-300">
                            View Details
                          </button>
                        </Link>
                      </div>

                      {/* Order Timeline Tracker */}
                      <div className="p-6 border-b border-[#E0E0E0]">
                        <div className="relative flex justify-between items-center w-full">
                          {/* Connecting Line */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#F5F5F5] z-0"></div>
                          <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#4CAF50] z-0 transition-all duration-500"
                            style={{ width: `${(activeIndex / (workflowSteps.length - 1)) * 100}%` }}
                          ></div>

                          {/* Dots & Labels */}
                          {workflowSteps.map((step, index) => {
                            const isCompleted = index <= activeIndex;
                            const isCurrent = index === activeIndex;
                            return (
                              <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                  isCompleted 
                                    ? 'bg-[#4CAF50] border-[#4CAF50] text-white' 
                                    : 'bg-white border-[#E0E0E0] text-transparent'
                                }`}>
                                  {isCompleted && <span className="text-[10px]">✓</span>}
                                </div>
                                <span className={`absolute top-8 text-[11px] font-medium whitespace-nowrap ${
                                  isCurrent ? 'text-[#4CAF50] font-bold' : 'text-[#9E9E9E]'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Item Preview */}
                      <div className="p-4 bg-white flex flex-col gap-2">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-[14px] text-[#424242]">
                            <span>{item.quantity}x {item.variant.product.title} ({item.variant.size})</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}