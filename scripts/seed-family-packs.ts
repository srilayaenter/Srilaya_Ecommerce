/**
 * Seed: Family Combo Pack bundles + blog articles + recipe posts
 * Run: npx dotenv -e .env -- npx tsx scripts/seed-family-packs.ts
 *
 * Idempotent: skips any bundle/post whose slug already exists.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Variant IDs (Foxtail-based for general packs; Little Millet for Senior) ──
const V = {
  FOXTAIL_PARBOILED_1KG: "cmqpkjle60036uigkva580vmx",
  FOXTAIL_RICE_1KG:      "cmqpkjm0n004euigkhknk5uu4",
  FOXTAIL_RICE_500G:     "cmqpkjm1r004guigkol4933s5",
  FOXTAIL_FLAKES_1KG:    "cmqpkjjqs0006uigkn88emyka",
  FOXTAIL_RAVA_1KG:      "cmqpkjkmd001quigkipj9ivxx",
  FOXTAIL_RAVA_500G:     "cmqpkjkna001suigk26t09z9s",
  FOXTAIL_FLOUR_1KG:     "cmqpkjl3x002muigkc8acnib6",
  FOXTAIL_LADDU_500G:    "cmqpkjmtl005vuigk5vsuexb2",
  FOXTAIL_LADDU_1KG:     "cmqpkjmsg005tuigkbchkzxym",
  BROWN_SUGAR_500G:      "cmqpkjn90006kuigkkle0563t",
  BROWN_SUGAR_1KG:       "cmqpkjn7z006iuigk9ndznq5g",
  // Senior pack variants
  LITTLE_PARBOILED_1KG:  "cmqpkjlh6003cuigkzlklhjyq",
  LITTLE_RICE_500G:      "cmqpkjm4z004muigkkj9vq0u5",
  LITTLE_FLAKES_1KG:     "cmqpkjjv6000cuigky9d70mji",
  LITTLE_RAVA_1KG:       "cmqpkjkp7001wuigk01zaqd19",
  COCONUT_JAGGERY_500G:  "cmrkbo1s9004nui4c7p2yc45m",
  // Multigrain variants (Family Pack Basic 2A+1Teen redesign, 2026-08-03)
  RAGI_RICE_1KG:         "cmqpkjme30052uigkfuxy153h",
  BARNYARD_RAVA_1KG:     "cmqpkjksf0022uigk6hephpv9",
  PEARL_FLOUR_1KG:       "cmqpkjla3002yuigkzsva27kx",
};

const BUNDLES = [
  // ── Pack 1 Basic: 2 Adults + 1 Teen ──────────────────────────────────────
  {
    slug:  "family-pack-basic-2a-1teen",
    title: "Millet Family Pack Basic — 2 Adults + 1 Teen",
    description:
      "One month of varied millet-based meals for a family of three — mixes Foxtail, Little, Barnyard, Ragi, and Pearl millet across the pack instead of a single grain, for better nutrient variety. Approx. 8 kg · 20–25 millet meals/month.",
    price: 830,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 2 },
      { variantId: V.LITTLE_PARBOILED_1KG,  quantity: 1 },
      { variantId: V.RAGI_RICE_1KG,         quantity: 1 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 1 },
      { variantId: V.BARNYARD_RAVA_1KG,     quantity: 1 },
      { variantId: V.PEARL_FLOUR_1KG,       quantity: 1 },
      { variantId: V.BROWN_SUGAR_1KG,       quantity: 1 },
    ],
  },
  // ── Pack 1 Plus: 2 Adults + 1 Teen ───────────────────────────────────────
  {
    slug:  "family-pack-plus-2a-1teen",
    title: "Millet Family Pack Plus — 2 Adults + 1 Teen",
    description:
      "More flakes and flour for a growing teenager's appetite. Ideal for a teen boy with full meals at home. Approx. 8.5 kg · 25–30 millet meals/month. Naturally gluten-free.",
    price: 1149,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 3 },
      { variantId: V.FOXTAIL_RICE_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 2 },
      { variantId: V.FOXTAIL_RAVA_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 1 },
      { variantId: V.BROWN_SUGAR_500G,      quantity: 1 },
    ],
  },
  // ── Pack 2 Basic: 2 Adults + 2 Kids (6–12 yrs) ──────────────────────────
  {
    slug:  "family-pack-basic-2a-2kids",
    title: "Millet Kids Family Pack Basic — 2 Adults + 2 Children",
    description:
      "Kid-friendly millet kit for school-age children aged 6–12. Higher flakes proportion for quick weekday breakfasts children love. No artificial colours, preservatives, or refined flour. Approx. 9 kg · 25 millet meals/month.",
    price: 959,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 3 },
      { variantId: V.FOXTAIL_RICE_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 2 },
      { variantId: V.FOXTAIL_RAVA_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 1 },
      { variantId: V.BROWN_SUGAR_500G,      quantity: 1 },
    ],
  },
  // ── Pack 2 Plus: 2 Adults + 2 Kids (6–12 yrs) ───────────────────────────
  {
    slug:  "family-pack-plus-2a-2kids",
    title: "Millet Kids Family Pack Plus — 2 Adults + 2 Children",
    description:
      "More flour for dosas children love, plus extra flakes for quick breakfasts. Approx. 10 kg · 30+ millet meals/month. Naturally gluten-free.",
    price: 1469,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 3 },
      { variantId: V.FOXTAIL_RICE_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 2 },
      { variantId: V.FOXTAIL_RAVA_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 2 },
      { variantId: V.BROWN_SUGAR_1KG,       quantity: 1 },
    ],
  },
  // ── Pack 3 Basic: Couple ─────────────────────────────────────────────────
  {
    slug:  "millet-couple-pack-basic",
    title: "Millet Couple Pack Basic — 2 Adults",
    description:
      "Ideal entry pack for working couples starting their millet journey. Covers 15–20 days of partial millet use. Most items cook in under 15 minutes. Approx. 5.5 kg · 12–15 millet meals/month.",
    price: 615,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 2 },
      { variantId: V.FOXTAIL_RICE_500G,     quantity: 1 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 1 },
      { variantId: V.FOXTAIL_RAVA_500G,     quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 1 },
      { variantId: V.BROWN_SUGAR_500G,      quantity: 1 },
    ],
  },
  // ── Pack 3 Plus: Couple ──────────────────────────────────────────────────
  {
    slug:  "millet-couple-pack-plus",
    title: "Millet Couple Pack Plus — 2 Adults",
    description:
      "A fuller monthly kit for office-going couples, with extra rice and flour for more meal variety. Approx. 6.5 kg · 18–20 millet meals/month. Naturally gluten-free.",
    price: 915,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 2 },
      { variantId: V.FOXTAIL_RICE_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 1 },
      { variantId: V.FOXTAIL_RAVA_1KG,      quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 1 },
      { variantId: V.BROWN_SUGAR_500G,      quantity: 1 },
    ],
  },
  // ── Pack 4 Basic: Senior Couple ──────────────────────────────────────────
  {
    slug:  "millet-senior-pack-gentle",
    title: "Millet Senior Pack Gentle — Senior Couple (60+)",
    description:
      "Little millet and barnyard millet varieties chosen for their soft, gentle texture when cooked. Sweetened with coconut jaggery powder — no refined sugar. Rich in dietary fibre, magnesium, and potassium. Low glycemic index. Approx. 6 kg.",
    price: 939,
    items: [
      { variantId: V.LITTLE_PARBOILED_1KG,  quantity: 2 },
      { variantId: V.LITTLE_RICE_500G,      quantity: 1 },
      { variantId: V.LITTLE_FLAKES_1KG,     quantity: 1 },
      { variantId: V.LITTLE_RAVA_1KG,       quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 1 },
      { variantId: V.COCONUT_JAGGERY_500G,  quantity: 1 },
    ],
  },
  // ── Pack 4 Plus: Senior Couple ───────────────────────────────────────────
  {
    slug:  "millet-senior-pack-plus",
    title: "Millet Senior Pack Plus — Senior Couple (60+)",
    description:
      "Everything in the Gentle Pack with extra parboiled rice and flour for a fuller month. No refined sugar in the entire pack. Approx. 8 kg. Naturally gluten-free. Suitable as part of a balanced diet.",
    price: 1135,
    items: [
      { variantId: V.LITTLE_PARBOILED_1KG,  quantity: 3 },
      { variantId: V.LITTLE_RICE_500G,      quantity: 1 },
      { variantId: V.LITTLE_FLAKES_1KG,     quantity: 1 },
      { variantId: V.LITTLE_RAVA_1KG,       quantity: 1 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 2 },
      { variantId: V.COCONUT_JAGGERY_500G,  quantity: 1 },
    ],
  },
  // ── Pack 5: Joint Family ─────────────────────────────────────────────────
  {
    slug:  "millet-joint-family-box",
    title: "Millet Joint Family Box — 4 Adults + 2 Children",
    description:
      "Flagship 16 kg monthly millet kit for a joint family of 6. Covers breakfast, lunch, and dinner. Subscribe monthly for doorstep delivery — Bengaluru-wide. Approx. 50–60 millet-based meals/month. Naturally gluten-free.",
    price: 2165,
    items: [
      { variantId: V.FOXTAIL_PARBOILED_1KG, quantity: 6 },
      { variantId: V.FOXTAIL_RICE_1KG,      quantity: 2 },
      { variantId: V.FOXTAIL_FLAKES_1KG,    quantity: 3 },
      { variantId: V.FOXTAIL_RAVA_1KG,      quantity: 2 },
      { variantId: V.FOXTAIL_FLOUR_1KG,     quantity: 2 },
      { variantId: V.BROWN_SUGAR_1KG,       quantity: 1 },
    ],
  },
];

const BLOG_ARTICLES = [
  {
    slug:     "millet-switch-family-teenagers",
    title:    "How We Switched to Millets Without a Family Revolt",
    excerpt:  "Switching to millets at home with a teenager? A practical, no-drama guide to getting the whole family on board — from breakfast to dinner.",
    category: "article",
    readMins: 5,
    content: `Let's be honest. The moment you announce "we're switching to millets," your teenager will have exactly one response: What? Why? Can I just have rice?

We've heard this from hundreds of Bengaluru families. The adults are convinced. The research is there. The millets are on the counter. And then dinner happens, and no one is happy.

Here's what actually works — a gradual, no-drama millet transition that your teenager will accept (and eventually stop complaining about).

START WHERE THEY ALREADY EAT

The biggest mistake families make is attempting a complete rice-and-roti swap on day one. Instead, begin with one meal that nobody's particularly attached to — weekday breakfast.

Millet flakes prepared like poha, with a bit of onion, mustard seeds, and curry leaves, looks identical to the real thing. Millet rava upma is indistinguishable from semolina upma once it's on the plate. Your teenager leaves for school, and the switch has already happened.

THE RICE REPLACEMENT THAT ACTUALLY WORKS

By week two, introduce parboiled millet as a rice replacement for one meal — ideally sambar rice or dal rice, where the millet takes a back seat to the flavour of the accompaniment. Parboiled millet has a slightly firm bite and soaks up dal beautifully. Most families tell us their teenager didn't notice the difference until they were told.

Cook it the same way as rice — one part millet, two parts water, bring to a boil, simmer fifteen minutes. Done.

THE TEEN HUNGER PROBLEM (AND HOW TO SOLVE IT)

Teenagers — especially active boys — eat significantly more than adults. If your son plays sport, cycles, or is just in a growth phase, the standard adult serving of millet rice won't cut it. Don't halve the quantity when you switch; keep the plate size the same. Millets are higher in fibre, which means smaller quantities are more filling — but the adjustment takes a week or two.

If hunger is still an issue, add a millet laddu as an after-school snack. Made with jaggery and roasted millet flour, it's 100 calories of steady energy — far better than a biscuit packet.

WHAT ABOUT SCHOOL LUNCHES?

Millet roti is sturdier than wheat roti and holds up better in a lunchbox. Millet flour dosas, rolled with a paneer or potato filling, travel well and reheat nicely.

THE 30-DAY RULE

Taste preferences shift after roughly 21–30 days of consistent exposure. The goal isn't to convince your teenager through argument — it's to keep serving millets until they become the new normal.

Most families who've been ordering from us for six months tell us the same thing: My kid now asks for millet flakes specifically. I don't know when it happened.`,
  },
  {
    slug:     "millets-for-school-kids-parent-guide",
    title:    "Getting School Kids to Love Millets: A Parent's Honest Guide",
    excerpt:  "How to get children aged 6–12 to eat — and enjoy — millets. Real strategies from Bengaluru parents, with recipes that actually work.",
    category: "article",
    readMins: 5,
    content: `School-age children have two food superpowers: an infallible radar for anything "healthy," and an astonishing ability to communicate displeasure at the dinner table.

If you've tried introducing millets to a 7-year-old and been met with a suspicious look and a pushed-away plate, you're in excellent company. Here's what actually works for children between 6 and 12.

WHY SCHOOL-AGE CHILDREN NEED MORE NUTRIENT DENSITY

Between the ages of 6 and 12, children are in a sustained growth phase. They need steady energy for six to eight hours of school, calcium and iron for bone and blood development, and dietary fibre to support a digestive system that's still maturing. Millets — particularly little millet, kodo millet, and foxtail millet — tick all three boxes naturally, without fortification.

The challenge is not the nutrition. It's the plate.

THE TEXTURE TRICK

Children under 12 are particularly sensitive to texture. The secret with millet flakes is to not overcook them. Cooked for exactly 3–4 minutes in warm milk with a spoon of jaggery powder and a few raisins, millet flakes have a pleasantly soft bite. Add a small amount of their favourite fruit and they'll ask for it again tomorrow.

THE LUNCHBOX WIN

Millet flour dosas are thinner, crispier, and slightly nutty in flavour — many children prefer them over regular dosas once they've tried them, particularly when rolled with a filling. Millet flour also makes excellent soft rotis when blended 50:50 with wheat flour.

For lunchbox-friendly options: millet rava upma with vegetables packs well, reheats cleanly, and passes the critical child test of "looks like something I'd actually eat."

THE SNACK CONVERSATION

A standard commercial biscuit packet contains refined flour, palm oil, and high-fructose sweeteners. A millet laddu, made with roasted millet flour, jaggery, ghee, and nuts, contains dietary fibre, iron, and plant-based fats. From a child's perspective, both are sweet, small, and portable. From a parent's perspective, they couldn't be more different.

A NOTE ON VARIETY

ICMR guidelines for school-age children emphasise variety across cereal types. Think of your monthly millet kit as covering three or four days a week, not seven. That's enough to meaningfully improve a child's fibre and mineral intake without a complete household overhaul.

Note: Information here is for general awareness. Consult a registered dietitian for personalised advice for your child.`,
  },
  {
    slug:     "millet-reset-couple-bengaluru",
    title:    "The Bengaluru Couple's Millet Reset: Small Changes, Real Results",
    excerpt:  "A practical millet plan for working couples in Bengaluru — quick to prepare, easy to maintain, and genuinely satisfying. No radical diet overhaul required.",
    category: "article",
    readMins: 4,
    content: `Most of us in Bengaluru's tech corridors share a familiar pattern: weekday lunches at the office or delivered to the desk, weekday dinners assembled under time pressure, and weekend meals that slide back to old comfort food.

The millet argument is easy to make intellectually. The challenge is keeping it going on a Tuesday night when you're back at 8 PM and the easiest option is the same rava idli you've been making since 2018.

Here's a millet plan built specifically for two people who are busy, not terrible cooks, and realistic about what they'll actually stick to.

THE 15-MINUTE PRINCIPLE

Any habit that requires more than 15 minutes of active cooking on a weeknight will not survive contact with reality. The good news: millet flakes and millet rava both cook faster than their wheat and rice counterparts.

Millet rava upma takes 12 minutes. Millet flakes with curd and a drizzle of honey takes four. Parboiled millet cooks in the same time as regular rice in a pressure cooker. The preparation overhead is genuinely not a barrier.

HOW TO STRUCTURE YOUR MILLET MONTH

The 5.5 kg Basic pack is designed to cover roughly 50% of your cereal needs for a month — two people, partial millet use. You're not replacing every meal; you're adding millet into the rotation three to four times a week.

A practical rhythm that works for Bengaluru couples:

Monday, Wednesday, Friday breakfast: millet rava upma or millet flakes with curd. 12 minutes, minimal cleanup.
Saturday lunch: parboiled millet rice with homemade sambar — the slow weekend meal where you actually enjoy cooking.
Tuesday/Thursday dinner: millet flour dosa with coconut chutney. Dosa batter made in bulk on Sunday keeps for four days.

THE SUNDAY BATCH COOK

One Sunday habit that makes the week significantly easier: batch-cook 500 g of parboiled millet, refrigerate it, and use it through the week as the base for quick rice bowls, stir-fried millet with leftover vegetables, or reheated with dal. Cooked millet holds well for four days in the fridge and reheats in two minutes.

WHY THE PLUS PACK IS WORTH IT FOR COUPLES

The Plus pack adds millet laddus — which sounds indulgent until you consider what most people snack on at 4 PM. A millet laddu is portable, not messy, and has enough fibre to prevent the classic 5 PM energy crash.`,
  },
  {
    slug:     "millets-for-seniors-eating-well-after-60",
    title:    "Eating Well After 60: Why Millets Belong on Every Senior's Plate",
    excerpt:  "A practical guide to incorporating millets into a senior's daily diet — with the right varieties, simple preparations, and an honest look at the nutritional benefits.",
    category: "article",
    readMins: 6,
    content: `Our grandparents ate millets without thinking of them as a health food. Ragi mudde with saaru, little millet kanji on hot afternoons, foxtail millet rice as a matter of course — these weren't superfoods. They were just food.

Somewhere between the 1970s and today, white rice and refined wheat took over the Indian kitchen almost completely. For adults over 60, this shift has had measurable consequences: lower fibre intake, higher glycemic load, fewer micronutrients per calorie.

Returning to millets after 60 isn't a trend. It's a return to what worked.

WHAT MAKES MILLETS PARTICULARLY WELL-SUITED TO SENIOR NUTRITION

Millets — particularly little millet, kodo millet, and barnyard millet — have a lower glycemic index compared to polished white rice. This means they release glucose more steadily into the bloodstream, supporting more consistent energy levels through the day.

Millets are also rich in magnesium, which plays a role in muscle function, and potassium, which is important for fluid balance. They are naturally high in dietary fibre — critical for a digestive system that slows with age.

THE JAGGERY DECISION

Many senior-oriented food products still contain brown sugar, which offers no meaningful advantage over white sugar in terms of glycemic impact. Our Senior Pack uses coconut jaggery powder instead — the traditional South Indian sweetener. Jaggery has a lower glycemic index than refined sugar and contains trace amounts of iron, potassium, and B vitamins.

THE SOFT-TEXTURE APPROACH

Parboiled little millet and barnyard millet, when cooked with a slightly higher water ratio (1:2.5 instead of 1:2), produce a soft, cohesive texture closer to idli rice than regular grain rice. Millet rava kanji — thin millet porridge cooked with water or diluted milk — is an excellent light breakfast for days when appetite is reduced.

A NOTE ON MEDICAL CONDITIONS

We are a food company, not a healthcare provider. Individuals managing specific health conditions should speak with a registered dietitian before making significant dietary changes. In the context of a balanced diet, millets are an excellent choice for most adults over 60.

Disclaimer: This article is for general awareness only and is not a substitute for medical advice.`,
  },
  {
    slug:     "millet-plan-joint-family-six-members",
    title:    "One Kitchen, Six People, One Monthly Box: The Joint Family Millet Plan",
    excerpt:  "Managing millets for a joint family of six? How to cook once, feed everyone well, and keep the kitchen sane with a single 17 kg monthly delivery.",
    category: "article",
    readMins: 5,
    content: `A joint family kitchen in Bengaluru is a remarkable operation. Four adults with different tastes, two children with strong opinions, three generations of food preference, and a kitchen that runs from 6 AM to 9 PM. Getting everyone to eat the same new ingredient is, to put it generously, a project.

The reason our Joint Family Box exists is because this household is underserved by regular portion sizes. You need quantities that scale, variety that spans age groups from 8 to 65, and a delivery rhythm that doesn't require a separate logistics operation.

WHY 17 KG MAKES SENSE FOR A FAMILY OF SIX

For a household of 4 adults and 2 children, partial millet use (covering three to four meals a week) translates to roughly 15–17 kg of millet across the month. The 17 kg Joint Family Box is calibrated to replace approximately 50% of your household's cereal intake — realistic, sustainable, and leaving room for your existing staples.

COOKING ONCE FOR EVERYONE

The significant advantage of parboiled millet as a rice replacement is that it cooks identically for all ages. The same pot of millet rice that goes on the senior couple's plates can also be served to the children with dal and a little more ghee. You are not running a separate production line.

The only age-specific consideration is texture at the very young end — for children under 5, millet rice should be slightly softer-cooked. Children 6 and above eat the same preparation as adults.

THE MONTHLY RHYTHM THAT WORKS

Weekday mornings: Millet flakes or rava upma for everyone — quick, scalable, adaptable.
Monday, Wednesday, Friday lunch: Parboiled millet rice as the main carbohydrate.
Weekend dinners: Millet flour dosa or roti — the social meal where experimentation is welcome.
After school / 4 PM: Millet laddus from the box.

THE SUBSCRIPTION ADVANTAGE

At 17 kg per month, carrying the box from a store is genuinely impractical. A monthly subscription means the box arrives at your door, you divide it into airtight containers by type, and the month is sorted. No mid-month restocking trips, no running out of flakes the week before the next purchase.`,
  },
];

const RECIPES = [
  {
    slug:     "millet-rava-upma-15-minutes",
    title:    "Millet Rava Upma — Ready in 15 Minutes",
    excerpt:  "The weeknight millet staple. Faster than semolina upma, lighter on the stomach, and genuinely delicious with coconut chutney.",
    category: "recipe",
    readMins: 3,
    content: `MILLET RAVA UPMA

Prep time: 5 minutes  |  Cook time: 12 minutes  |  Serves: 2–3

INGREDIENTS

1 cup foxtail millet rava (or little millet rava)
2 cups water
1 medium onion, finely chopped
1 green chilli, slit
1 tsp mustard seeds
1 tsp urad dal
8–10 curry leaves
1 tbsp oil or ghee
Salt to taste
Fresh coriander to garnish
Squeeze of lemon (optional)

FOR VEGETABLES (optional)
1/4 cup peas
1 small carrot, finely diced
A few cashews, for garnish

METHOD

1. Dry-roast the millet rava in a pan on medium heat for 3–4 minutes until it smells nutty and turns lightly golden. Set aside.

2. Heat oil in the same pan. Add mustard seeds — let them splutter. Add urad dal and cook for 30 seconds until golden. Add curry leaves, green chilli, and onion. Sauté for 3–4 minutes until onion is soft and translucent.

3. If using vegetables, add them now and sauté for 1 minute.

4. Add 2 cups of water and salt. Bring to a rolling boil.

5. Reduce heat to low. Slowly add the roasted millet rava while stirring continuously to prevent lumps. Mix well.

6. Cover and cook for 5–6 minutes on low flame, stirring once halfway through, until all water is absorbed and the rava is cooked through.

7. Garnish with coriander and cashews. Squeeze lemon if desired. Serve hot with coconut chutney.

TIPS

• Millet rava cooks faster than semolina — don't leave it unattended after adding water.
• For a softer texture, use 2.5 cups water to 1 cup rava.
• Leftovers reheat well with a splash of water.
• Works beautifully with a tadka of hing (asafoetida) added to the oil.`,
  },
  {
    slug:     "millet-flakes-breakfast-bowl-kids",
    title:    "Sweet Millet Flakes Breakfast Bowl for Kids",
    excerpt:  "The 5-minute school morning breakfast that children actually finish. Warm, lightly sweet, and filling until lunch.",
    category: "recipe",
    readMins: 2,
    content: `SWEET MILLET FLAKES BREAKFAST BOWL

Prep time: 1 minute  |  Cook time: 4 minutes  |  Serves: 1–2 children

INGREDIENTS

3/4 cup foxtail millet flakes (or kodo / little millet flakes)
1 cup warm milk (dairy or plant-based)
1 tsp jaggery powder (adjust to taste)
A small handful of raisins
Fresh banana, sliced, OR 3–4 strawberries

OPTIONAL TOPPINGS
Chopped cashews or almonds
A pinch of cardamom powder

METHOD

1. Heat milk in a small saucepan until warm (not boiling). Do not use cold milk — the flakes won't soften properly.

2. Add millet flakes to a bowl. Pour the warm milk over the flakes.

3. Stir gently and let sit for 2–3 minutes. The flakes will absorb the milk and soften to a pleasantly chewy consistency.

4. Stir in jaggery powder. Add raisins. Top with fresh fruit.

5. Serve immediately.

TIPS FOR PICKY EATERS

• The first time, use a fruit the child already loves — the familiar flavour helps.
• Don't call it "millet." It's just your new breakfast cereal.
• If the child prefers crunch: skip step 3 (don't soak), use cold milk, and serve within 1 minute of pouring.
• For toddlers (2–5 years): cook the flakes briefly in milk on the stovetop for a soft porridge consistency.

NOTE: Each serving provides dietary fibre and naturally occurring minerals. Free from artificial colours, preservatives, and refined sugar when prepared as above.`,
  },
  {
    slug:     "little-millet-kanji-senior",
    title:    "Little Millet Kanji — Soft Morning Porridge for Seniors",
    excerpt:  "The traditional South Indian morning kanji, updated for little millet. Gentle on the stomach, naturally low glycemic index, ready in 10 minutes.",
    category: "recipe",
    readMins: 3,
    content: `LITTLE MILLET KANJI

Prep time: 2 minutes  |  Cook time: 10 minutes  |  Serves: 2

This is the everyday breakfast recommended for older adults who prefer a light, warm, easily digestible morning meal. Little millet produces a smooth, thin porridge with a mild, slightly nutty flavour.

INGREDIENTS

1/2 cup little millet rava (OR little millet rice, ground coarsely in a dry blender)
3 cups water
Salt to taste (small pinch)
1 tsp jaggery powder OR coconut jaggery powder (optional — omit for savoury version)
A pinch of cumin seeds (for savoury version)

OPTIONAL GARNISH
A few drops of ghee
Fresh curry leaves
A small amount of grated ginger

METHOD — SWEET VERSION (breakfast)

1. Bring 3 cups of water to a boil in a heavy-bottomed vessel.

2. Reduce heat to medium-low. Add millet rava in a thin, steady stream while stirring continuously to prevent lumps.

3. Cook on medium-low heat, stirring occasionally, for 8–10 minutes until the mixture thickens to a smooth, pourable consistency.

4. Add jaggery powder. Stir well. Remove from heat.

5. Add a small drop of ghee if desired. Serve warm.

METHOD — SAVOURY VERSION (light lunch or dinner)

Follow the same method but omit jaggery. Temper cumin seeds in ghee separately and pour over the kanji. Add a pinch of salt. Pairs well with a small bowl of thin rasam.

TEXTURE NOTE FOR SENIORS

For very soft kanji (easier to swallow): use 3.5 cups water to 1/2 cup rava. The result is thinner and more liquid. Use 2.5 cups for a thicker porridge.

Disclaimer: Individuals with specific medical conditions should consult a registered dietitian before changing their diet.`,
  },
  {
    slug:     "parboiled-millet-rice-sambar-family",
    title:    "Parboiled Millet Rice with Sambar — The Family Lunch",
    excerpt:  "How to cook parboiled millet exactly like rice, and why it works better with sambar than white rice does.",
    category: "recipe",
    readMins: 4,
    content: `PARBOILED MILLET RICE WITH SAMBAR

Prep time: 5 minutes  |  Cook time: 15–20 minutes  |  Serves: 4–6

Parboiled millet rice is the easiest entry point into daily millet cooking. It looks, cooks, and is served exactly like rice — but with higher fibre content, more micronutrients, and a lower glycemic index. The slightly firm, separate grains absorb sambar exceptionally well, better than soft-cooked white rice.

INGREDIENTS — MILLET RICE

2 cups foxtail parboiled millet rice (or kodo / little parboiled millet rice)
4 cups water (2:1 ratio — same as basmati)
Salt to taste
1 tsp ghee (optional — improves texture and flavour significantly)

PRESSURE COOKER METHOD (recommended for first-time cooks)

1. Wash millet rice twice under running water. Drain.
2. Add to pressure cooker with 4 cups water and salt.
3. Cook on medium heat for 3 whistles (approximately 12–15 minutes).
4. Allow pressure to release naturally. Open lid, add ghee, fluff gently with a fork.
5. Serve immediately with sambar and a papad.

OPEN POT METHOD

1. Wash millet rice. Add to a heavy-bottomed pot with 4 cups water and salt.
2. Bring to a rolling boil. Reduce heat to low, cover with a tight lid.
3. Cook for 15–18 minutes until all water is absorbed and grains are tender.
4. Rest covered for 5 minutes. Fluff and serve.

TIPS FOR A JOINT FAMILY

• For a family of 6: use 4 cups millet rice and 8 cups water. 6 whistles in a large pressure cooker.
• Leftover millet rice holds perfectly in the fridge for 3 days and reheats in 2 minutes with a sprinkle of water.
• On day 2, use leftover millet rice for a quick stir-fry with vegetables and a beaten egg (or paneer for vegetarians).
• Millet rice absorbs sambar more slowly than white rice — serve sambar separately on the side rather than mixing, so each person can control their ratio.`,
  },
  {
    slug:     "millet-flour-dosa-crispy",
    title:    "Crispy Millet Flour Dosa — No Fermentation Needed",
    excerpt:  "A quick dosa that skips the overnight fermentation — ready in 20 minutes, crispier than regular dosa, loved by children and adults equally.",
    category: "recipe",
    readMins: 4,
    content: `CRISPY MILLET FLOUR DOSA (No Fermentation)

Prep time: 5 minutes  |  Rest time: 10 minutes  |  Makes: 8–10 medium dosas  |  Serves: 3–4

Unlike regular dosa, millet flour dosa requires no overnight fermentation. The batter comes together in minutes and rests briefly while you heat the pan. The result is a crisp, slightly nutty dosa that works for breakfast, dinner, or a packed tiffin box.

INGREDIENTS

1 cup foxtail millet flour (or ragi flour, or a 50:50 blend of millet flour + wheat flour for softer dosas)
1/4 cup rice flour (for extra crispiness — can be skipped)
1/4 tsp cumin seeds (optional)
Salt to taste
Water — enough to make a thin, pourable batter (approximately 1.5–2 cups)
Oil or ghee for cooking

OPTIONAL ADD-INS
Finely chopped onion
1 green chilli, minced
Handful of fresh coriander

METHOD

1. In a mixing bowl, combine millet flour, rice flour (if using), cumin, and salt.

2. Slowly add water while stirring — the batter should be thin and pourable, slightly thinner than regular dosa batter (like a thin lassi consistency). Whisk until smooth with no lumps.

3. Stir in any add-ins (onion, chilli, coriander). Rest the batter for 10 minutes — this helps the flour hydrate fully and produces a crispier dosa.

4. Heat a cast-iron or non-stick tawa on high heat until very hot. A few drops of water should sizzle and evaporate immediately.

5. Reduce to medium-high. Pour a ladleful of batter in the centre. Spread quickly in a circular motion, moving outward, to make a thin round.

6. Drizzle a few drops of oil or ghee around the edges. Cook for 2–3 minutes until the edges lift and the surface looks set and dry.

7. Flip gently. Cook the other side for 1 minute.

8. Serve immediately with coconut chutney or sambar.

FOR THE LUNCHBOX

Roll the dosa with mashed potato filling (aloo masala), grated paneer and coriander, or sautéed mushrooms. The thicker edges hold a roll better than regular dosa. Wrap in foil — stays crispy for 2–3 hours.

TIPS

• The thinner the batter spread, the crispier the dosa.
• If the dosa sticks: the pan is not hot enough before the batter goes on.
• For children: make smaller, coin-shaped dosas — easier to handle and more fun to eat.`,
  },
];

async function main() {
  console.log("── Seeding family combo bundles ──────────────────────────");
  let bundlesCreated = 0;
  for (const b of BUNDLES) {
    const existing = await prisma.bundle.findUnique({ where: { slug: b.slug } });
    if (existing) {
      console.log(`  skip (exists): ${b.slug}`);
      continue;
    }
    await prisma.bundle.create({
      data: {
        slug:        b.slug,
        title:       b.title,
        description: b.description,
        price:       b.price,
        active:      true,
        items: {
          create: b.items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
        },
      },
    });
    console.log(`  ✅ created: ${b.slug}`);
    bundlesCreated++;
  }
  console.log(`   ${bundlesCreated} bundles created, ${BUNDLES.length - bundlesCreated} skipped.\n`);

  console.log("── Seeding blog articles ──────────────────────────────────");
  let articlesCreated = 0;
  for (const p of BLOG_ARTICLES) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  skip (exists): ${p.slug}`);
      continue;
    }
    await prisma.blogPost.create({
      data: {
        slug:        p.slug,
        title:       p.title,
        excerpt:     p.excerpt,
        content:     p.content,
        category:    p.category,
        readMins:    p.readMins,
        published:   true,
        publishedAt: new Date(),
      },
    });
    console.log(`  ✅ created: ${p.slug}`);
    articlesCreated++;
  }
  console.log(`   ${articlesCreated} articles created, ${BLOG_ARTICLES.length - articlesCreated} skipped.\n`);

  console.log("── Seeding recipe posts ───────────────────────────────────");
  let recipesCreated = 0;
  for (const r of RECIPES) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: r.slug } });
    if (existing) {
      console.log(`  skip (exists): ${r.slug}`);
      continue;
    }
    await prisma.blogPost.create({
      data: {
        slug:        r.slug,
        title:       r.title,
        excerpt:     r.excerpt,
        content:     r.content,
        category:    "recipe",
        readMins:    r.readMins,
        published:   true,
        publishedAt: new Date(),
      },
    });
    console.log(`  ✅ created: ${r.slug}`);
    recipesCreated++;
  }
  console.log(`   ${recipesCreated} recipes created, ${RECIPES.length - recipesCreated} skipped.\n`);

  console.log("── Done ───────────────────────────────────────────────────");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
