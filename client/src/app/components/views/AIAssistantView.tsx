// ============================================
// AI ASSISTANT VIEW
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Calendar, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { PLATFORMS, TONES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { aiService, postService } from '@/services';
import { NotificationBell } from '../layout/NotificationBell';
import { CreatePostButton } from '../layout/CreatePostButton';
import type { Platform, Tone } from '@/types';

// ============================================
// COMPONENT
// ============================================

export function AIAssistantView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('linkedin');
  const [selectedTone, setSelectedTone] = useState<Tone>('professional');
  const [postDescription, setPostDescription] = useState('');
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!postDescription.trim()) return;
    setIsGenerating(true);
    try {
      const result = await aiService.generateContent({
        description: postDescription,
        platform: selectedPlatform,
        tone: selectedTone,
      });
      if (result.success && result.data) {
        setGeneratedPosts([{
          id: '1',
          author: user?.name || 'You',
          platform: selectedPlatform,
          content: result.data.content,
          hashtags: result.data.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' '),
        }]);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSchedulePost = async () => {
    if (generatedPosts.length === 0) return;
    const post = generatedPosts[0];
    try {
      await postService.createPost({
        content: post.content,
        platform: selectedPlatform,
        tone: selectedTone,
      });
      navigate('/scheduler');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <Header />

      {/* Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-1">AI Assistant</h2>
            <p className="text-sm text-gray-600">Let AI help you create amazing content and designs</p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="create">Create Post</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="grid grid-cols-[400px,1fr] gap-6">
                {/* Left Panel - AI Options */}
                <AIOptionsPanel
                  selectedPlatform={selectedPlatform}
                  setSelectedPlatform={setSelectedPlatform}
                  selectedTone={selectedTone}
                  setSelectedTone={setSelectedTone}
                  postDescription={postDescription}
                  setPostDescription={setPostDescription}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />

                {/* Right Panel - Post Preview */}
                <PostPreviewPanel posts={generatedPosts} onSchedule={handleSchedulePost} />
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="text-center py-12 text-gray-500">
                Template library coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
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

interface AIOptionsPanelProps {
  selectedPlatform: Platform;
  setSelectedPlatform: (platform: Platform) => void;
  selectedTone: Tone;
  setSelectedTone: (tone: Tone) => void;
  postDescription: string;
  setPostDescription: (description: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function AIOptionsPanel({
  selectedPlatform,
  setSelectedPlatform,
  selectedTone,
  setSelectedTone,
  postDescription,
  setPostDescription,
  onGenerate,
  isGenerating,
}: AIOptionsPanelProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-medium mb-4">AI suggestion</h3>
        
        <div className="mb-4">
          <Label className="mb-3 block text-sm text-gray-700">Describe Your Post Idea</Label>
          <Textarea
            placeholder="Creative linkedin post about grey jean white and blue"
            className="min-h-[80px] text-sm"
            value={postDescription}
            onChange={(e) => setPostDescription(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Nike airforce and blue sweater, blue cap
          </p>
        </div>

        <div className="mb-6">
          <Label className="mb-3 block text-sm text-gray-700">Platform</Label>
          <RadioGroup 
            value={selectedPlatform} 
            onValueChange={(value) => setSelectedPlatform(value as Platform)}
          >
            <div className="space-y-2">
              {PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    selectedPlatform === platform.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem value={platform.id} id={platform.id} />
                  <Label htmlFor={platform.id} className="flex-1 cursor-pointer">
                    <div className="font-medium text-sm">{platform.name}</div>
                    <div className="text-xs text-gray-500">{platform.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="mb-6">
          <Label className="mb-3 block text-sm text-gray-700">Tone</Label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id as Tone)}
                className={`p-3 rounded-lg border text-left ${
                  selectedTone === tone.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{tone.name}</div>
                <div className="text-xs text-gray-500">{tone.description}</div>
              </button>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onGenerate}
          disabled={isGenerating || !postDescription.trim()}
        >
          {isGenerating ? 'Generating...' : 'Generate post content'}
        </Button>
      </div>
    </div>
  );
}

interface PostPreviewPanelProps {
  posts: any[];
  onSchedule?: () => void;
}

function PostPreviewPanel({ posts, onSchedule }: PostPreviewPanelProps) {
  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      twitter: 'Twitter',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    };
    return labels[platform] || platform;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">Best times to post</span>
        </div>
        <select className="text-sm border border-gray-300 rounded px-3 py-1.5">
          <option>Last 30 days</option>
        </select>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="font-medium text-sm">{post.author}</div>
                {post.role && <div className="text-xs text-gray-500">{post.role}</div>}
                {post.views && <div className="text-xs text-gray-500">{post.views} •</div>}
              </div>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {getPlatformLabel(post.platform)}
              </span>
            </div>
            
            {post.content && (
              <p className="text-sm mb-3">{post.content}</p>
            )}
            
            {post.hashtags && (
              <p className="text-sm text-blue-600 mb-3">{post.hashtags}</p>
            )}
            
            {post.image && (
              <img
                src={post.image}
                alt="Post"
                className="w-full rounded-lg mb-3"
              />
            )}
            
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {post.likes && <span>❤️ {post.likes}</span>}
              {post.comments && <span>💬 {post.comments} comments</span>}
            </div>
          </div>
        ))}
      </div>

      <Button
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
        onClick={onSchedule}
        disabled={posts.length === 0}
      >
        Schedule Post
      </Button>

      <div className="mt-6">
        <h4 className="text-sm font-medium mb-3">More in this series</h4>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
