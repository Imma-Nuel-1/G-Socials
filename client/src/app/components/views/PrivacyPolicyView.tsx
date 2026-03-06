// ============================================
// PRIVACY POLICY VIEW — Public page
// Required for Meta App Review
// ============================================

import { Shield, Lock, Eye, Mail } from "lucide-react";

const LAST_UPDATED = "March 6, 2026";
const CONTACT_EMAIL = "privacy@g-socials.vercel.app";
const APP_NAME = "G-Socials";

export function PrivacyPolicyView() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Intro */}
        <section>
          <p className="text-gray-700 leading-relaxed">
            Welcome to <strong>{APP_NAME}</strong>. We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains what information
            we collect, how we use it, and what rights you have in relation to it.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-medium mb-1">Account Information</h3>
              <p>When you register, we collect your <strong>name</strong> and <strong>email address</strong>.</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Social Media Account Tokens</h3>
              <p>
                When you connect social media platforms (Facebook, Instagram, X/Twitter, LinkedIn,
                TikTok, YouTube), we store encrypted OAuth access tokens that allow us to post
                content and read basic analytics on your behalf. We do not store your social media
                passwords.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Content You Create</h3>
              <p>
                Posts, captions, images, and scheduled content that you create within the app are
                stored in our database so you can manage and schedule them.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Usage &amp; Analytics Data</h3>
              <p>
                We collect analytics data (reach, engagement, impressions) retrieved from your
                connected social platforms to display performance insights in your dashboard.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Technical Data</h3>
              <p>
                We may collect your IP address, browser type, and device information for security
                and fraud prevention purposes.
              </p>
            </div>
          </div>
        </section>

        {/* 2. How We Use Your Information */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>To provide and operate the {APP_NAME} platform</li>
            <li>To publish and schedule social media posts on your behalf</li>
            <li>To display analytics and performance metrics from your connected accounts</li>
            <li>To authenticate you securely and maintain your session</li>
            <li>To send product updates or support communications (you may opt out at any time)</li>
            <li>To detect and prevent security threats or abuse</li>
          </ul>
          <p className="mt-4 text-gray-700">
            We do <strong>not</strong> sell your personal data to third parties. We do not use your
            data for advertising purposes unrelated to the {APP_NAME} platform.
          </p>
        </section>

        {/* 3. Social Media Permissions */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Social Media Permissions</h2>
          <p className="text-gray-700 mb-3">
            When you connect a Facebook or Instagram account, we request the following permissions:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>public_profile</strong> – to display your name and profile picture</li>
            <li><strong>email</strong> – to identify and link your account</li>
          </ul>
          <p className="mt-3 text-gray-700">
            We only request the minimum permissions necessary. You can revoke access at any time
            from your Facebook settings or from within {APP_NAME} under Settings → Connected Accounts.
          </p>
        </section>

        {/* 4. Data Storage & Protection */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Storage &amp; Protection</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>All data is stored in encrypted databases hosted in secure cloud infrastructure.</li>
            <li>OAuth access tokens are encrypted at rest using AES-256 encryption.</li>
            <li>All data in transit is protected by TLS/HTTPS.</li>
            <li>Authentication uses short-lived JWT access tokens (15 minutes) with secure HttpOnly
              refresh cookies (7 days).</li>
            <li>We perform regular security reviews and follow industry best practices.</li>
          </ul>
        </section>

        {/* 5. Data Sharing */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Sharing</h2>
          <p className="text-gray-700 mb-3">
            We do not sell or rent your personal information. We may share data only in limited
            circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Service providers</strong> – infrastructure partners who help us operate the
              platform (e.g., cloud hosting, email delivery), bound by data processing agreements.</li>
            <li><strong>Legal obligations</strong> – if required by law or to protect our legal rights.</li>
            <li><strong>Business transfers</strong> – if {APP_NAME} is acquired or merged, your data
              may be transferred as part of that transaction.</li>
          </ul>
        </section>

        {/* 6. Data Retention */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
          <p className="text-gray-700">
            We retain your account data for as long as your account is active. If you delete your
            account, we will delete or anonymise your personal data within <strong>30 days</strong>,
            except where we are required by law to retain it longer.
          </p>
        </section>

        {/* 7. Your Rights */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
          <p className="text-gray-700 mb-3">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (see our <a href="/data-deletion" className="text-blue-600 underline">Data Deletion page</a>)</li>
            <li>Object to or restrict how we process your data</li>
            <li>Data portability — receive a copy of your data in a structured format</li>
          </ul>
          <p className="mt-3 text-gray-700">
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        {/* 8. Cookies */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies</h2>
          <p className="text-gray-700">
            We use a single secure HttpOnly cookie to maintain your authentication session (refresh
            token). We do not use advertising or tracking cookies.
          </p>
        </section>

        {/* 9. Children */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
          <p className="text-gray-700">
            {APP_NAME} is not directed to children under 13. We do not knowingly collect personal
            information from children.
          </p>
        </section>

        {/* 10. Changes */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
          <p className="text-gray-700">
            We may update this policy from time to time. When we do, we will update the date at the
            top of this page and, where appropriate, notify you by email.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
          </div>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy or how we handle your data, please
            contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline font-medium">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        {/* Footer links */}
        <div className="flex gap-6 text-sm text-gray-500 border-t pt-6">
          <a href="/terms" className="hover:text-blue-600">Terms of Service</a>
          <a href="/data-deletion" className="hover:text-blue-600">Data Deletion</a>
          <a href="/help" className="hover:text-blue-600">Help Center</a>
        </div>
      </div>
    </div>
  );
}
