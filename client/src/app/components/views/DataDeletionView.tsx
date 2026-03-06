// ============================================
// DATA DELETION VIEW — Public page
// Required for Meta App Review (Facebook Login)
// Endpoint: https://g-socials.vercel.app/data-deletion
// ============================================

import { Trash2, Mail, CheckCircle, Clock, ShieldCheck } from "lucide-react";

const CONTACT_EMAIL = "privacy@g-socials.vercel.app";
const APP_NAME = "G-Socials";

export function DataDeletionView() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Data Deletion</h1>
          </div>
          <p className="text-gray-500 text-sm">
            How to request deletion of your {APP_NAME} account and all associated data.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Intro */}
        <section>
          <p className="text-gray-700 leading-relaxed">
            You have the right to request deletion of all personal data {APP_NAME} holds about you
            at any time. This includes your account information, connected social media accounts,
            posts, analytics data, and any other data associated with your account.
          </p>
        </section>

        {/* What gets deleted */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">What We Delete</h2>
          </div>
          <ul className="space-y-3 text-gray-700">
            {[
              "Your account (name, email, password hash)",
              "All connected social media accounts and their OAuth tokens",
              "All posts, drafts, and scheduled content you created",
              "All analytics snapshots and metric data",
              "All templates and workspace settings",
              "All team memberships and invitations",
              "All API keys generated for your account",
              "All audit logs and activity history",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Option 1 - In-app */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Option 1 — Delete via the App (Recommended)
          </h2>
          <ol className="space-y-3 text-gray-700 list-decimal list-inside">
            <li>Sign in to your {APP_NAME} account at{" "}
              <a href="https://g-socials.vercel.app/login" className="text-blue-600 underline">
                g-socials.vercel.app
              </a>
            </li>
            <li>Go to <strong>Settings</strong> → <strong>Connected Accounts</strong></li>
            <li>Disconnect each connected social media account</li>
            <li>Go to <strong>Settings</strong> → <strong>Account</strong></li>
            <li>Click <strong>"Delete Account"</strong> and confirm</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Your data will be permanently deleted within <strong>30 days</strong> of your request.
          </p>
        </section>

        {/* Option 2 - Email */}
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Option 2 — Request via Email
            </h2>
          </div>
          <p className="text-gray-700 mb-4">
            If you are unable to access your account, send an email to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline font-medium">
              {CONTACT_EMAIL}
            </a>{" "}
            with the subject line: <strong>"Data Deletion Request"</strong>
          </p>
          <p className="text-gray-700 mb-2">Please include in your email:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>The email address associated with your {APP_NAME} account</li>
            <li>The Facebook profile name or ID used to connect (if applicable)</li>
            <li>A brief description of what you'd like deleted</li>
          </ul>
        </section>

        {/* Timeline */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Deletion Timeline</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <div>
                <p className="font-medium">Confirmation (within 48 hours)</p>
                <p className="text-sm text-gray-500">We acknowledge your deletion request by email.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <div>
                <p className="font-medium">Data Removal (within 30 days)</p>
                <p className="text-sm text-gray-500">
                  All personal data is permanently deleted from our systems and backups.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <div>
                <p className="font-medium">Completion Notice (within 30 days)</p>
                <p className="text-sm text-gray-500">We confirm deletion is complete via email.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Facebook-specific */}
        <section className="bg-blue-50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Revoking Facebook App Access Separately
          </h2>
          <p className="text-gray-700 mb-3">
            You can also revoke {APP_NAME}'s access to your Facebook data directly through Facebook
            without deleting your {APP_NAME} account:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to <strong>Facebook → Settings → Security and Login</strong></li>
            <li>Click <strong>"Apps and Websites"</strong></li>
            <li>Find <strong>{APP_NAME}</strong> and click <strong>"Remove"</strong></li>
          </ol>
          <p className="mt-3 text-sm text-gray-500">
            This removes our access to your Facebook data. Any Facebook data already stored in
            {APP_NAME} can be removed by following the account deletion steps above.
          </p>
        </section>

        {/* Footer links */}
        <div className="flex gap-6 text-sm text-gray-500 border-t pt-6">
          <a href="/privacy" className="hover:text-blue-600">Privacy Policy</a>
          <a href="/terms" className="hover:text-blue-600">Terms of Service</a>
          <a href="/help" className="hover:text-blue-600">Help Center</a>
        </div>
      </div>
    </div>
  );
}
