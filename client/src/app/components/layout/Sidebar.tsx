// ============================================
// SIDEBAR - Navigation Component
// ============================================

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Target,
  Calendar,
  BarChart2,
  Users,
  Sparkles,
  FileText,
  Trash2,
  Settings,
  HelpCircle,
  Clock,
  Megaphone,
  LogOut,
} from "lucide-react";
import { MENU_ITEMS } from "@/constants";

// Icon mapping
const iconMap: Record<string, any> = {
  Target,
  Calendar,
  BarChart2,
  Users,
  Sparkles,
  FileText,
  Trash2,
  Settings,
  HelpCircle,
  Clock,
  Megaphone,
};

// ============================================
// COMPONENT
// ============================================

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Derive active view from current URL path
  const currentPath = location.pathname.replace(/^\//, "") || "overview";

  return (
    <aside className="w-[200px] bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6">
        <h1 className="font-semibold text-gray-900">Social Hub</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3" aria-label="Main navigation">
        {MENU_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = currentPath === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
