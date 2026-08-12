import { Link } from "react-router-dom";
import { Shield, FileText, ChevronRight } from "lucide-react";

const LAST_UPDATED = "March 6, 2026";
const COMPANY = "Culinara";
const CONTACT_EMAIL = "support@culinara.com";
const LOCATION = "Kigali, Rwanda";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using the ${COMPANY} platform — including our website, mobile applications, and related services (collectively, the "Service") — you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and ${COMPANY}.`,
  },
  {
    id: "eligibility",
    title: "2. Eligibility",
    content: `You must be at least 18 years old to use our Service. By creating an account, you represent and warrant that you are 18 years of age or older, that you have the right, authority, and capacity to enter into these Terms, and that you will abide by all terms and conditions set forth herein. If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these Terms.`,
  },
  {
    id: "accounts",
    title: "3. User Accounts",
    content: `To access certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify ${COMPANY} immediately at ${CONTACT_EMAIL} of any suspected or actual unauthorized use of your account. ${COMPANY} reserves the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    id: "service-description",
    title: "4. Description of the Service",
    content: `${COMPANY} is an online food ordering and delivery platform that connects customers with local restaurants in ${LOCATION} and surrounding areas. We facilitate the placement of food orders and the coordination of delivery through our network of partner drivers. ${COMPANY} acts as a marketplace intermediary — we are not a restaurant or a delivery company, and we do not prepare food. The restaurants and drivers on our platform are independent third parties.`,
  },
  {
    id: "ordering",
    title: "5. Orders and Payments",
    content: `When you place an order through ${COMPANY}, you are entering into a contract directly with the restaurant you ordered from. All prices displayed are in USD and include applicable taxes unless otherwise stated. We accept payment by credit/debit card, mobile money, and cash on delivery where available. Once an order is confirmed, you may only cancel it within the cancellation window specified at checkout. Refunds for cancelled or incorrect orders are processed within 5–10 business days to your original payment method. ${COMPANY} reserves the right to refuse or cancel any order at its discretion.`,
  },
  {
    id: "delivery",
    title: "6. Delivery",
    content: `Estimated delivery times provided on the platform are estimates only and not guaranteed. Actual delivery times may vary due to restaurant preparation time, driver availability, traffic, weather, or other circumstances beyond our control. ${COMPANY} is not liable for delays in delivery. You are responsible for ensuring that your delivery address is accurate and accessible. If a delivery cannot be completed due to an incorrect address or your unavailability, a re-delivery fee may apply.`,
  },
  {
    id: "restaurant-partners",
    title: "7. Restaurant Partners",
    content: `Restaurants listed on ${COMPANY} are independent businesses. While we require partner restaurants to maintain minimum quality and hygiene standards, ${COMPANY} does not prepare, handle, or inspect the food and is not responsible for the quality, safety, or allergen content of any food item. Menu items, prices, and availability are determined by each restaurant and may change without notice. If you have a food allergy, intolerance, or dietary requirement, please contact the restaurant directly before ordering.`,
  },
  {
    id: "driver-partners",
    title: "8. Driver Partners",
    content: `Delivery drivers on the ${COMPANY} platform are independent contractors, not employees of ${COMPANY}. ${COMPANY} does not exercise control over the manner in which drivers perform their services. Drivers are expected to treat customers respectfully and professionally; any concerns about driver conduct should be reported to us at ${CONTACT_EMAIL} so we can take appropriate action.`,
  },
  {
    id: "prohibited",
    title: "9. Prohibited Conduct",
    content: `You agree not to: (a) use the Service for any unlawful purpose; (b) submit false, misleading, or fraudulent orders or reviews; (c) harass, threaten, or harm other users, restaurant staff, or drivers; (d) attempt to gain unauthorised access to any part of the Service; (e) scrape, crawl, or otherwise extract data from the Service without express written permission; (f) upload or transmit malicious code; (g) circumvent or interfere with any security feature of the Service; or (h) use the Service to engage in any commercial activity without ${COMPANY}'s prior written consent.`,
  },
  {
    id: "ratings",
    title: "10. Ratings and Reviews",
    content: `You may submit ratings and reviews for restaurants and orders. All reviews must be honest, accurate, and based on your genuine experience. ${COMPANY} reserves the right to remove reviews that are fraudulent, defamatory, contain offensive language, or violate these Terms. By submitting a review, you grant ${COMPANY} a non-exclusive, royalty-free licence to display and use that review on our platform.`,
  },
  {
    id: "intellectual-property",
    title: "11. Intellectual Property",
    content: `All content on the ${COMPANY} platform — including but not limited to the logo, design, text, graphics, and software — is the property of ${COMPANY} or its licensors and is protected by applicable intellectual property laws. You may not copy, reproduce, distribute, modify, or create derivative works from any content on the Service without our prior written consent.`,
  },
  {
    id: "limitation",
    title: "12. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, ${COMPANY} and its officers, directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising out of or in connection with your use of the Service. Our total liability to you for any claim arising under these Terms shall not exceed the total amount paid by you to ${COMPANY} in the 12 months preceding the claim.`,
  },
  {
    id: "indemnification",
    title: "13. Indemnification",
    content: `You agree to indemnify, defend, and hold harmless ${COMPANY} and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses — including reasonable legal fees — arising out of or in any way related to your use of the Service, your violation of these Terms, or your violation of any rights of another person or entity.`,
  },
  {
    id: "termination",
    title: "14. Termination",
    content: `${COMPANY} may suspend or terminate your access to the Service at any time, with or without cause or notice, including for violation of these Terms. Upon termination, your right to use the Service will immediately cease. You may delete your account at any time by contacting us at ${CONTACT_EMAIL}. Sections of these Terms that by their nature should survive termination shall do so.`,
  },
  {
    id: "changes",
    title: "15. Changes to These Terms",
    content: `${COMPANY} reserves the right to update or modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page with a new "Last Updated" date, and where appropriate by email. Your continued use of the Service after any changes constitutes your acceptance of the revised Terms.`,
  },
  {
    id: "governing-law",
    title: "16. Governing Law",
    content: `These Terms are governed by and construed in accordance with the laws of Rwanda, without regard to its conflict of law principles. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Kigali, Rwanda.`,
  },
  {
    id: "contact",
    title: "17. Contact Us",
    content: `If you have questions, concerns, or complaints about these Terms, please contact us at:\n\n${COMPANY}\nKigali, Rwanda\nEmail: ${CONTACT_EMAIL}`,
  },
];

