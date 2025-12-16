import Link from 'next/link';
import { Github, Star, GitBranch, Clock } from 'lucide-react';
import { RepoMeta } from '@/lib/github';
import { cn } from '@/lib/utils';

export function RepoCard({ githubUrl, repo }: { githubUrl: string; repo?: RepoMeta }) {
  return (
    <div className="mt-8 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-lg bg-zinc-800/30 flex items-center justify-center">
          <Github className="w-6 h-6 text-zinc-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate">
              <div className="text-sm text-zinc-400">Repository</div>
              <h4 className="font-semibold text-white truncate">{repo?.name ?? githubUrl}</h4>
            </div>
            <div className="text-sm text-zinc-400">{repo?.language}</div>
          </div>

          {repo?.description && (
            <p className="text-sm text-zinc-300 mt-2 truncate">{repo.description}</p>
          )}

          {repo?.readmeSnippet && (
            <p className="text-xs text-zinc-500 mt-3 line-clamp-3">{repo.readmeSnippet}</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-zinc-400 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> {repo?.stars ?? '-'}
            </span>
            <span className="text-sm text-zinc-400 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-zinc-400" /> {repo?.forks ?? '-'}
            </span>
            {repo?.updatedAt && (
              <span className="text-sm text-zinc-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" /> {new Date(repo.updatedAt).toLocaleDateString()}
              </span>
            )}
            <Link href={githubUrl} target="_blank" rel="noopener noreferrer" className={cn('ml-auto text-cyan-400 hover:text-cyan-300')}>
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
