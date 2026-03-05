// ============================================
// TEAM VIEW - Messaging Component
// ============================================

import {
  Search,
  Clock,
  Calendar,
  Phone,
  Video,
  MoreVertical,
  Send,
  Mic,
  Paperclip,
  Smile,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from '../layout/NotificationBell';
import { CreatePostButton } from '../layout/CreatePostButton';

// ============================================
// COMPONENT
// ============================================

export function TeamView() {
  return (
    <div className="h-full bg-gray-50 flex">
      {/* Left Sidebar - Conversations List */}
      <ConversationsSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header />
        <ChatHeader />
        <MessagesArea />
        <MessageInput />
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ConversationsSidebar() {
  return (
    <aside className="w-[320px] bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Messaging
            <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
              0
            </span>
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search in dashboards..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {[].map((conv: any) => (
            <div
              key={conv.id}
              className={`flex items-start gap-3 p-3 rounded-lg mb-1 cursor-pointer ${
                conv.id === "1"
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{conv.name}</span>
                  <span className="text-xs text-gray-500">{conv.time}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{conv.message}</p>
                {conv.unread && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                )}
              </div>
              {conv.badge && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                  {conv.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

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

function ChatHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
          ?
        </div>
        <div>
          <h3 className="font-semibold">Select a conversation</h3>
          <p className="text-xs text-gray-500">No conversation selected</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost">
          <Phone className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost">
          <Video className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function MessagesArea() {
  return (
    <ScrollArea className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {[].map((msg: any) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[70%] ${msg.isOwn ? "order-1" : "order-2"}`}>
              {msg.message && (
                <div
                  className={`rounded-2xl px-4 py-2 mb-1 ${
                    msg.isOwn
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  {msg.isOwn && msg.time && (
                    <span className="text-xs text-blue-100 mt-1 block">
                      {msg.time}
                    </span>
                  )}
                </div>
              )}

              {msg.images && msg.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {msg.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Shared"
                      className="rounded-lg w-full h-32 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function MessageInput() {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-3 border border-gray-200">
          <Button size="sm" variant="ghost" className="rounded-full">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          <input
            type="text"
            placeholder="Type your message"
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          <Button size="sm" variant="ghost" className="rounded-full">
            <Smile className="w-5 h-5 text-gray-500" />
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full">
            <Mic className="w-5 h-5 text-gray-500" />
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 text-white rounded-full px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
