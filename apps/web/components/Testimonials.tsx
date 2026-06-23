const testimonials = [
  {
    name: "Anjali R.",
    location: "Bengaluru",
    quote: "Switched my family's daily rice to the millet rice variety and honestly haven't looked back. The quality is consistent every time.",
    rating: 5,
  },
  {
    name: "Praveen K.",
    location: "Hyderabad",
    quote: "The ragi flour is exactly what I remember from my grandmother's kitchen. Fresh, no weird aftertaste, and delivery was quick.",
    rating: 5,
  },
  {
    name: "Meena S.",
    location: "Chennai",
    quote: "Ordered the laddus for a festival and they were a hit. Will definitely be a regular customer for the millet snacks too.",
    rating: 4,
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">What Our Customers Say</h2>
        <p className="text-gray-600 text-center mb-12">
          Real feedback from people who've made the switch to organic millets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex mb-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span key={idx} className={idx < t.rating ? "text-amber-400" : "text-gray-300"}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
              <p className="text-gray-500 text-xs">{t.location}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Note: Placeholder testimonials — replace with real customer feedback.
        </p>
      </div>
    </section>
  );
}