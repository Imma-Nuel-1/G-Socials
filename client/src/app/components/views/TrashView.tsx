// ============================================
// TRASH VIEW - Deleted Items Manager
// ============================================

import { useState, useEffect } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import apiClient from "@/api/client";

// ============================================
// TYPES
// ============================================

interface TrashedItem {
  id: number;
  name: string;
  type: "post" | "template" | "campaign" | "image";
  platform?: string;
  deletedAt: string;
  deletedBy: string;
  expiresIn: number; // days until permanent deletion
  preview?: string;
}

// ============================================
// COMPONENT
// ============================================

export function TrashView() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrash = async () => {
      try {
        const res = await apiClient.get('/posts?deleted=true');
        const posts = res.data?.data ?? res.data ?? [];
        const mapped: TrashedItem[] = (Array.isArray(posts) ? posts : []).map((p: any) => ({
          id: p.id,
          name: p.content?.substring(0, 40) ?? 'Untitled',
          type: 'post' as const,
          platform: p.platform,
          deletedAt: p.deletedAt ? new Date(p.deletedAt).toISOString().split('T')[0] : '',
          deletedBy: p.createdBy?.name ?? 'Unknown',
          expiresIn: p.deletedAt ? Math.max(0, 30 - Math.floor((Date.now() - new Date(p.deletedAt).getTime()) / 86400000)) : 0,
          preview: p.content,
        }));
        setTrashedItems(mapped);
      } catch (err) {
        console.error('Failed to fetch trash:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrash();
  }, []);

  const filteredItems = trashedItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((i) => i.id));
    }
  };

  const restoreItems = async (ids: number[]) => {
    try {
      await Promise.all(ids.map(id => apiClient.post(`/posts/${id}/restore`)));
      setTrashedItems((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to restore items:', err);
    }
  };

  const permanentlyDelete = async (ids: number[]) => {
    try {
      await Promise.all(ids.map(id => apiClient.delete(`/posts/${id}/permanent`)));
      setTrashedItems((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedItems([]);
    } catch (err) {
      console.error('Failed to delete items:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return FileText;
      case "template":
        return ImageIcon;
      case "campaign":
        return Calendar;
      default:
        return ImageIcon;
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "post":
        return "bg-blue-100 text-blue-700";
      case "template":
        return "bg-purple-100 text-purple-700";
      case "campaign":
        return "bg-green-100 text-green-700";
      case "image":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-gray-500" />
              Trash
            </h1>
            <p className="text-sm text-gray-600">
              Items are permanently deleted after 30 days
            </p>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedItems.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => restoreItems(selectedItems)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => permanentlyDelete(selectedItems)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="p-6">
        {/* Warning Banner */}
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Deleted items will be permanently removed after 30 days. Restore
            items before they expire to keep them.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Items List */}
        <Card className="overflow-hidden">
          {/* Select All Header */}
          <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200">
            <button onClick={toggleSelectAll} className="hover:opacity-80">
              {selectedItems.length === filteredItems.length &&
              filteredItems.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}{" "}
              in trash
            </span>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => {
              const Icon = getTypeIcon(item.type);
              const isSelected = selectedItems.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="hover:opacity-80"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {item.name}
                      </span>
                      <Badge
                        className={`${getTypeBadgeStyle(item.type)} border-0 text-xs`}
                      >
                        {item.type}
                      </Badge>
                      {item.platform && (
                        <Badge variant="outline" className="text-xs">
                          {item.platform}
                        </Badge>
                      )}
                    </div>
                    {item.preview && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.preview}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Deleted by {item.deletedBy} on {item.deletedAt}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-xs font-medium ${
                        item.expiresIn <= 7 ? "text-red-600" : "text-gray-500"
                      }`}
                    >
                      {item.expiresIn} days left
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Restore"
                      onClick={() => restoreItems([item.id])}
                    >
                      <RotateCcw className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button size="sm" variant="ghost" title="More options">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Trash is empty</h3>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "No deleted items match your search."
                  : "Items you delete will appear here."}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
