import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  StickyNote, 
  Sparkles, 
  CheckCircle, 
  Star,
  Zap,
  Heart,
  Target
} from 'lucide-react';

const NotesFeatureDemo = () => {
  const features = [
    {
      icon: StickyNote,
      title: 'Always Accessible',
      description: 'Fixed button at center-right of screen, available on all dashboards',
      color: 'purple'
    },
    {
      icon: Sparkles,
      title: '10 Color Themes',
      description: 'Beautiful color schemes to organize and visualize your notes',
      color: 'yellow'
    },
    {
      icon: CheckCircle,
      title: '10 Smart Categories',
      description: 'Pre-built categories plus unlimited custom categories',
      color: 'green'
    },
    {
      icon: Star,
      title: 'Pin & Star System',
      description: 'Keep important notes at the top and mark favorites',
      color: 'blue'
    },
    {
      icon: Zap,
      title: 'Advanced Filtering',
      description: 'Search, filter by category, tags, priority, and more',
      color: 'orange'
    },
    {
      icon: Heart,
      title: 'Export & Import',
      description: 'Backup your notes and import from JSON files',
      color: 'pink'
    },
    {
      icon: Target,
      title: 'Priority System',
      description: 'Organize notes by High, Medium, or Low priority',
      color: 'red'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <StickyNote className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Personal Notes Feature</h1>
              <p className="text-purple-100 text-lg">
                Your personal space for ideas, thoughts, and organization
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-lg leading-relaxed">
              📍 <strong>Look to your right!</strong> The Notes button is pinned to the center-right 
              of your screen. Click it to open your personal notes sidebar with full-featured 
              note-taking capabilities, smart organization, and powerful search.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-${feature.color}-100 text-${feature.color}-600 mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* How to Use */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-purple-600" />
            How to Use
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Access the Notes</h3>
                <p className="text-gray-600">
                  Click the purple Notes button on the right side of your screen (it's always visible!)
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Create Your First Note</h3>
                <p className="text-gray-600">
                  Click "New Note" button, add a title, content, category, tags, and choose a color
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Organize & Find</h3>
                <p className="text-gray-600">
                  Use categories, tags, pins, stars, and the search bar to keep everything organized
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Backup Your Notes</h3>
                <p className="text-gray-600">
                  Use Export to backup your notes as JSON, and Import to restore them
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Preview */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Default Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Ideas', emoji: '💡', color: 'yellow' },
              { name: 'Tasks', emoji: '✓', color: 'blue' },
              { name: 'Goals', emoji: '🎯', color: 'green' },
              { name: 'Meetings', emoji: '📅', color: 'purple' },
              { name: 'Quick Notes', emoji: '⚡', color: 'orange' },
              { name: 'Learning', emoji: '📚', color: 'indigo' },
              { name: 'Projects', emoji: '💼', color: 'red' },
              { name: 'Personal', emoji: '❤️', color: 'pink' },
              { name: 'Feedback', emoji: '💬', color: 'teal' },
              { name: 'Code', emoji: '💻', color: 'gray' }
            ].map((cat, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-xl bg-${cat.color}-50 border-2 border-${cat.color}-200`}
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <div className={`text-sm font-semibold text-${cat.color}-900`}>{cat.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Feature Set</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              '✓ Real-time search across title, content, and tags',
              '✓ Pin important notes to keep them at the top',
              '✓ Star your favorite notes for quick access',
              '✓ Archive old notes to keep workspace clean',
              '✓ 10 beautiful color themes for visual organization',
              '✓ Unlimited custom categories with color coding',
              '✓ Flexible tag system for multi-dimensional organization',
              '✓ Priority levels (High, Medium, Low)',
              '✓ Sort by date, title, or priority',
              '✓ Filter by category, tags, pinned, or starred',
              '✓ Export/Import for data backup and migration',
              '✓ Duplicate notes for quick templating',
              '✓ Automatic timestamps (created & updated)',
              '✓ Private & secure (localStorage based)',
              '✓ No server required - works offline',
              '✓ Responsive design for all devices'
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl text-purple-100 mb-6">
            Click the Notes button on the right side of your screen to get started!
          </p>
          <div className="flex items-center justify-center gap-2 text-lg">
            <span>Look here</span>
            <span className="text-3xl">👉</span>
            <span className="font-bold text-yellow-300 animate-pulse">Notes Button</span>
          </div>
        </div>

        {/* Documentation Links */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Documentation</h2>
          <p className="text-gray-600 mb-4">
            For detailed documentation and guides, check these files in the project root:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-gray-700">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <code className="bg-gray-100 px-3 py-1 rounded">PERSONAL_NOTES_DOCUMENTATION.md</code>
              <span className="text-gray-500">- Complete feature documentation</span>
            </li>
            <li className="flex items-center gap-3 text-gray-700">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <code className="bg-gray-100 px-3 py-1 rounded">NOTES_QUICK_REFERENCE.md</code>
              <span className="text-gray-500">- Quick reference guide</span>
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotesFeatureDemo;
