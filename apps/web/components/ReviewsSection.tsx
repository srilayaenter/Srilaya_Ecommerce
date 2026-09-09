"use client";

import { useState } from "react";
import Image from "next/image";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  createdAt: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <svg width="28" height="28" viewBox="0 0 24 24"
            fill={(hovered || value) >= i ? "#F59E0B" : "none"}
            stroke="#F59E0B" strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= rating ? "#F59E0B" : "none"}
          stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection({ slug, reviews: initialReviews }: {
  slug: string;
  reviews: Review[];
}) {
  const [showForm,  setShowForm]  = useState(false);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState("");
  const [photoUrl,  setPhotoUrl]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result,    setResult]    = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setResult({ ok: false, message: "Please select a star rating." }); return; }
    setSubmitting(true);
    setResult(null);

    const res = await fetch("/api/products/reviews", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ slug, email, customerName: name, rating, comment, photoUrl: photoUrl || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setResult({ ok: true, message: "Thanks! Your review is pending approval and will appear shortly." });
      setName(""); setEmail(""); setRating(0); setComment(""); setPhotoUrl("");
      setShowForm(false);
    } else {
      setResult({ ok: false, message: data.error ?? "Failed to submit review." });
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E0E0E0] shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#212121]">
          Customer Reviews {initialReviews.length > 0 && <span className="text-[#9E9E9E] font-normal text-sm">({initialReviews.length})</span>}
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-bold text-[#006A38] border border-[#006A38] px-4 py-2 rounded-lg hover:bg-[#006A38] hover:text-white transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Success message */}
      {result?.ok && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
          {result.message}
        </div>
      )}

      {/* Submission form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-[#E8E0D5] rounded-xl p-5 mb-6 bg-[#FAFAF8] space-y-4">
          <h3 className="font-bold text-[#212121] text-sm">Write a Review</h3>
          <p className="text-xs text-[#424242]">Only customers who have purchased this product can submit a review.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Order Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Email used at checkout"
                className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-2">Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Your Review <span className="text-[#9E9E9E] font-normal normal-case">(optional)</span></label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Tell others about your experience with this product…"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">
              Photo URL <span className="text-[#9E9E9E] font-normal normal-case">(optional — paste a link to your photo)</span>
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              placeholder="https://i.imgur.com/your-photo.jpg"
              className="w-full border border-[#E0E0E0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#006A38]"
            />
          </div>

          {result && !result.ok && (
            <p className="text-sm text-red-600 font-medium">{result.message}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#006A38] text-white font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#00522B] transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setResult(null); }}
              className="text-[#424242] font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {initialReviews.length === 0 ? (
        <div className="text-center py-8 text-[#9E9E9E]">
          <p className="text-3xl mb-2">⭐</p>
          <p className="text-sm font-medium">No reviews yet. Be the first to review this product.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F5F5]">
          {initialReviews.map(review => (
            <div key={review.id} className="py-5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-[#212121]">{review.customerName}</p>
                  <StarDisplay rating={review.rating} />
                </div>
                <p className="text-xs text-[#9E9E9E] whitespace-nowrap">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              {review.comment && (
                <p className="text-sm text-[#424242] mt-2 leading-relaxed">{review.comment}</p>
              )}
              {review.photoUrl && (
                <div className="mt-3">
                  <Image
                    src={review.photoUrl}
                    alt={`Photo by ${review.customerName}`}
                    width={160}
                    height={160}
                    className="rounded-xl object-cover border border-[#E0E0E0] cursor-pointer hover:opacity-90"
                    onClick={() => window.open(review.photoUrl!, "_blank")}
                    unoptimized
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
