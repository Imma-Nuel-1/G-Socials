// ============================================
// CONSTANTS - PLATFORMS
// ============================================

import { PlatformConfig, PlatformId } from '@/types';

export const PLATFORMS: PlatformConfig[] = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    description: 'Professional networking',
    icon: '💼',
    color: '#0A66C2'
  },
  { 
    id: 'twitter', 
    name: 'Twitter', 
    description: 'Short-form content',
    icon: '🐦',
    color: '#1DA1F2'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    description: 'Visual storytelling',
    icon: '📷',
    color: '#E4405F'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    description: 'Community engagement',
    icon: '📘',
    color: '#1877F2'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    description: 'Short video content',
    icon: '🎵',
    color: '#000000'
  },
];

export const PLATFORM_OPTIONS = PLATFORMS.map(p => ({
  id: p.id,
  name: p.name,
  icon: p.icon,
  color: `bg-${p.id === 'instagram' ? 'pink' : 'blue'}-50 border-${p.id === 'instagram' ? 'pink' : 'blue'}-200`,
}));

export const getPlatformById = (id: PlatformId): PlatformConfig | undefined => {
  return PLATFORMS.find(p => p.id === id);
};

export const getPlatformName = (id: PlatformId): string => {
  return getPlatformById(id)?.name || id;
};
