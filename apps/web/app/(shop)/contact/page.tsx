"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white text-slate-800">
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white py-16 text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <span className="text-amber-400 font-bold text-xs uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full">
            Get In Touch
          </span>
          <h1 className="text-4xl font-extrabold mt-4 mb-3 tracking-tight">
            Contact Us
          </h1>
          <p className="text-sm md:text-base text-emerald-100 max-w-xl mx-auto font-medium">
            Have questions about our millet items or wholesale options? We&apos;re here to help!
          </p>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Reach Out To Us
              </h2>
              <p className="text-slate-500 text-sm mt-1.5">
                Our support desk is operational Monday to Saturday from 9:00 AM to 6:00 PM.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                  📍
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Our Processing Unit Address
                  </h4>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    {BRAND.name} Organic Hub,
                    <br />
                    Industrial Area, Hebbal,
                    <br />
                    Mysuru, Karnataka - 570016
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                  📞
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Phone Support &amp; WhatsApp
                  </h4>
                  <p className="text-slate-600 text-xs mt-1 font-mono">
                    +91 98765 43210
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                  ✉️
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Email Support Channels
                  </h4>
                  <p className="text-slate-600 text-xs mt-1 font-mono">
                    support@srilayamillets.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-slate-50 border border-slate-200/60 p-6 md:p-8 rounded-2xl shadow-sm">
            {submitted ? (
              <div className="text-center py-12 bg-white rounded-xl border border-emerald-100 shadow-inner p-6">
                <span className="text-3xl">✅</span>
                <h3 className="text-lg font-bold text-slate-900 mt-3">
                  Message Sent Successfully!
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 max-w-sm mx-auto">
                  Thank you for reaching out to us. A customer relationship manager will review your submission and connect with you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Send Us A Message
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your name"
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="username@domain.com"
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="10-digit number"
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Your Message / Inquiry
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Type your question here in detail..."
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand-green bg-white text-slate-700 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full text-center font-bold text-xs bg-brand-green text-white hover:bg-emerald-800 py-3 rounded-xl transition-all duration-200 shadow-sm"
                >
                  Submit Inquiry Form
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}