// ============================================
// OVERVIEW VIEW — Real-time Facebook data, auto-polling
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Clock, Calendar, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import apiClient from '@/api/client';
import analyticsService from '@/services/analyticsService';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '../layout/NotificationBell';
import { CreatePostButton } from '../layout/CreatePostButton';

const POLL_INTERVAL = 60_000;      // re-fetch analytics every 1 min
const SYNC_INTERVAL = 5 * 60_000; // re-sync Facebook every 5 min

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OverviewView() {
  const { user } = useAuth();

  // -- State ------------------------------------------------------------------
  const [overview, setOverview]     = useState<any>(null);
  const [engagement, setEngagement] = useState<any[]>([]);
  const [platforms, setPlatforms]   = useState<any[]>([]);
  const [topPosts, setTopPosts]     = useState<any[]>([]);
  const [syncing, setSyncing]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Fetch all analytics ----------------------------------------------------
  const fetchAll = useCallback(async () => {
    try {
      const [ovRes, engRes, platRes, topRes] = await Promise.allSettled([
        apiClient.get('/analytics/overview'),
        apiClient.get('/analytics/engagement', { params: { period: 'week' } }),
        apiClient.get('/analytics/platforms'),
        apiClient.get('/analytics/top-posts', { params: { limit: 5 } }),
      ]);

      if (ovRes.status === 'fulfilled') {
        const d = ovRes.value.data ?? ovRes.value;
        setOverview(d);
      }
      if (engRes.status === 'fulfilled') {
        const payload = engRes.value.data ?? engRes.value;
        const rows: any[] = Array.isArray(payload?.data) ? payload.data : [];
        setEngagement(rows);
      }
      if (platRes.status === 'fulfilled') {
        const payload = platRes.value.data ?? platRes.value;
        setPlatforms(Array.isArray(payload) ? payload : []);
      }
      if (topRes.status === 'fulfilled') {
        const payload = topRes.value.data ?? topRes.value;
        setTopPosts(Array.isArray(payload) ? payload : []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Overview] fetchAll failed:', err);
    }
  }, []);

  // -- Sync + fetch -----------------------------------------------------------
  const doSync = useCallback(async () => {
    setSyncing(true);
    try {
      await analyticsService.syncFacebook();
      await fetchAll();
    } finally {
      setSyncing(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    doSync();
    pollTimerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    syncTimerRef.current = setInterval(doSync, SYNC_INTERVAL);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [doSync, fetchAll]);

  // -- Derive metric cards from backend shape ---------------------------------
  const d = overview;
  const metricCards = [
    {
      label: 'Total Reach',
      value: fmtNum(d?.totalReach?.value ?? 0),
      change: d?.totalReach?.change ?? '--',
      positive: !String(d?.totalReach?.change ?? '').startsWith('-'),
    },
    {
      label: 'Engagement Rate',
      value: String(d?.engagementRate?.value ?? '0%'),
      change: d?.engagementRate?.change ?? '--',
      positive: !String(d?.engagementRate?.change ?? '').startsWith('-'),
    },
    {
      label: 'Posts This Week',
      value: String(d?.postsThisWeek?.value ?? 0),
      change: d?.postsThisWeek?.change ?? '--',
      positive: !String(d?.postsThisWeek?.change ?? '').startsWith('-'),
    },
    {
      label: 'Active Campaigns',
      value: String(d?.activeCampaigns?.value ?? 0),
      change: null,
      positive: true,
    },
  ];

  // Weekly bar chart: map engagement snapshots to day buckets
  const weeklyData = engagement.slice(-7).map((r: any) => ({
    day: new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short' }),
    views: r.impressions ?? 0,
    likes: r.likes ?? 0,
    comments: r.comments ?? 0,
    shares: r.shares ?? 0,
  }));

  const engagementMetrics = [
    { label: 'Impressions', value: fmtNum(engagement.reduce((s: number, r: any) => s + (r.impressions ?? 0), 0)), color: 'text-blue-600' },
    { label: 'Engagement',  value: fmtNum(engagement.reduce((s: number, r: any) => s + (r.engagement ?? 0), 0)),  color: 'text-purple-600' },
    { label: 'Clicks',      value: fmtNum(engagement.reduce((s: number, r: any) => s + (r.clicks ?? 0), 0)),      color: 'text-orange-600' },
    { label: 'Followers',   value: fmtNum(d?.totalFollowers?.value ?? 0),                                         color: 'text-green-600' },
  ];

  const recentActivities = topPosts.slice(0, 5).map((p: any) => ({
    title: p.content?.slice(0, 60) ?? '(No caption)',
    platform: p.platform,
    time: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '--',
  }));

  // -- Render -----------------------------------------------------------------
  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content, campaigns"
                className="w-[400px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </button>
            <NotificationBell />
            <CreatePostButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 overflow-auto">
        {/* Greeting */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              Good Morning, {user?.name || 'User'}
            </h2>
            <p className="text-sm text-gray-600">
              {lastUpdated
                ? `Live data — last synced ${lastUpdated.toLocaleTimeString()}`
                : "Loading your social media data..."}
            </p>
          </div>
          <button
            onClick={doSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 mt-1"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {metricCards.map((m, i) => (
            <MetricCard key={i} label={m.label} value={m.value} change={m.change} positive={m.positive} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <WeeklyEngagementChart weeklyData={weeklyData} engagementMetrics={engagementMetrics} />
          <PlatformDistributionChart platformData={platforms} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          <RecentActivitySection activities={recentActivities} />
          <AIAssistantWidget />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface MetricCardProps {
  label: string;
  value: string;
  change: string | null;
  positive: boolean;
}

function MetricCard({ label, value, change, positive }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="font-semibold text-3xl mb-2">{value}</div>
      {change && (
        <div className={`flex items-center gap-1 text-xs ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      )}
    </Card>
  );
}

function WeeklyEngagementChart({ weeklyData, engagementMetrics }: { weeklyData: any[]; engagementMetrics: any[] }) {
  return (
    <Card className="p-6 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Weekly Engagement</h3>
          <p className="text-sm text-gray-600">Engagement and reach over the past week</p>
        </div>
      </div>

      <div className="mb-4 bg-blue-50 p-3 rounded-lg">
        <div className="grid grid-cols-4 gap-4 text-xs">
          {engagementMetrics.map((metric, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-gray-500 mb-0.5">{metric.label}</span>
              <span className={`font-semibold ${metric.color}`}>{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip />
          <Bar dataKey="views"    fill="#3b82f6" radius={[4, 4, 0, 0]} name="Impressions" />
          <Bar dataKey="likes"    fill="#60a5fa" radius={[4, 4, 0, 0]} name="Likes" />
          <Bar dataKey="comments" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Comments" />
          <Bar dataKey="shares"   fill="#bfdbfe" radius={[4, 4, 0, 0]} name="Shares" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function PlatformDistributionChart({ platformData }: { platformData: any[] }) {
  const hasData = platformData.length > 0 && platformData.some((p) => p.value > 0);

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-1">Platform Distribution</h3>
      <p className="text-sm text-gray-600 mb-4">Posts by platform</p>

      {!hasData ? (
        <p className="text-xs text-gray-400 text-center mt-8">No data yet</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={platformData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color ?? '#3b82f6'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 space-y-1.5">
            {platformData.map((platform, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: platform.color ?? '#3b82f6' }} />
                  <span className="text-gray-700 text-xs">{platform.name}</span>
                </div>
                <span className="font-medium text-xs">{platform.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function RecentActivitySection({ activities }: { activities: any[] }) {
  return (
    <Card className="p-6 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
      </div>
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No recent activity — connect a social account and sync to see data.
          </p>
        ) : activities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
            <div>
              <div className="font-medium text-sm truncate max-w-xs">{activity.title}</div>
              <div className="text-xs text-blue-600 mt-0.5">{activity.platform}</div>
            </div>
            <div className="text-xs text-gray-500 shrink-0 ml-4">{activity.time}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIAssistantWidget() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm">?</span>
        </div>
        <h3 className="font-semibold text-gray-900">AI Assistant</h3>
      </div>
      <div className="space-y-3">
        <Button className="w-full justify-start bg-gray-50 text-gray-700 hover:bg-gray-100">
          Generate new caption
        </Button>
        <Button className="w-full justify-start bg-gray-50 text-gray-700 hover:bg-gray-100">
          Suggest hashtags
        </Button>
      </div>
    </Card>
  );
}
