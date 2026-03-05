// ============================================
// ADS VIEW - Advertising Campaigns Manager
// ============================================

import { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  MoreVertical,
  Play,
  Pause,
  BarChart2,
  Filter,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import apiClient from "@/api/client";

// ============================================
// TYPES
// ============================================

interface AdCampaign {
  id: number;
  name: string;
  platform: string;
  status: "active" | "paused" | "completed" | "draft";
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  startDate: string;
  endDate: string;
}

// ============================================
// COMPONENT
// ============================================

export function AdsView() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // Ads endpoint — fallback gracefully if not implemented
        const res = await apiClient.get('/posts?type=ad');
        const data = res.data?.data ?? res.data ?? [];
        if (Array.isArray(data)) {
          setCampaigns(data.map((c: any) => ({
            id: c.id,
            name: c.content?.substring(0, 40) ?? 'Untitled',
            platform: c.platform ?? 'Unknown',
            status: (c.status ?? 'draft').toLowerCase() as any,
            budget: c.budget ?? 0,
            spent: c.spent ?? 0,
            impressions: c.impressions ?? 0,
            clicks: c.clicks ?? 0,
            ctr: c.clicks && c.impressions ? Number(((c.clicks / c.impressions) * 100).toFixed(2)) : 0,
            conversions: c.conversions ?? 0,
            startDate: c.startDate ?? '',
            endDate: c.endDate ?? '',
          })));
        }
      } catch (err) {
        console.error('Failed to fetch campaigns:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const filteredCampaigns =
    filterStatus === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === filterStatus);

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = campaigns.reduce(
    (sum, c) => sum + c.impressions,
    0,
  );
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active",
  ).length;

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Ad Campaigns
            </h1>
            <p className="text-sm text-gray-600">
              Manage and track your advertising campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Budget</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="font-semibold text-2xl">
              ${totalBudget.toLocaleString()}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Spent</span>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <div className="font-semibold text-2xl">
              ${totalSpent.toLocaleString()}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Impressions</span>
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div className="font-semibold text-2xl">
              {(totalImpressions / 1000).toFixed(0)}K
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Clicks</span>
              <MousePointerClick className="w-4 h-4 text-purple-600" />
            </div>
            <div className="font-semibold text-2xl">
              {(totalClicks / 1000).toFixed(1)}K
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Campaigns</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="font-semibold text-2xl">{activeCampaigns}</div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["all", "active", "paused", "draft", "completed"].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status ? "default" : "outline"}
              className={
                filterStatus === status ? "bg-blue-600 text-white" : ""
              }
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Campaigns Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Campaign
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Platform
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Budget / Spent
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Impressions
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    CTR
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Conversions
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <CampaignRow key={campaign.id} campaign={campaign} />
                ))}
              </tbody>
            </table>
          </div>
          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No campaigns found for this filter.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function CampaignRow({ campaign }: { campaign: AdCampaign }) {
  const statusStyles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-700",
    draft: "bg-blue-100 text-blue-700",
  };

  const spentPercent =
    campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="font-medium text-sm text-gray-900">{campaign.name}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <Calendar className="w-3 h-3" />
          {campaign.startDate} — {campaign.endDate}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">{campaign.platform}</span>
      </td>
      <td className="px-6 py-4">
        <Badge className={`${statusStyles[campaign.status]} border-0 text-xs`}>
          {campaign.status}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          ${campaign.spent.toLocaleString()} / $
          {campaign.budget.toLocaleString()}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className="bg-blue-600 h-1.5 rounded-full"
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">
          {campaign.impressions.toLocaleString()}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">{campaign.ctr}%</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">{campaign.conversions}</span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {campaign.status === "active" && (
            <Button size="sm" variant="ghost" title="Pause Campaign">
              <Pause className="w-4 h-4 text-gray-500" />
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button size="sm" variant="ghost" title="Resume Campaign">
              <Play className="w-4 h-4 text-gray-500" />
            </Button>
          )}
          <Button size="sm" variant="ghost" title="View Stats">
            <BarChart2 className="w-4 h-4 text-gray-500" />
          </Button>
          <Button size="sm" variant="ghost" title="More options">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
