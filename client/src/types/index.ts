// ============================================
// SOCIAL MEDIA MANAGEMENT PLATFORM - TYPE DEFINITIONS
// ============================================

// ============================================
// PLATFORM & POST TYPES
// ============================================

export type PlatformId =
  | "linkedin"
  | "twitter"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";
export type Platform = PlatformId; // Alias for convenience

export type PostStatus =
  | "draft"
  | "pending_approval"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type ToneId = "professional" | "casual" | "humorous" | "inspirational";
export type Tone = ToneId; // Alias for convenience

// Platform configuration object
export interface PlatformConfig {
  id: PlatformId;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

// Tone configuration object
export interface ToneConfig {
  id: ToneId;
  name: string;
  description: string;
}

export interface Post {
  id: string;
  content: string;
  platform: PlatformId;
  author?: string;
  role?: string;
  views?: string;
  hashtags?: string;
  image?: string;
  images?: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledPost {
  id: string;
  day: number;
  hour: number;
  duration: number;
  title: string;
  subtitle?: string;
  time: string;
  platform: PlatformId | "event";
  color: string;
  postId?: string;
}

// ============================================
// TEMPLATE & LAYER TYPES
// ============================================

export type LayerType = "text" | "image" | "rectangle" | "circle" | "shape";

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  opacity?: number;
  content?: string;
  color?: string;
  fontSize?: number;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  layers: Layer[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface PerformanceMetric {
  date: string;
  impressions: number;
  engagement: number;
  clicks: number;
}

export interface WeeklyData {
  day: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface PlatformDistribution {
  name: string;
  value: number;
  color: string;
}

export interface EngagementMetric {
  label: string;
  value: string;
  color: string;
  trend?: "up" | "down" | "neutral";
}

export interface AIInsight {
  id?: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  description: string;
}

export interface TopPost {
  id: string;
  image: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
}

// ============================================
// USER & TEAM TYPES
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
  status?: "active" | "inactive" | "away";
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  sender: string;
  avatar?: string;
  message?: string;
  images?: string[];
  time: string;
  isOwn: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar: string;
  unread: boolean;
  badge?: string;
  userId?: string;
}

// ============================================
// ACTIVITY & NOTIFICATION TYPES
// ============================================

export interface Activity {
  id?: string;
  title: string;
  platform: string;
  time: string;
  type?: "post" | "campaign" | "schedule" | "team";
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface CreatePostInput {
  content: string;
  platform: PlatformId;
  tone: ToneId;
  scheduledAt?: Date;
  images?: File[];
}

export interface GenerateContentInput {
  description: string;
  platform: PlatformId;
  tone: ToneId;
}

// ============================================
// VIEW & NAVIGATION TYPES
// ============================================

export type ViewId =
  | "overview"
  | "content-calendar"
  | "scheduler"
  | "analytics"
  | "team"
  | "ai-assistant"
  | "ads"
  | "templates"
  | "trash"
  | "settings"
  | "help";

export interface MenuItem {
  id: ViewId;
  label: string;
  icon: string;
}

// ============================================
// WORKSPACE TYPES
// ============================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  role: string;
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  isActive: boolean;
  members: WorkspaceMember[];
  subscription?: WorkspaceSubscription;
  settings?: WorkspaceSettings;
  _count?: {
    socialAccounts: number;
    posts: number;
  };
}

export interface WorkspaceMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface WorkspaceSubscription {
  plan: string;
  status: string;
  maxSocialAccounts: number;
  maxPostsPerMonth: number;
  maxTeamMembers: number;
}

export interface WorkspaceSettings {
  id: string;
  defaultTimezone: string;
  defaultLanguage: string;
  contentApproval: boolean;
  autoSaveDrafts: boolean;
  emailNotifications: boolean;
  webhookNotifications: boolean;
}

// ============================================
// SOCIAL ACCOUNT TYPES
// ============================================

export interface SocialAccount {
  id: string;
  platform: PlatformId;
  platformAccountId: string;
  accountName: string;
  accountAvatar?: string;
  accountUrl?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  lastErrorMessage?: string;
}
