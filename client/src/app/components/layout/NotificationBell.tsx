// ============================================
// NOTIFICATION BELL — Shared header component
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative p-2 hover:bg-gray-100 rounded-lg"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
          </div>
          <div className="py-8 text-center text-sm text-gray-500">
            No new notifications
          </div>
        </div>
      )}
    </div>
  );
}
