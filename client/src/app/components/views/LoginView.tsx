// ============================================
// LOGIN VIEW
// ============================================

import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { socialAccountService } from "@/services/socialAccountService";

const OAUTH_CODE_KEY = 'oauth_pending_code';

export function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // Check if we came here from an OAuth callback (session had expired)
  const hasPendingOAuth = new URLSearchParams(location.search).get('oauth_pending') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(formData.email, formData.password);

      // Replay pending OAuth code if one was saved before session expired
      const raw = sessionStorage.getItem(OAUTH_CODE_KEY);
      if (raw) {
        sessionStorage.removeItem(OAUTH_CODE_KEY);
        try {
          const { code, platform, redirectUri } = JSON.parse(raw) as {
            code: string;
            platform: string;
            redirectUri: string;
          };
          const platformId = platform.toLowerCase() as import('@/types').PlatformId;
          const account = await socialAccountService.handleCallback(platformId, code, redirectUri);
          navigate('/settings', { replace: true, state: { connectedAccountId: account.id } });
          return;
        } catch {
          // Code exchange failed (code may have expired) — just go to settings
          navigate('/settings', { replace: true });
          return;
        }
      }

      navigate("/overview");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Social Hub</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPendingOAuth && !error && (
            <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded">
              Your session expired while connecting your account. Sign in below and we'll finish connecting it automatically.
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}