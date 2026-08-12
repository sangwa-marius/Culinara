import { Link } from "react-router-dom";
import { Shield, ChevronRight } from "lucide-react";

const LAST_UPDATED = "March 6, 2026";
const COMPANY = "Culinara";
const CONTACT_EMAIL = "support@culinara.com";
const LOCATION = "Kigali, Rwanda";

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `${COMPANY} ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform — including our website, mobile applications, and related services (the "Service"). Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.`,
  },
  {
    id: "information-collected",
    title: "2. Information We Collect",
    content: `We collect information you provide directly, information generated through your use of the Service, and information from third parties.

Information you provide:
• Account registration data: name, email address, phone number, password
• Profile information: delivery addresses, profile photo
• Order information: items ordered, delivery address, payment method
• Communications: messages sent to our support team, ratings and reviews

Information collected automatically:
• Usage data: pages visited, time spent, clicks, search queries
• Device data: IP address, browser type, operating system, device identifiers
• Location data: GPS coordinates (with your permission) to enable delivery features
• Cookies and similar tracking technologies (see Section 7)

Information from third parties:
• Payment processors (we do not store full card numbers)
• Social login providers if you choose to sign in via a third party`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: `We use your information to:

• Create and manage your account
• Process and fulfil your orders and payments
• Connect you with restaurant partners and drivers
• Send order confirmations, status updates, and delivery notifications
• Respond to your customer service requests
• Send marketing communications (with your consent where required)
• Improve, personalise, and develop our Service
• Detect, prevent, and investigate fraud and security incidents
• Comply with legal obligations and enforce our Terms of Service
• Conduct analytics to understand how our Service is used

We will never sell your personal data to third parties for their own marketing purposes.`,
  },
  {
    id: "sharing",
    title: "4. How We Share Your Information",
    content: `We share your information only as described below:

Restaurant partners: We share your name, order details, and delivery address with the restaurant fulfilling your order.

Delivery drivers: We share your name, delivery address, and phone number with the driver assigned to your order so they can complete the delivery.

Payment processors: We share payment data with our payment processing partners to complete transactions. These partners are PCI-DSS compliant.

Service providers: We use third-party vendors who assist in operating our platform (e.g. cloud hosting, email delivery, analytics). These vendors are contractually bound to use your data only to provide services to us.

Legal requirements: We may disclose your information if required to do so by law, court order, or governmental authority, or to protect the rights, property, or safety of ${COMPANY}, our users, or the public.

Business transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.`,
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide you with our Service. We also retain data as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. If you delete your account, we will delete or anonymise your personal data within 90 days, except where we are required by law to retain it longer.`,
  },
  {
    id: "security",
    title: "6. Data Security",
    content: `We implement industry-standard technical and organisational security measures to protect your personal information from unauthorised access, loss, destruction, or alteration. These include HTTPS encryption, hashed passwords, access controls, and regular security audits. However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security and encourage you to use a strong, unique password for your account.`,
  },
  {
    id: "cookies",
    title: "7. Cookies and Tracking Technologies",
    content: `We use cookies and similar technologies to:

• Keep you logged in between sessions
• Remember your preferences (e.g. saved addresses)
• Analyse traffic and usage patterns
• Serve relevant promotional content

Types of cookies we use:
• Strictly necessary: Required for the Service to function. Cannot be disabled.
• Functional: Remember your preferences and settings.
• Analytics: Help us understand how users interact with our Service (e.g. Google Analytics).

You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of the Service.`,
  },
  {
    id: "your-rights",
    title: "8. Your Rights",
    content: `Depending on your location, you may have the following rights regarding your personal data:

• Access: Request a copy of the personal data we hold about you.
• Correction: Request that we correct inaccurate or incomplete data.
• Deletion: Request that we delete your personal data ("right to be forgotten"), subject to legal retention obligations.
• Restriction: Request that we limit the processing of your data in certain circumstances.
• Portability: Request that we provide your data in a portable, machine-readable format.
• Objection: Object to our processing of your data for direct marketing purposes.
• Withdraw consent: Where processing is based on consent, withdraw that consent at any time.

To exercise any of these rights, contact us at ${CONTACT_EMAIL}. We will respond within 30 days.`,
  },
  {
    id: "children",
    title: "9. Children's Privacy",
    content: `The Service is not directed at children under the age of 18. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected personal data from a child under 18 without parental consent, we will take steps to delete that information promptly. If you believe a child has provided us with their personal data, please contact us at ${CONTACT_EMAIL}.`,
  },
  {
    id: "third-party-links",
    title: "10. Third-Party Links",
    content: `Our Service may contain links to third-party websites or services. This Privacy Policy applies only to ${COMPANY}. We are not responsible for the privacy practices of any third-party sites or services, and we encourage you to review their privacy policies before providing any personal information.`,
  },
  {
    id: "international",
    title: "11. International Data Transfers",
    content: `${COMPANY} is based in ${LOCATION}. Your information may be processed and stored on servers located outside your country of residence. By using our Service, you consent to the transfer of your information to our servers and to the servers of our service providers. We take appropriate steps to ensure that your data is treated securely and in accordance with this Privacy Policy regardless of where it is processed.`,
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page with a revised "Last Updated" date, and where appropriate by email. We encourage you to review this policy periodically. Your continued use of the Service after any changes constitutes your acceptance of the updated policy.`,
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact our Privacy Team at:

${COMPANY}
${LOCATION}
Email: ${CONTACT_EMAIL}

We take privacy concerns seriously and will respond to all legitimate requests within 30 days.`,
  },
];

export default function PrivacyPolicy() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0d0f14] pt-20">

      {/* Hero */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-4">
            <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-gray-600 dark:text-gray-300">Privacy Policy</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <Shield size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Privacy Policy</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Last updated: <span className="font-semibold text-gray-700 dark:text-gray-300">{LAST_UPDATED}</span>
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm leading-relaxed max-w-xl">
                Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, and how it is used and protected.
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

              {/* Commitment box */}
              <div className="bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/40 rounded-xl p-4 text-sm text-green-700 dark:text-green-300 flex items-start gap-3">
                <Shield size={18} className="shrink-0 mt-0.5" />
                <span>
                  Culinara is committed to protecting your privacy and will never sell your personal data to third parties.
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
              <Link to="/terms" className="hover:text-primary-500 transition-colors font-semibold">
                Terms of Service →
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
