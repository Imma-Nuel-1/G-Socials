// ============================================
// CONSTANTS - TONES
// ============================================

import { ToneConfig, ToneId } from '@/types';

export const TONES: ToneConfig[] = [
  { 
    id: 'professional', 
    name: 'Professional', 
    description: 'Formal business' 
  },
  { 
    id: 'casual', 
    name: 'Casual', 
    description: 'Friendly and relaxed' 
  },
  { 
    id: 'humorous', 
    name: 'Humorous', 
    description: 'Cheerful and funny' 
  },
  { 
    id: 'inspirational', 
    name: 'Inspirational', 
    description: 'Motivating and uplifting' 
  },
];

export const getToneById = (id: ToneId): ToneConfig | undefined => {
  return TONES.find(t => t.id === id);
};
