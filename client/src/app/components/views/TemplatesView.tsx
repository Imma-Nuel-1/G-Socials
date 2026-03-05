// ============================================
// TEMPLATES VIEW - Template Editor Component
// ============================================

import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Calendar,
  Bell,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/api/client";
import type { Layer } from "@/types";

// ============================================
// COMPONENT
// ============================================

export function TemplatesView() {
  const [selectedLayer, setSelectedLayer] = useState("3");
  const [layerList, setLayerList] = useState<Layer[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get('/templates');
        const templates = res.data?.data ?? res.data ?? [];
        if (Array.isArray(templates) && templates.length > 0 && templates[0].layers) {
          setLayerList(templates[0].layers);
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const toggleLayerVisibility = (id: string) => {
    setLayerList(
      layerList.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  const toggleLayerLock = (id: string) => {
    setLayerList(
      layerList.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer,
      ),
    );
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case "text":
        return Type;
      case "image":
        return ImageIcon;
      case "rectangle":
        return Square;
      case "circle":
        return Circle;
      default:
        return Square;
    }
  };

  return (
    <div className="h-full bg-gray-50 flex">
      {/* Left Sidebar - Layers Panel */}
      <LayersSidebar
        layers={layerList}
        selectedLayer={selectedLayer}
        setSelectedLayer={setSelectedLayer}
        toggleLayerVisibility={toggleLayerVisibility}
        toggleLayerLock={toggleLayerLock}
        getLayerIcon={getLayerIcon}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Header />
        <CanvasArea layers={layerList} />
      </div>

      {/* Right Sidebar - Properties */}
      <PropertiesPanel selectedLayer={selectedLayer} layers={layerList} />
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface LayersSidebarProps {
  layers: Layer[];
  selectedLayer: string;
  setSelectedLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  getLayerIcon: (type: string) => any;
}

function LayersSidebar({
  layers,
  selectedLayer,
  setSelectedLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  getLayerIcon,
}: LayersSidebarProps) {
  return (
    <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold mb-3">Layers</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Square className="w-3 h-3 mr-1" />
            Shape
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Type className="w-3 h-3 mr-1" />
            Text
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {layers.map((layer) => {
            const Icon = getLayerIcon(layer.type);
            return (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-2 rounded mb-1 cursor-pointer ${
                  selectedLayer === layer.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedLayer(layer.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3 text-gray-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  )}
                </button>
                <Icon className="w-4 h-4 text-gray-600" />
                <span className="flex-1 text-sm">{layer.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerLock(layer.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {layer.locked && <Lock className="w-3 h-3 text-gray-600" />}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1">
          <Button size="sm" variant="ghost" title="Duplicate">
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Move Up">
            <MoveUp className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Move Down">
            <MoveDown className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
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
            {user?.name?.charAt(0).toUpperCase() || "U"}
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
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>
    </header>
  );
}

interface CanvasAreaProps {
  layers: Layer[];
}

function CanvasArea({ layers }: CanvasAreaProps) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-gray-900 mb-1">Template Editor</h2>
        <p className="text-sm text-gray-600">
          Design and customize your social media posts
        </p>
      </div>

      <div className="bg-white rounded-lg p-8 shadow-sm mb-6">
        {/* Canvas */}
        <div className="max-w-[600px] mx-auto">
          <div className="aspect-square bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg relative overflow-hidden">
            {/* Shoe Image Layer */}
            {layers.find((l) => l.id === "3")?.visible && (
              <img
                src="https://images.unsplash.com/photo-1687586370460-ace8afa5cb07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc25lYWtlcnMlMjBzaG9lc3xlbnwxfHx8fDE3NjcwMTI4NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Sneaker"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Text Layers */}
            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-white text-center">
              {layers.find((l) => l.id === "4")?.visible && (
                <h1 className="font-bold text-4xl mb-4">
                  Street Style Simplicity
                </h1>
              )}

              {layers.find((l) => l.id === "5")?.visible && (
                <p className="text-lg mb-6">Clean. Confident. Classic.</p>
              )}

              {layers.find((l) => l.id === "6")?.visible && (
                <p className="text-sm opacity-90">
                  #StreetStyle #NikeAirForce #SneakerHead
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Library */}
      <div>
        <h3 className="font-semibold mb-4">Template Library</h3>
        <div className="grid grid-cols-4 gap-4">
          {[].map((template: any) => (
            <div
              key={template.id}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
            >
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {template.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PropertiesPanelProps {
  selectedLayer: string;
  layers: Layer[];
}

function PropertiesPanel({ selectedLayer, layers }: PropertiesPanelProps) {
  const currentLayer = layers.find((l) => l.id === selectedLayer);

  return (
    <aside className="w-[280px] bg-white border-l border-gray-200 p-4">
      <h3 className="font-semibold mb-4">Properties</h3>

      {selectedLayer && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">X</label>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  defaultValue="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Size</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Width</label>
                <input
                  type="number"
                  defaultValue="600"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Height</label>
                <input
                  type="number"
                  defaultValue="600"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Opacity</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="100"
              className="w-full"
            />
          </div>

          {currentLayer?.type === "text" && (
            <>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Font Size
                </label>
                <input
                  type="number"
                  defaultValue="16"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Color
                </label>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
