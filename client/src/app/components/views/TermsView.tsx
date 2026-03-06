// ============================================
// TERMS OF SERVICE VIEW — Public page
// ============================================

import { FileText, Mail } from "lucide-react";

const LAST_UPDATED = "March 6, 2026";
const CONTACT_EMAIL = "privacy@g-socials.vercel.app";
const APP_NAME = "G-Socials";

export function TermsView() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Acceptance */}
        <section>
          <p className="text-gray-700 leading-relaxed">
            By accessing or using <strong>{APP_NAME}</strong> ("the Service"), you agree to be bound
            by these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Description of Service</h2>
          <p className="text-gray-700">
            {APP_NAME} is a social media management platform that allows users to connect social
            media accounts, create and schedule posts, collaborate with team members, and view
            analytics across multiple platforms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Account Registration</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>You must be at least 13 years old to use {APP_NAME}.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to provide accurate and up-to-date information.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Acceptable Use</h2>
          <p className="text-gray-700 mb-3">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Use the Service to post spam, illegal content, or content that violates third-party
              platform policies (Facebook, Instagram, etc.)</li>
            <li>Attempt to gain unauthorised access to our systems or other users' accounts</li>
            <li>Use the Service to harass, abuse, or harm others</li>
            <li>Reverse engineer or attempt to extract source code from the Service</li>
            <li>Use the Service in violation of any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Connected Social Accounts</h2>
          <p className="text-gray-700">
            When you connect a social media account, you authorise {APP_NAME} to act on your behalf
            for the specific permissions you grant. You remain responsible for all content published
            through {APP_NAME} to your social accounts. You may disconnect any account at any time
            from Settings → Connected Accounts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
          <p className="text-gray-700">
            You retain ownership of all content you create and publish through {APP_NAME}. By using
            the Service, you grant us a limited licence to display and process your content solely
            to provide the Service to you. The {APP_NAME} platform, branding, and technology remain
            our intellectual property.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Termination</h2>
          <p className="text-gray-700">
            You may terminate your account at any time from Settings. We reserve the right to
            suspend or terminate accounts that violate these Terms. Upon termination, your data
            will be deleted in accordance with our{" "}
            <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
          <p className="text-gray-700">
            The Service is provided "as is" without warranties of any kind, express or implied. We
            do not guarantee the Service will be uninterrupted or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-700">
            To the maximum extent permitted by law, {APP_NAME} shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
          <p className="text-gray-700">
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          </div>
          <p className="text-gray-700">
            Questions about these Terms? Contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline font-medium">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        {/* Footer links */}
        <div className="flex gap-6 text-sm text-gray-500 border-t pt-6">
          <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
          <a href="/data-deletion" className="hover:text-blue-600">Data Deletion</a>
          <a href="/help" className="hover:text-blue-600">Help Center</a>
        </div>
      </div>
    </div>
  );
}
