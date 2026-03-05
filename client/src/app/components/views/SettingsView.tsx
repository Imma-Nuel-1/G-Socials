// ============================================
// SETTINGS VIEW - Enhanced with Working Features
// ============================================

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  User,
  Bell,
  Shield,
  Key,
  Link2,
  Palette,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  Copy,
  Moon,
  Sun,
  Monitor,
  Lock,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Video,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import * as settingsService from "@/services/settingsService";
import { authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useApiKeys } from "@/hooks/useApiKeys";

// ============================================
// TYPES & CONSTANTS
// ============================================

const SOCIAL_PLATFORMS = [
  {
    id: "LINKEDIN",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-600",
    description: "Connect your LinkedIn profile or company page",
  },
  {
    id: "TWITTER",
    name: "Twitter/X",
    icon: Twitter,
    color: "bg-sky-500",
    description: "Connect your Twitter (X) account",
  },
  {
    id: "INSTAGRAM",
    name: "Instagram",
    icon: Instagram,
    color: "bg-pink-600",
    description: "Connect your Instagram business account",
  },
  {
    id: "FACEBOOK",
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-700",
    description: "Connect your Facebook page or profile",
  },
  {
    id: "TIKTOK",
    name: "TikTok",
    icon: Video,
    color: "bg-black",
    description: "Connect your TikTok account",
  },
];

// ============================================
// TOAST/NOTIFICATION COMPONENT
// ============================================

