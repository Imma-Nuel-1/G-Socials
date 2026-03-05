// ============================================
// OAUTH CALLBACK VIEW
// ============================================
// This view is NOT behind ProtectedRoute.
// Facebook (and other platforms) redirect here after OAuth.
// It handles:
//   1. If the user is already logged in → exchange code → go to settings
//   2. If NOT logged in (token expired mid-flow) → save the pending code
//      in sessionStorage → redirect to /login → after login, the login
//      page will process the pending code and redirect to settings.
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialAccountService } from '@/services/socialAccountService';
import { getStorageItem, STORAGE_KEYS } from '@/utils/storage';

const OAUTH_PENDING_KEY = 'oauth_pending';
const OAUTH_CODE_KEY    = 'oauth_pending_code'; // sessionStorage: code to replay after login

export function OAuthCallbackView() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your connection...');

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code  = params.get('code');
      const error = params.get('error');

      // ── Facebook sent an error ─────────────────────────────────────────
      if (error) {
        const desc = params.get('error_description') ?? error;
        setStatus('error');
        setMessage(`Facebook declined the request: ${desc}`);
        setTimeout(() => navigate('/settings', { replace: true }), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received.');
        setTimeout(() => navigate('/settings', { replace: true }), 3000);
        return;
      }

      // ── Read the pending platform that was saved before redirect ───────
      const rawPending = localStorage.getItem(OAUTH_PENDING_KEY);
      if (!rawPending) {
        setStatus('error');
        setMessage('No pending OAuth session found. Please try connecting again.');
        setTimeout(() => navigate('/settings', { replace: true }), 3000);
        return;
      }

      const pending = JSON.parse(rawPending) as { platform: string; redirectUri: string };

      // ── Check if user is currently authenticated ───────────────────────
      const token = getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
      const user  = getStorageItem<unknown>(STORAGE_KEYS.USER, null);

      if (!token || !user) {
        // Not logged in — save the code for after login
        sessionStorage.setItem(
          OAUTH_CODE_KEY,
          JSON.stringify({ code, platform: pending.platform, redirectUri: pending.redirectUri }),
        );
        // Keep OAUTH_PENDING_KEY so the login redirect can pick it up
        setStatus('loading');
        setMessage('Your session has expired. Redirecting to login...');
        setTimeout(() => navigate('/login?oauth_pending=1', { replace: true }), 1500);
        return;
      }

      // ── Exchange the code via the backend ──────────────────────────────
      try {
        localStorage.removeItem(OAUTH_PENDING_KEY);
        const platformId = pending.platform.toLowerCase() as import('@/types').PlatformId;
        const account = await socialAccountService.handleCallback(
          platformId,
          code,
          pending.redirectUri,
        );
        setStatus('success');
        setMessage(`${account.accountName ?? 'Account'} connected successfully!`);
        setTimeout(() => navigate('/settings', { replace: true, state: { connectedAccountId: account.id } }), 1500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to connect account';
        setStatus('error');
        setMessage(msg);
        setTimeout(() => navigate('/settings', { replace: true }), 3000);
      }
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon = status === 'success'
    ? '✅'
    : status === 'error'
      ? '❌'
      : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center gap-4 max-w-sm w-full">
        {/* Spinner or icon */}
        {status === 'loading' ? (
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="text-4xl">{icon}</div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 text-center">
          {status === 'loading' && 'Connecting your account'}
          {status === 'success' && 'Connected!'}
          {status === 'error'   && 'Something went wrong'}
        </h2>

        <p className="text-sm text-gray-500 text-center">{message}</p>
      </div>
    </div>
  );
}

/** The sessionStorage key where a pending code is stored across login. */
export const OAUTH_CODE_KEY_EXPORT = OAUTH_CODE_KEY;
