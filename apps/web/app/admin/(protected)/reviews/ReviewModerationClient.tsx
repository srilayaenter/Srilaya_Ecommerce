"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  productTitle: string;
  productSlug: string;
  customerName: string;
  email: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  createdAt: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= rating ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </span>
  );
}

export default function ReviewModerationClient({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [filter,  setFilter]  = useState<"all" | "pending" | "approved">("pending");
  const router = useRouter();

  const filtered = reviews.filter(r =>
    filter === "all"      ? true :
    filter === "pending"  ? !r.approved :
                            r.approved
  );

  async function setApproved(id: string, approved: boolean) {
    await fetch("/api/admin/reviews", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reviewId: id, approved }),
    });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r));
    router.refresh();
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    setReviews(prev => prev.filter(r => r.id !== id));
    router.refresh();
  }

  const pending  = reviews.filter(r => !r.approved).length;
  const approved = reviews.filter(r =>  r.approved).length;

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["pending", "approved", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              filter === f
                ? "bg-[#006A38] text-white"
                : "bg-white border border-[#E0E0E0] text-[#616161] hover:border-[#006A38]"
            }`}
          >
            {f === "pending"  ? `Pending (${pending})`  :
             f === "approved" ? `Approved (${approved})` : "All"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E0E0E0] p-10 text-center text-[#9E9E9E]">
          <p>No reviews in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className={`bg-white rounded-xl border p-5 ${review.approved ? "border-[#E0E0E0]" : "border-amber-200 bg-amber-50/30"}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm text-[#212121]">{review.customerName}</span>
                    <Stars rating={review.rating} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      review.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {review.approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-[#9E9E9E] mb-2">
                    {review.email} · {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <Link href={`/product/${review.productSlug}`} className="text-xs font-bold text-[#006A38] hover:underline">
                    {review.productTitle}
                  </Link>
                  {review.comment && (
                    <p className="text-sm text-[#424242] mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!review.approved ? (
                    <button
                      onClick={() => setApproved(review.id, true)}
                      className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => setApproved(review.id, false)}
                      className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