function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
      <Alert
        className={`${type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
      >
        <div className="flex items-center gap-2">
          {type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription
            className={type === "success" ? "text-green-800" : "text-red-800"}
          >
            {message}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}

// ============================================
// PROFILE TAB
// ============================================

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: "",
    bio: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? "",
        email: user.email ?? "",
        avatar: user.avatar ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile(profile);
      if (success) {
        setToast({ message: "Profile updated successfully!", type: "success" });
        setIsEditing(false);
      } else {
        setToast({ message: "Failed to update profile", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Failed to update profile", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Profile Information
        </h3>
        <p className="text-sm text-gray-600">
          Update your profile details and photo
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-6 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback>
              {profile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm" disabled={!isEditing}>
              Change Photo
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG or GIF. Max size 2MB
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              disabled={!isEditing}
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// NOTIFICATIONS TAB
// ============================================

function NotificationsTab() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    postReminders: true,
    teamUpdates: true,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleToggle = async (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsService.updateUserSettings({
        [key]: value,
      } as any);
      setToast({
        message: "Notification preferences updated",
        type: "success",
      });
    } catch (error) {
      setToast({ message: "Failed to update preferences", type: "error" });
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-600">
          Choose how you want to receive updates
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {[
            {
              key: "emailNotifications",
              label: "Email Notifications",
              desc: "Receive notifications via email",
            },
            {
              key: "pushNotifications",
              label: "Push Notifications",
              desc: "Receive push notifications in browser",
            },
            {
              key: "weeklyReport",
              label: "Weekly Report",
              desc: "Get weekly analytics summary",
            },
            {
              key: "postReminders",
              label: "Post Reminders",
              desc: "Reminders for scheduled posts",
            },
            {
              key: "teamUpdates",
              label: "Team Updates",
              desc: "Updates from team members",
            },
          ].map((item, index) => (
            <div key={item.key}>
              {index > 0 && <Separator className="mb-6" />}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                <Switch
                  checked={settings[item.key as keyof typeof settings]}
                  onCheckedChange={(checked) => handleToggle(item.key, checked)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================
// CONNECTED ACCOUNTS TAB - The Main Feature!
// ============================================

function ConnectedAccountsTab() {
  const {
    accounts,
    isLoading: loading,
    error,
    connectAccount,
    handleOAuthCallback,
    disconnectAccount,
    toggleAccount,
  } = useConnectedAccounts();

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    (typeof SOCIAL_PLATFORMS)[0] | null
  >(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Surface hook-level fetch errors as toasts
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);

  // Handle OAuth provider redirect-back (?oauth_callback=1&code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_callback") !== "1") return;
    const code = params.get("code");
    if (!code) {
      // Error from provider
      const providerError = params.get("error_description") ?? params.get("error");
      if (providerError) {
        setToast({ message: `Facebook: ${providerError}`, type: "error" });
      }
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    // Clean up the URL immediately so a refresh doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsConnecting(true);
    handleOAuthCallback(code)
      .then((account) => {
        setToast({
          message: `${account.accountName ?? "Account"} connected successfully!`,
          type: "success",
        });
      })
      .catch((err: unknown) => {
        setToast({
          message:
            err instanceof Error ? err.message : "Failed to connect account",
          type: "error",
        });
      })
      .finally(() => setIsConnecting(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show success toast when redirected back from OAuthCallbackView
  const location = useLocation();
  useEffect(() => {
    const state = location.state as { connectedAccountId?: string } | null;
    if (state?.connectedAccountId) {
      setToast({ message: "Account connected successfully!", type: "success" });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = (platform: (typeof SOCIAL_PLATFORMS)[0]) => {
    setSelectedPlatform(platform);
    setShowConnectDialog(true);
  };

  const handleConfirmConnect = async () => {
    if (!selectedPlatform) return;

    setIsConnecting(true);
    try {
      // connectAccount fetches the OAuth URL and redirects the browser.
      // The page will navigate away; isConnecting stays true as visual feedback.
      await connectAccount({ platform: selectedPlatform.id });
    } catch (error) {
      setToast({
        message: `Failed to connect ${selectedPlatform.name}`,
        type: "error",
      });
      setIsConnecting(false);
    }
    // Do NOT call setIsConnecting(false) on success — the redirect unloads the page.
  };

  const handleDisconnect = async (accountId: string, platformName: string) => {
    if (
      !confirm(
        `Are you sure you want to disconnect this ${platformName} account?`,
      )
    )
      return;

    try {
      await disconnectAccount(accountId);
      setToast({
        message: "Account disconnected successfully",
        type: "success",
      });
    } catch (error) {
      setToast({ message: "Failed to disconnect account", type: "error" });
    }
  };

  const handleToggle = async (accountId: string, isActive: boolean) => {
    try {
      await toggleAccount(accountId, isActive);
      setToast({
        message: `Account ${isActive ? "activated" : "deactivated"}`,
        type: "success",
      });
    } catch (error) {
      setToast({ message: "Failed to update account status", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Social Media Accounts
        </h3>
        <p className="text-sm text-gray-600">
          Connect and manage your social media accounts for centralized posting
        </p>
      </div>

      {/* Available Platforms to Connect */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Available Platforms
        </h4>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading accounts...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isConnected = accounts?.some(
                (a) => a.platform === platform.id,
              );

              return (
                <Card
                  key={platform.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${platform.color} bg-opacity-10`}
                      >
                        <Icon
                          className={`w-5 h-5 ${platform.color === "bg-black" ? "text-black" : "text-" + platform.color.replace("bg-", "")}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {platform.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnect(platform)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Connected Accounts */}
      {!loading && accounts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Connected Accounts ({accounts.length})
          </h4>
          <div className="space-y-3">
            {accounts.map((account) => {
              const platform = SOCIAL_PLATFORMS.find(
                (p) => p.id === account.platform,
              );
              const Icon = platform?.icon || Link2;

              return (
                <Card key={account.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={account.accountAvatar} />
                        <AvatarFallback className={platform?.color}>
                          <Icon className="w-5 h-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {account.accountName}
                          </p>
                          <Badge
                            variant={account.isActive ? "default" : "secondary"}
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {platform?.name}
                        </p>
                        {account.lastSyncedAt && (
                          <p className="text-xs text-gray-500">
                            Last synced{" "}
                            {new Date(account.lastSyncedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.isActive}
                        onCheckedChange={(checked) =>
                          handleToggle(account.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDisconnect(
                            account.id,
                            platform?.name || "account",
                          )
                        }
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.name}</DialogTitle>
            <DialogDescription>
              You'll be redirected to {selectedPlatform?.name} to authorize
              Social Hub to access your account.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Permissions needed:</strong>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  <li>Read and publish posts</li>
                  <li>Access analytics data</li>
                  <li>Manage comments and messages</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConnectDialog(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Continue to {selectedPlatform?.name}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// SECURITY, API KEYS & PREFERENCES TABS
// ============================================

function SecurityTab() {
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }
    if (passwordForm.new.length < 8) {
      setToast({
        message: "Password must be at least 8 characters",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      await authService.changePassword(passwordForm.current, passwordForm.new);
      setPasswordForm({ current: "", new: "", confirm: "" });
      setToast({ message: "Password changed successfully!", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to change password", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Change Password</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPassword ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={passwordForm.new}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new: e.target.value })
              }
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={
              isSaving ||
              !passwordForm.current ||
              !passwordForm.new ||
              !passwordForm.confirm
            }
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              Two-Factor Authentication
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Add an extra layer of security to your account
            </p>
            {twoFactorEnabled && (
              <Badge variant="default" className="bg-green-600">
                <Check className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            )}
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
          />
        </div>
      </Card>
    </div>
  );
}

function ApiKeysTab() {
  const { apiKeys, error, createKey, revokeKey } = useApiKeys();

  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Surface hook-level fetch errors as toasts
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setToast({ message: "Please enter a key name", type: "error" });
      return;
    }

    setIsCreating(true);
    try {
      const newKey = await createKey(newKeyName);
      setNewKeyName("");
      setShowNewKeyDialog(false);
      setToast({ message: "API key created successfully!", type: "success" });

      navigator.clipboard.writeText(newKey.key);
      setCopiedKey(newKey.key);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch (error) {
      setToast({ message: "Failed to create API key", type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke "${keyName}"?`)) return;

    try {
      await revokeKey(keyId);
      setToast({ message: "API key revoked", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to revoke API key", type: "error" });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setToast({ message: "API key copied to clipboard", type: "success" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">API Keys</h3>
          <p className="text-sm text-gray-600">
            Manage your API keys for integrations
          </p>
        </div>
        <Button onClick={() => setShowNewKeyDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Key
        </Button>
      </div>

      <div className="space-y-3">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{apiKey.name}</p>
                <p className="text-sm text-gray-600">
                  Created {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeKey(apiKey.id, apiKey.name)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
              <code className="flex-1 text-sm font-mono text-gray-700 overflow-hidden text-ellipsis">
                {apiKey.key}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyKey(apiKey.key)}
              >
                {copiedKey === apiKey.key ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}

        {apiKeys.length === 0 && (
          <Card className="p-8 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No API keys yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Create an API key to integrate with external services
            </p>
            <Button onClick={() => setShowNewKeyDialog(true)}>
              Create Your First Key
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Give your API key a descriptive name to help you identify it
              later.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="key-name">Key Name</Label>
            <Input
              id="key-name"
              placeholder="e.g., Production API, Mobile App"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
              className="mt-2"
            />

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Make sure to copy your API key. You won't be able to see it
                again!
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewKeyDialog(false);
                setNewKeyName("");
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={isCreating || !newKeyName.trim()}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreferencesTab() {
  const [preferences, setPreferences] = useState(() => {
    let savedTheme = 'light';
    try {
      const stored = localStorage.getItem('smm_theme');
      if (stored) savedTheme = JSON.parse(stored);
    } catch {}
    return {
      theme: savedTheme,
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      defaultPlatform: "LINKEDIN",
      autoSaveDrafts: true,
      contentApproval: false,
    };
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleUpdate = async (key: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      try { localStorage.setItem('smm_theme', JSON.stringify(value)); } catch {}
      document.documentElement.classList.remove('dark');
      if (value === 'dark') document.documentElement.classList.add('dark');
    }
    try {
      await settingsService.updateUserSettings({
        [key]: value,
      } as any);
      setToast({ message: "Preferences updated", type: "success" });
    } catch (error) {
      setToast({ message: "Failed to update preferences", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Appearance</h4>
        <div className="space-y-4">
          <div>
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "auto", icon: Monitor, label: "Auto" },
              ].map((theme) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() => handleUpdate("theme", theme.value)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      preferences.theme === theme.value
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">{theme.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Localization</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={preferences.language}
                onValueChange={(v) => handleUpdate("language", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={preferences.timezone}
                onValueChange={(v) => handleUpdate("timezone", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    Pacific Time
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(v) => handleUpdate("dateFormat", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select
                value={preferences.timeFormat}
                onValueChange={(v) => handleUpdate("timeFormat", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          Content Preferences
        </h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="defaultPlatform">Default Platform</Label>
            <Select
              value={preferences.defaultPlatform}
              onValueChange={(v) => handleUpdate("defaultPlatform", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto-save Drafts</p>
              <p className="text-sm text-gray-600">
                Automatically save your work
              </p>
            </div>
            <Switch
              checked={preferences.autoSaveDrafts}
              onCheckedChange={(checked) =>
                handleUpdate("autoSaveDrafts", checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Content Approval</p>
              <p className="text-sm text-gray-600">
                Require approval before publishing
              </p>
            </div>
            <Switch
              checked={preferences.contentApproval}
              onCheckedChange={(checked) =>
                handleUpdate("contentApproval", checked)
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// MAIN SETTINGS VIEW
// ============================================

export function SettingsView() {
  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and social media connections
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-grid h-auto gap-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-2">
              <Link2 className="w-4 h-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Palette className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="accounts">
            <ConnectedAccountsTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="api">
            <ApiKeysTab />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
