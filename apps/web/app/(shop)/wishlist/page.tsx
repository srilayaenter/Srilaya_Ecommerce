import dynamic from "next/dynamic";

const WishlistClient = dynamic(() => import("./WishlistClient"), { ssr: false });

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white font-poppins">My Wishlist</h1>
        <p className="text-[#FFF8E1] text-sm mt-1">Products you&apos;ve saved for later.</p>
      </div>
      <WishlistClient />
    </div>
  );
}
