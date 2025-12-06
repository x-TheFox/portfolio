'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Loader2, CheckCircle, XCircle, Clock, Cloud, Database, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncLog {
  id: string;
  action: string;
  source: string;
  status: string;
  details: Record<string, unknown> | null;
  timestamp: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  synced: {
    projects: number;
    skills: number;
    certificates: number;
    now: number;
  };
}

export default function SyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/cms/sync');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage(null);
    setLastResult(null);

    try {
      const response = await fetch('/api/cms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setLastResult(data);
        setMessage({ type: 'success', text: 'Sync completed successfully!' });
        fetchLogs(); // Refresh logs
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred during sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'notion':
        return <Cloud className="w-4 h-4 text-blue-400" />;
      case 'local':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'webhook':
        return <RefreshCw className="w-4 h-4 text-green-400" />;
      default:
        return <Database className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notion Sync</h1>
          <p className="text-zinc-500 mt-1">Sync content from Notion databases</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors',
            isSyncing
              ? 'bg-zinc-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Last Sync Result */}
      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Sync Results
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{lastResult.synced.projects}</div>
              <div className="text-sm text-zinc-500">Projects</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{lastResult.synced.skills}</div>
              <div className="text-sm text-zinc-500">Skills</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{lastResult.synced.certificates}</div>
              <div className="text-sm text-zinc-500">Certificates</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{lastResult.synced.now}</div>
              <div className="text-sm text-zinc-500">In Progress</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sync Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Sync Works</h3>
        <div className="space-y-4 text-sm text-zinc-400">
          <div className="flex items-start gap-3">
            <Cloud className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <strong className="text-white">Notion as Source of Truth</strong>
              <p>Projects, skills, and certificates are pulled from your Notion databases.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <strong className="text-white">Local Additions</strong>
              <p>You can add extra skills and certificates directly in the CMS. These are preserved during sync.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <strong className="text-white">Automatic Sync</strong>
              <p>Webhooks trigger automatic sync when you update Notion. You can also manually sync anytime.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Sync History</h3>
        </div>
        
        {logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-500">
            No sync history yet. Click &quot;Sync Now&quot; to start.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  {getSourceIcon(log.source)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{log.action}</div>
                  <div className="text-sm text-zinc-500 truncate">
                    {log.details ? JSON.stringify(log.details) : 'No details'}
                  </div>
                </div>
                <div className="text-sm text-zinc-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Webhook Configuration</h3>
        <div className="space-y-3 text-sm text-zinc-400">
          <p>To enable automatic sync from Notion:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to your Notion database settings</li>
            <li>Add a webhook integration pointing to:</li>
            <code className="block bg-zinc-800 rounded px-3 py-2 my-2 text-blue-400">
              {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/notion/revalidate
            </code>
            <li>Set the <code className="px-1 py-0.5 bg-zinc-800 rounded text-blue-400">NOTION_WEBHOOK_SECRET</code> env variable</li>
            <li>Changes in Notion will automatically sync to your site</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
