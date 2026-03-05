// ============================================
// CONTENT CALENDAR VIEW
// ============================================

import { Search, Clock, Calendar, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '../layout/NotificationBell';
import { CreatePostButton } from '../layout/CreatePostButton';

interface CalendarPost {
  day: number;
  hour: number;
  color: string;
  duration: number;
  time: string;
  title: string;
  subtitle: string;
}

// ============================================
// CONSTANTS
// ============================================

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'EST'];
const DATES = [21, 22, 23, 24, 25, 26, 27, 'GMT-5'];
const HOURS = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

// ============================================
// COMPONENT
// ============================================

export function ContentCalendarView() {
  return (
    <div className="h-full bg-gray-50 flex">
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Header />
        <CalendarGrid />
      </div>

      {/* Right Sidebar - Upcoming Posts */}
      <RightSidebar />
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates"
              className="w-[400px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <Clock className="w-4 h-4" />
            08:00
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <Calendar className="w-4 h-4" />
            21 June 2025
          </button>
          <NotificationBell />
          <CreatePostButton />
        </div>
      </div>
    </header>
  );
}

function CalendarGrid() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="font-medium">Best times to post</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Day</Button>
            <Button size="sm" className="bg-blue-600 text-white">Week</Button>
            <Button variant="outline" size="sm">Month</Button>
            <Button variant="outline" size="sm">Year</Button>
            <button className="ml-2 p-2 hover:bg-gray-100 rounded">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          {/* Days Header */}
          <div className="grid grid-cols-[80px,repeat(8,minmax(120px,1fr))] border-b border-gray-200 bg-gray-50">
            <div className="p-3"></div>
            {DATES.map((date, i) => (
              <div key={i} className="p-3 text-center border-l border-gray-200">
                <div className="text-xs text-gray-500 mb-1">{WEEK_DAYS[i]}</div>
                <div className={`text-sm ${i === 0 ? 'w-7 h-7 bg-blue-600 text-white rounded-full mx-auto flex items-center justify-center' : ''}`}>
                  {date}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {HOURS.map((hour, hourIndex) => (
              <div key={hourIndex} className="grid grid-cols-[80px,repeat(8,minmax(120px,1fr))] border-b border-gray-200 min-h-[70px]">
                <div className="p-2 text-xs text-gray-500 border-r border-gray-200">{hour}</div>
                {Array.from({ length: 8 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="border-l border-gray-200 relative p-1">
                    {([] as CalendarPost[])
                      .filter(post => post.day === dayIndex && post.hour === hourIndex)
                      .map((post, postIndex) => (
                        <div
                          key={postIndex}
                          className={`rounded px-2 py-1.5 text-xs border cursor-pointer hover:shadow-md transition-shadow ${post.color}`}
                          style={{
                            height: post.duration > 1 ? `${post.duration * 70 - 8}px` : 'auto',
                          }}
                        >
                          <div className="font-medium">{post.time}</div>
                          {post.title && (
                            <>
                              <div className="font-medium mt-0.5">{post.title}</div>
                              <div className="text-xs opacity-75">{post.subtitle}</div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RightSidebar() {
  return (
    <aside className="w-[280px] bg-white border-l border-gray-200 overflow-auto p-4">
      <h3 className="font-semibold mb-4">Upcoming</h3>
      
      <div className="space-y-3">
        {[].map((post: any) => (
          <Card key={post.id} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                {post.platform}
              </span>
            </div>
            
            <img
              src={post.image}
              alt="Post preview"
              className="w-full rounded mb-2"
            />
            
            {post.content && (
              <p className="text-xs text-gray-600">{post.content}</p>
            )}
          </Card>
        ))}
      </div>
    </aside>
  );
}
