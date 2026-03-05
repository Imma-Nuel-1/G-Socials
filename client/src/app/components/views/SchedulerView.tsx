// ============================================
// SCHEDULER VIEW - Post Scheduling Manager
// ============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import apiClient from "@/api/client";

// ============================================
// TYPES
// ============================================

interface ScheduledItem {
  id: number;
  title: string;
  content: string;
  platform: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "scheduled" | "published" | "failed" | "draft";
  author: string;
}

// ============================================
// COMPONENT DATA — Fetched from API
// ============================================

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

// ============================================
// COMPONENT
// ============================================

export function SchedulerView() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "timeline">("list");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [scheduleItems, setScheduleItems] = useState<ScheduledItem[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await apiClient.get('/posts?status=SCHEDULED');
        const posts = res.data?.data ?? res.data ?? [];
        const mapped: ScheduledItem[] = (Array.isArray(posts) ? posts : []).map((p: any) => ({
          id: p.id,
          title: p.content?.substring(0, 30) ?? 'Untitled',
          content: p.content ?? '',
          platform: p.platform ?? 'Unknown',
          scheduledDate: p.scheduledAt ? new Date(p.scheduledAt).toISOString().split('T')[0] : '',
          scheduledTime: p.scheduledAt ? new Date(p.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          status: (p.status ?? 'draft').toLowerCase() as any,
          author: p.createdBy?.name ?? '',
        }));
        setScheduleItems(mapped);
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const todayItems = scheduleItems.filter(
    (item) => item.scheduledDate === selectedDate,
  );
  const upcomingItems = scheduleItems.filter(
    (item) => item.scheduledDate > selectedDate,
  );
  const pastItems = scheduleItems.filter(
    (item) => item.scheduledDate < selectedDate,
  );

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Scheduler
            </h1>
            <p className="text-sm text-gray-600">
              Plan and schedule your content across platforms
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                className={view === "list" ? "bg-white shadow-sm" : ""}
                onClick={() => setView("list")}
              >
                List
              </Button>
              <Button
                size="sm"
                variant={view === "timeline" ? "default" : "ghost"}
                className={view === "timeline" ? "bg-white shadow-sm" : ""}
                onClick={() => setView("timeline")}
              >
                Timeline
              </Button>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/ai-assistant')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Post
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Date Navigator */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-6">
              {[...Array(7)].map((_, i) => {
                const date = new Date("2025-06-18");
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split("T")[0];
                const isSelected = dateStr === selectedDate;
                const dayNum = date.getDate();
                const dayName = DAYS_OF_WEEK[date.getDay()];

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-xs font-medium">{dayName}</span>
                    <span className="text-lg font-semibold">{dayNum}</span>
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {view === "list" ? (
          <div className="space-y-6">
            {/* Today's Schedule */}
            <section>
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today — {selectedDate}
                <Badge variant="outline" className="ml-2">
                  {todayItems.length} posts
                </Badge>
              </h2>
              {todayItems.length > 0 ? (
                <div className="space-y-3">
                  {todayItems.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No posts scheduled for this date</p>
                </Card>
              )}
            </section>

            {/* Upcoming */}
            {upcomingItems.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">
                  Upcoming
                  <Badge variant="outline" className="ml-2">
                    {upcomingItems.length}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {upcomingItems.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {pastItems.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-500 mb-3">
                  Past
                  <Badge variant="outline" className="ml-2">
                    {pastItems.length}
                  </Badge>
                </h2>
                <div className="space-y-3 opacity-75">
                  {pastItems.map((item) => (
                    <ScheduleCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Timeline View */
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200">
              {TIME_SLOTS.map((time) => {
                const slotItems = scheduleItems.filter(
                  (item) =>
                    item.scheduledDate === selectedDate &&
                    item.scheduledTime.startsWith(time.split(":")[0]),
                );

                return (
                  <div key={time} className="flex min-h-[60px]">
                    <div className="w-24 p-3 text-xs text-gray-500 border-r border-gray-200 flex-shrink-0">
                      {time}
                    </div>
                    <div className="flex-1 p-2">
                      {slotItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                              {item.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.platform}
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-700 mt-1 truncate">
                            {item.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ScheduleCard({ item }: { item: ScheduledItem }) {
  const statusConfig: Record<
    string,
    { icon: typeof CheckCircle; color: string; bgColor: string }
  > = {
    scheduled: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
    published: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    failed: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-100" },
    draft: { icon: Edit2, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  };

  const config = statusConfig[item.status];
  const StatusIcon = config.icon;

  const platformColors: Record<string, string> = {
    Instagram: "bg-pink-100 text-pink-700",
    LinkedIn: "bg-blue-100 text-blue-700",
    Twitter: "bg-sky-100 text-sky-700",
    Facebook: "bg-indigo-100 text-indigo-700",
    TikTok: "bg-gray-100 text-gray-700",
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm text-gray-900">{item.title}</h3>
            <Badge
              className={`${platformColors[item.platform] || "bg-gray-100 text-gray-700"} border-0 text-xs`}
            >
              {item.platform}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {item.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mb-2 truncate">{item.content}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.scheduledTime}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.scheduledDate}
            </span>
            <span>By {item.author}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="sm" variant="ghost" title="Edit">
            <Edit2 className="w-4 h-4 text-gray-500" />
          </Button>
          <Button size="sm" variant="ghost" title="Delete">
            <Trash2 className="w-4 h-4 text-gray-500" />
          </Button>
          <Button size="sm" variant="ghost" title="More options">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
