import { Suspense } from 'react';
import { getNowPageData, NowSection } from '@/lib/notion/now';
import { NotionRenderer } from '@/components/notion';
import { formatRelativeTime } from '@/lib/utils';
import { 
  Rocket, 
  BookOpen, 
  Target, 
  Music,
  RefreshCw
} from 'lucide-react';

// ISR with 5-minute revalidation
export const revalidate = 300;

// Section icons
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'working-on': <Rocket className="w-5 h-5" />,
  'learning': <BookOpen className="w-5 h-5" />,
  'goals': <Target className="w-5 h-5" />,
  'vibe': <Music className="w-5 h-5" />,
};

const SECTION_COLORS: Record<string, string> = {
  'working-on': 'from-blue-500 to-blue-600',
  'learning': 'from-green-500 to-green-600',
  'goals': 'from-purple-500 to-purple-600',
  'vibe': 'from-pink-500 to-pink-600',
};

export default async function NowPage() {
  const { sections, lastUpdated } = await getNowPageData();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What I&apos;m Doing Now
          </h1>
          <p className="text-zinc-400 text-lg mb-4">
            A living document of my current focus, inspired by{' '}
            <a 
              href="https://nownownow.com/about" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              nownownow.com
            </a>
          </p>
          
          {/* Last updated */}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <RefreshCw size={14} />
            <span>Last updated {formatRelativeTime(new Date(lastUpdated))}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {sections.length > 0 ? (
          <div className="space-y-12">
            {sections.map((section) => (
              <NowSectionCard key={section.id} section={section} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Footer note */}
      <footer className="border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-zinc-500 text-sm">
            This page is automatically synced with my Notion workspace. 
            Updates appear within 5 minutes of being published.
          </p>
        </div>
      </footer>
    </main>
  );
}

function NowSectionCard({ section }: { section: NowSection }) {
  const icon = SECTION_ICONS[section.type] || <Rocket className="w-5 h-5" />;
  const gradient = SECTION_COLORS[section.type] || 'from-zinc-500 to-zinc-600';

  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-white">
          {section.title || formatSectionType(section.type)}
        </h2>
      </div>

      {/* Section content */}
      <div className="pl-12">
        {section.content && (
          <p className="text-zinc-300 mb-4">{section.content}</p>
        )}
        
        {section.blocks && section.blocks.length > 0 && (
          <Suspense fallback={<div className="animate-pulse h-20 bg-zinc-800 rounded" />}>
            <NotionRenderer blocks={section.blocks} />
          </Suspense>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
        <Rocket className="w-8 h-8 text-zinc-500" />
      </div>
      <h2 className="text-xl font-semibold text-zinc-300 mb-2">
        Nothing here yet
      </h2>
      <p className="text-zinc-500 max-w-md mx-auto">
        This page will be populated once the Notion integration is configured.
        Add items to your Now database to see them appear here.
      </p>
    </div>
  );
}

function formatSectionType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
