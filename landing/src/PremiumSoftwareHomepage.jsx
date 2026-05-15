/* ─────────────────────────────────────────────────────────────
   Your original Tailwind theme file, restored verbatim from chat.
   Uses Tailwind v3 utility classes — scoped under `.tw-scope` via
   important selector so it can't leak styles into the other pages.
   Routed at /theme so you can preview it: localhost:5173/theme
   ───────────────────────────────────────────────────────────── */
import './theme.css'

export default function PremiumSoftwareHomepage() {
  const categories = [
    "Restaurant & Food Delivery",
    "Bakery & Donut Shops",
    "Salon & Beauty",
    "Locksmith Services",
    "Tattoo Studios",
    "Mechanic Workshops",
    "Yoga & Fitness",
    "Photography Services",
    "Retail & Fashion",
    "Home Services",
  ];

  const plans = [
    {
      name: "Starter",
      price: "$19",
      features: [
        "Premium PWA App",
        "Admin Dashboard",
        "Unlimited Orders",
        "Push Notifications",
        "Mobile Optimized",
      ],
    },
    {
      name: "Professional",
      price: "$49",
      featured: true,
      features: [
        "Everything in Starter",
        "Custom Branding",
        "Advanced Analytics",
        "Stripe & Payment Setup",
        "Customer Loyalty System",
      ],
    },
    {
      name: "Enterprise",
      price: "$99",
      features: [
        "Everything in Professional",
        "Multi-Location Support",
        "Dedicated Support",
        "Custom Integrations",
        "Priority Hosting",
      ],
    },
  ];

  return (
    <div className="tw-scope min-h-screen bg-white text-black overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 lg:px-20 py-24 border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-transparent to-gray-200/30" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-gray-200 rounded-full px-4 py-2 text-sm mb-6 backdrop-blur-md">
              Premium Animated Mobile App Solutions
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-8">
              Launch Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500">
                Phone Apps
              </span>
              With Premium Motion.
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-2xl">
              We build high-performance premium PWA applications for modern businesses.
              Fast, mobile-ready, affordable monthly pricing, and designed to scale.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:scale-105 transition-all px-8 py-4 rounded-2xl font-semibold shadow-2xl">
                Start Your App
              </button>

              <button className="border border-gray-300 hover:bg-gray-100 px-8 py-4 rounded-2xl font-semibold transition-all">
                View Demo
              </button>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 text-sm text-gray-500">
              <div>✓ No Large Upfront Costs</div>
              <div>✓ Monthly Subscription</div>
              <div>✓ Premium UI/UX</div>
            </div>
          </div>

          <div className="relative animate-[float_6s_ease-in-out_infinite]">
            <div className="bg-gray-50 border border-gray-200 rounded-[32px] p-6 backdrop-blur-xl shadow-2xl">
              <div className="rounded-[24px] overflow-hidden border border-gray-200 bg-white">
                <div className="h-14 border-b border-gray-200 flex items-center px-6 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5">
                      <div className="text-3xl font-black">120+</div>
                      <div className="text-gray-500 mt-1">Live Mobile Apps</div>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
                      <div className="text-3xl font-black">24/7</div>
                      <div className="text-gray-500 mt-1">Realtime Sync</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-bold text-lg">Premium PWA Platform</div>
                        <div className="text-sm text-gray-500">Animated. Responsive. Premium.</div>
                      </div>

                      <div className="bg-green-500/20 text-green-700 px-3 py-1 rounded-full text-xs">
                        Live
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                        <div className="w-[92%] h-full bg-gradient-to-r from-yellow-400 to-yellow-500" />
                      </div>

                      <div className="flex justify-between text-sm text-gray-500">
                        <span>User Experience Score</span>
                        <span>92%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              App Categories
            </h2>

            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Professionally designed applications tailored for different industries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {categories.map((item, index) => (
              <div
                key={index}
                className="group bg-gray-50 border border-gray-200 rounded-3xl p-6 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-blue-500/10 transition-all hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 mb-5 flex items-center justify-center text-2xl font-black">
                  {index + 1}
                </div>

                <h3 className="font-bold text-lg leading-snug group-hover:text-cyan-700 transition-colors">
                  {item}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-20 py-24 border-y border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {[
            {
              title: "Lightning Fast PWAs",
              text: "Installable apps that feel like native mobile applications without App Store delays.",
            },
            {
              title: "Affordable Monthly Pricing",
              text: "Premium software without huge development costs or expensive setup fees.",
            },
            {
              title: "Designed For Growth",
              text: "Scalable systems built for businesses that want to expand rapidly online.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-[32px] p-8 hover:border-cyan-500/40 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 mb-6" />

              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>

              <p className="text-gray-500 leading-relaxed">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 lg:px-20 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              Flexible Monthly Plans
            </h2>

            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Professional software solutions designed for startups, local businesses, and enterprise brands.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-[36px] border p-10 relative overflow-hidden ${
                  plan.featured
                    ? "bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border-cyan-400 scale-105"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-5 right-5 bg-cyan-400 text-black font-bold px-4 py-1 rounded-full text-sm">
                    Popular
                  </div>
                )}

                <h3 className="text-3xl font-black mb-4">{plan.name}</h3>

                <div className="flex items-end gap-2 mb-8">
                  <div className="text-6xl font-black">{plan.price}</div>
                  <div className="text-gray-500 mb-2">/month</div>
                </div>

                <div className="space-y-4 mb-10">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-400" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.featured
                    ? "bg-white text-black hover:scale-105 border border-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-black"
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-20 py-24">
        <div className="max-w-5xl mx-auto rounded-[40px] border border-gray-200 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-12 text-center">
          <h2 className="text-4xl lg:text-6xl font-black leading-tight mb-8">
            Ready To Launch
            <span className="block text-cyan-500">Your Premium App?</span>
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Build your business with modern PWA technology, premium design, and affordable monthly pricing.
          </p>

          <div className="flex flex-wrap justify-center gap-5">
            <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-2xl">
              Contact Sales
            </button>

            <button className="border border-gray-300 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