export default function TermsOfService() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0d0f14] pt-20">

      {/* Hero */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4">
            <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-gray-600 dark:text-gray-300">Terms of Service</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <FileText size={22} className="text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Terms of Service</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Last updated: <span className="font-semibold text-gray-700 dark:text-gray-300">{LAST_UPDATED}</span>
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm leading-relaxed max-w-xl">
                Please read these terms carefully before using Culinara. By using our platform you agree to be bound by them.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sticky table of contents */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 card p-4">
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Contents</p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left text-xs text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 py-1 px-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all leading-snug"
                  >
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="card p-6 sm:p-8 space-y-10">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3">{s.title}</h2>
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                    {s.content}
                  </div>
                  <div className="mt-6 border-b border-gray-100 dark:border-gray-800" />
                </section>
              ))}

              {/* Footer note */}
              <div className="bg-primary-50 dark:bg-primary-900/15 border border-primary-100 dark:border-primary-800/40 rounded-xl p-4 text-sm text-primary-700 dark:text-primary-300">
                By using Culinara, you acknowledge that you have read, understood, and agree to these Terms of Service.
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
              <Link to="/privacy" className="hover:text-primary-500 transition-colors font-semibold">
                Privacy Policy →
              </Link>
              <Link to="/" className="hover:text-primary-500 transition-colors">
                Back to Culinara
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
