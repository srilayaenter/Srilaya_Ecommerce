"use client";

import { useState } from "react";
import Link from "next/link";
import { HandsPraying } from "@phosphor-icons/react";

const TYPES = [
  { value: "feature_request",  label: "Feature request",   desc: "Suggest something new" },
  { value: "bug_report",       label: "Bug report",         desc: "Something isn't working" },
  { value: "product_feedback", label: "Product feedback",   desc: "About our products" },
  { value: "general",          label: "General feedback",   desc: "Anything else" },
];

export default function FeedbackPage() {
  const [type,    setType]    = useState("feature_request");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message, name, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not send feedback."); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      <div className="bg-[#006A38] py-10 px-4 text-center">
        <h1 className="text-2xl font-black text-white">Share Your Feedback</h1>
        <p className="text-green-200 text-sm mt-1">Help us improve — every message is read by the team</p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-12">
        {done ? (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8 text-center">
            <HandsPraying size={40} weight="regular" className="text-[#006A38] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#212121] mb-2">Thank you!</h2>
            <p className="text-sm text-[#616161] mb-6">Your feedback has been sent to the team. We read every message.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setDone(false); setMessage(""); setSubject(""); }}
                className="border border-[#E0E0E0] text-[#424242] font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#F5F5F5] transition-colors">
                Send more feedback
              </button>
              <Link href="/" className="bg-[#006A38] text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-[#00522B] transition-colors">
                Back to shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E0E0E0] p-8">
            <form onSubmit={submit} className="space-y-5">

              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-2">What kind of feedback?</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(t => (
                    <button type="button" key={t.value} onClick={() => setType(t.value)}
                      className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                        type === t.value
                          ? "border-[#006A38] bg-[#F0FAF5]"
                          : "border-[#E0E0E0] hover:border-[#BDBDBD]"
                      }`}>
                      <p className={`text-sm font-semibold ${type === t.value ? "text-[#006A38]" : "text-[#212121]"}`}>{t.label}</p>
                      <p className="text-xs text-[#9E9E9E] mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Subject <span className="text-[#BDBDBD] normal-case font-normal">(optional)</span></label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="One-line summary"
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]" />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Message <span className="text-red-500">*</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5}
                  placeholder="Tell us what you think, what's missing, or what could be better…"
                  className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38] resize-none" />
              </div>

              {/* Contact (optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Your name <span className="text-[#BDBDBD] normal-case font-normal">(optional)</span></label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Priya"
                    className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#616161] uppercase tracking-wider mb-1.5">Email <span className="text-[#BDBDBD] normal-case font-normal">(optional)</span></label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                    placeholder="for a reply"
                    className="w-full border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#006A38]" />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button type="submit" disabled={loading || message.trim().length < 10}
                className="w-full bg-[#006A38] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#00522B] transition-colors disabled:opacity-50">
                {loading ? "Sending…" : "Send feedback"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
