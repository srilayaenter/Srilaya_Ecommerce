const testimonials = [
  {
    name: "Anjali R.",
    location: "Bengaluru",
    quote:
      "Switched my family's daily rice to the millet rice variety and honestly haven't looked back. The quality is consistent every time.",
    rating: 5,
    avatar: "A",
  },
  {
    name: "Praveen K.",
    location: "Hyderabad",
    quote:
      "The ragi flour is exactly what I remember from my grandmother's kitchen. Fresh, no weird aftertaste, and delivery was quick.",
    rating: 5,
    avatar: "P",
  },
  {
    name: "Meena S.",
    location: "Chennai",
    quote:
      "Ordered the laddus for a festival and they were a hit. Will definitely be a regular customer for the millet snacks too.",
    rating: 4,
    avatar: "M",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
            Customer Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-4 mb-3 tracking-tight">
            What Our Customers Say
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base">
            Real feedback from families who have made the switch to organic millets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`text-base ${idx < t.rating ? "text-amber-400" : "text-slate-200"}`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Quote mark */}
              <span className="text-4xl text-emerald-100 font-black leading-none mb-1 select-none">
                &ldquo;
              </span>

              <p className="text-slate-600 text-sm leading-relaxed flex-grow -mt-2">
                {t.quote}
              </p>

              {/* Customer */}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-50">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs font-medium">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
