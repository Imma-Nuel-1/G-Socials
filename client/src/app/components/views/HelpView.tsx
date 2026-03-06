// ============================================
// HELP CENTER VIEW - FAQ & Support
// ============================================

import {
  Search,
  Book,
  MessageCircle,
  Video,
  FileText,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { useState } from "react";

// ============================================
// TYPES
// ============================================

interface HelpCategory {
  id: string;
  title: string;
  icon: any;
  description: string;
  articles: number;
}

interface FAQ {
  question: string;
  answer: string;
}

// ============================================
// DATA
// ============================================

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Book,
    description: "Learn the basics of Social Hub",
    articles: 12,
  },
  {
    id: "content-creation",
    title: "Content Creation",
    icon: FileText,
    description: "Create and schedule posts",
    articles: 18,
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    icon: Video,
    description: "Track your performance",
    articles: 10,
  },
  {
    id: "team-collaboration",
    title: "Team Collaboration",
    icon: MessageCircle,
    description: "Work together effectively",
    articles: 8,
  },
];

const FAQS: FAQ[] = [
  {
    question: "How do I connect my social media accounts?",
    answer:
      'Go to Settings > Connected Accounts and click "Add Account". Select your platform and follow the authentication process. You can connect multiple accounts from the same platform.',
  },
  {
    question: "Can I schedule posts to multiple platforms at once?",
    answer:
      "Yes! When creating a post, simply select multiple platforms from the platform selector. The post will be optimized for each platform automatically.",
  },
  {
    question: "How does the AI Assistant work?",
    answer:
      "Our AI Assistant uses advanced language models to help you generate content ideas, write captions, suggest hashtags, and even create images. Simply describe what you need and let AI do the rest.",
  },
  {
    question: "What analytics metrics can I track?",
    answer:
      "You can track engagement rates, reach, impressions, follower growth, click-through rates, and more. All metrics are available in real-time on the Analytics dashboard.",
  },
  {
    question: "How do I invite team members?",
    answer:
      "Navigate to Team > Invite Members. Enter their email addresses and assign roles (Admin, Editor, or Viewer). They will receive an invitation email to join your workspace.",
  },
  {
    question: "Is there a mobile app available?",
    answer:
      "Yes! Social Hub is available on iOS and Android. Download from the App Store or Google Play Store. All features are synced across devices.",
  },
  {
    question: "How do I cancel or reschedule a post?",
    answer:
      "Go to Content Calendar, find your scheduled post, and click the three dots menu. You can edit, reschedule, or delete the post from there.",
  },
  {
    question: "What file formats are supported for uploads?",
    answer:
      "We support JPG, PNG, GIF, MP4, and MOV files. Maximum file size is 100MB for images and 500MB for videos.",
  },
];

// ============================================
// COMPONENT
// ============================================

export function HelpView() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-blue-100 mb-6">
            Search our knowledge base or browse categories below
          </p>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for help articles, FAQs..."
              className="pl-10 py-6 text-lg bg-white border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HELP_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  key={category.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {category.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {category.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.articles} articles
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <Card className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium text-gray-900">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No FAQs found matching your search.
              </div>
            )}
          </Card>
        </section>

        {/* Contact Support */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Still Need Help?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 bg-green-100 rounded-full mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-4">
                Chat with our support team
              </p>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 bg-blue-100 rounded-full mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Email Support
              </h3>
              <p className="text-sm text-gray-600 mb-4">Get help via email</p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex p-3 bg-purple-100 rounded-full mb-4">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Documentation
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                View full documentation
              </p>
              <Button variant="outline" className="w-full">
                View Docs
              </Button>
            </Card>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="#"
              className="text-blue-600 hover:underline text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Video Tutorials
            </a>
            <a
              href="#"
              className="text-blue-600 hover:underline text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              API Documentation
            </a>
            <a
              href="#"
              className="text-blue-600 hover:underline text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Community Forum
            </a>
            <a
              href="#"
              className="text-blue-600 hover:underline text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Feature Requests
            </a>
          </div>

          {/* Legal */}
          <div className="mt-6 pt-4 border-t border-blue-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Legal</p>
            <div className="flex flex-wrap gap-4">
              <a href="/privacy" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Privacy Policy
              </a>
              <a href="/terms" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Terms of Service
              </a>
              <a href="/data-deletion" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Data Deletion
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
