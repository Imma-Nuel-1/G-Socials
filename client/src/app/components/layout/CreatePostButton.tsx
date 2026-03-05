// ============================================
// CREATE POST BUTTON — Shared header component
// ============================================

import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';

export function CreatePostButton() {
  const navigate = useNavigate();

  return (
    <Button
      className="bg-blue-600 hover:bg-blue-700 text-white"
      onClick={() => navigate('/ai-assistant')}
    >
      <Plus className="w-4 h-4 mr-2" />
      Create Post
    </Button>
  );
}
