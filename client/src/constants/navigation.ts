// ============================================
// CONSTANTS - NAVIGATION & VIEWS
// ============================================

import { ViewId, MenuItem } from "@/types";

export const VIEW_IDS: Record<string, ViewId> = {
  OVERVIEW: "overview",
  CONTENT_CALENDAR: "content-calendar",
  SCHEDULER: "scheduler",
  ANALYTICS: "analytics",
  TEAM: "team",
  AI_ASSISTANT: "ai-assistant",
  ADS: "ads",
  TEMPLATES: "templates",
  TRASH: "trash",
  SETTINGS: "settings",
  HELP: "help",
} as const;

export const MENU_ITEMS: MenuItem[] = [
  { id: "overview", label: "Overview", icon: "Target" },
  { id: "content-calendar", label: "Content Calendar", icon: "Calendar" },
  { id: "scheduler", label: "Scheduler", icon: "Clock" },
  { id: "analytics", label: "Analytics", icon: "BarChart2" },
  { id: "team", label: "Team", icon: "Users" },
  { id: "ai-assistant", label: "AI Assistant", icon: "Sparkles" },
  { id: "ads", label: "Ads", icon: "Megaphone" },
  { id: "templates", label: "Templates", icon: "FileText" },
  { id: "trash", label: "Trash", icon: "Trash2" },
  { id: "settings", label: "Settings", icon: "Settings" },
  { id: "help", label: "Help Center", icon: "HelpCircle" },
];

export const DEFAULT_VIEW: ViewId = "overview";
