// ============================================
// ANALYTICS VIEW — Real-time data with Facebook sync
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Clock, Calendar, TrendingUp, TrendingDown,
  Eye, MousePointerClick, Share2, Sparkles, RefreshCw,
} from 'lucide-react';
import { Card } from '../ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '@/api/client';
import analyticsService from '@/services/analyticsService';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '../layout/NotificationBell';
import { CreatePostButton } from '../layout/CreatePostButton';

// How often to re-fetch analytics (ms)
const POLL_INTERVAL = 60_000;        // 1 min
// How often to re-sync Facebook data (ms)
const SYNC_INTERVAL = 5 * 60_000;   // 5 min

// -- Helper -----------------------------------------------------------------

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// -- Main Component --------------------------------------------------------

export function AnalyticsView() {
  return (
    <div className="h-full bg-gray-50">
      <Header />
      <div className="p-6 overflow-auto">
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600">
            Real-time social media performance — auto-refreshes every minute
          </p>
        </div>
        <MetricsGrid />
        <EngagementChart />
        <div className="grid grid-cols-2 gap-6">
          <AIInsightsCard />
          <TopPostsCard />
        </div>
      </div>
    </div>
  );
}

// -- Header ----------------------------------------------------------------

function Header() {
  const { user } = useAuth();
  return (
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
              placeholder="Search analytics"
              className="w-[400px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
          </button>
          <NotificationBell />
          <CreatePostButton />
        </div>
      </div>
    </header>
  );
}

// -- Metrics Grid ----------------------------------------------------------

function MetricsGrid() {
  const [overview, setOverview] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/analytics/overview');
      // Interceptor returns response.data (the envelope), so res.data is the payload
      setOverview(res.data ?? res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Analytics] overview fetch failed:', err);
    }
  }, []);

  const doSync = useCallback(async () => {
    setSyncing(true);
    try {
      await analyticsService.syncFacebook();
      await fetchData();
    } finally {
      setSyncing(false);
    }
  }, [fetchData]);

  useEffect(() => {
    // Initial load: sync then fetch
    doSync();
    // Poll analytics every POLL_INTERVAL
    pollTimerRef.current = setInterval(fetchData, POLL_INTERVAL);
    // Re-sync Facebook every SYNC_INTERVAL
    syncTimerRef.current = setInterval(doSync, SYNC_INTERVAL);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [doSync, fetchData]);

  const d = overview;

  const metrics = [
    {
      label: 'Total Reach',
      value: fmtNum(d?.totalReach?.value ?? 0),
      change: d?.totalReach?.change ?? '--',
      positive: !String(d?.totalReach?.change ?? '').startsWith('-'),
      icon: Eye,
      iconColor: 'text-blue-600',
    },
    {
      label: 'Engagement Rate',
      value: String(d?.engagementRate?.value ?? '0%'),
      change: d?.engagementRate?.change ?? '--',
      positive: !String(d?.engagementRate?.change ?? '').startsWith('-'),
      icon: MousePointerClick,
      iconColor: 'text-purple-600',
    },
    {
      label: 'Total Clicks',
      value: fmtNum(d?.totalClicks?.value ?? 0),
      change: null,
      positive: true,
      icon: MousePointerClick,
      iconColor: 'text-orange-600',
    },
    {
      label: 'Total Followers',
      value: fmtNum(d?.totalFollowers?.value ?? 0),
      change: null,
      positive: true,
      icon: Share2,
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {lastUpdated && (
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <button
          onClick={doSync}
          disabled={syncing}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Facebook...' : 'Sync Now'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{metric.label}</span>
              <metric.icon className={`w-4 h-4 ${metric.iconColor}`} />
            </div>
            <div className="font-semibold text-2xl mb-1">{metric.value}</div>
            {metric.change && (
              <div className={`flex items-center gap-1 text-sm ${metric.positive ? 'text-green-600' : 'text-red-500'}`}>
                {metric.positive
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />
                }
                <span>{metric.change}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// -- Engagement Chart -----------------------------------------------------

function EngagementChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const fetchEngagement = useCallback(async () => {
    try {
      const res = await apiClient.get('/analytics/engagement', { params: { period } });
      const payload = res.data ?? res;
      // Backend returns: { data: [...snapshots], metrics: {...} }
      const rows: any[] = Array.isArray(payload?.data) ? payload.data : [];
      setChartData(rows.map((r: any) => ({
        date: r.date,
        engagement: r.engagement ?? 0,
        impressions: r.impressions ?? 0,
        clicks: r.clicks ?? 0,
      })));
    } catch (err) {
      console.error('[Analytics] engagement fetch failed:', err);
    }
  }, [period]);

  useEffect(() => {
    fetchEngagement();
    const timer = setInterval(fetchEngagement, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchEngagement]);

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Engagement Over Time</h3>
          <p className="text-sm text-gray-600">Real Facebook performance trends</p>
        </div>
        <select
          className="text-sm border border-gray-300 rounded px-3 py-1.5"
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
        >
          <option value="day">Last 24 hours</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="impressions" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorImpressions)" name="Impressions" />
          <Area type="monotone" dataKey="engagement" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEngagement)" name="Engagement" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// -- AI Insights ----------------------------------------------------------

function AIInsightsCard() {
  const insights = [
    { type: 'success', title: 'Best posting time', description: 'Your audience is most active 6-9 PM. Schedule posts then for maximum reach.' },
    { type: 'info',    title: 'Content tip',        description: 'Posts with images get 2.3x more engagement than text-only posts.' },
  ];

  const getStyle = (type: string) => {
    if (type === 'success') return 'bg-green-50 border-green-200';
    if (type === 'warning')  return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">AI Analysis & Insights</h3>
      </div>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getStyle(insight.type)}`}>
            <div className="font-medium text-sm mb-1">{insight.title}</div>
            <div className="text-sm text-gray-600">{insight.description}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// -- Top Posts ------------------------------------------------------------

function TopPostsCard() {
  const [posts, setPosts] = useState<any[]>([]);

  const fetchTopPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/analytics/top-posts', { params: { limit: 4 } });
      const payload = res.data ?? res;
      setPosts(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('[Analytics] top-posts fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchTopPosts();
    const timer = setInterval(fetchTopPosts, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchTopPosts]);

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Top Performing Posts</h3>
      {posts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No published posts yet — sync your Facebook account to see live data here.
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-600 font-medium mb-1">{post.platform}</div>
                <div className="text-sm text-gray-800 truncate mb-2">
                  {post.content?.slice(0, 80) ?? '(No caption)'}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>?? {fmtNum(post.likes ?? 0)}</span>
                  <span>?? {fmtNum(post.comments ?? 0)}</span>
                  <span>?? {fmtNum(post.shares ?? 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
