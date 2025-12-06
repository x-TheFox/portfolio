'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Database, Cloud, Cpu, Upload, Key, MessageSquare,
  CheckCircle2, XCircle, AlertCircle, Clock, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'not-configured';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: ServiceStatus[];
  environment: {
    nodeEnv: string;
    configured: {
      database: boolean;
      notion: boolean;
      groq: boolean;
      openrouter: boolean;
      uploadthing: boolean;
      adminSecret: boolean;
    };
  };
}

interface ChatTestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface ChatHealthResponse {
  overall: 'pass' | 'partial' | 'fail';
  timestamp: string;
  tests: ChatTestResult[];
  summary: {
    passed: number;
    failed: number;
    skipped: number;
  };
}

interface SyncLogEntry {
  id: string;
  source: string;
  status: string;
  itemsUpdated: number;
  details: Record<string, unknown>;
  timestamp: string;
}

const statusConfig = {
  healthy: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  degraded: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  down: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  'not-configured': { icon: AlertCircle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
};

const chatStatusConfig = {
  pass: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  partial: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  fail: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  skip: { icon: AlertCircle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
};

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Database (Neon)': Database,
  'Notion API': Cloud,
  'Groq API': Cpu,
  'OpenRouter API': Cpu,
  'UploadThing': Upload,
};

export default function AdminDashboard() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [chatHealth, setChatHealth] = useState<ChatHealthResponse | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isLoadingChatHealth, setIsLoadingChatHealth] = useState(false);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const fetchChatHealth = async (quick = true) => {
    setIsLoadingChatHealth(true);
    try {
      const response = await fetch(`/api/health/chat${quick ? '?quick=true' : ''}`);
      const data = await response.json();
      setChatHealth(data);
    } catch (error) {
      console.error('Failed to fetch chat health:', error);
    } finally {
      setIsLoadingChatHealth(false);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const response = await fetch('/api/cms/sync');
      const data = await response.json();
      if (data.success && Array.isArray(data.logs)) {
        setSyncLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    }
  };

  const handleSync = async () => {
    setIsLoadingSync(true);
    try {
      const response = await fetch('/api/cms/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        await fetchSyncLogs();
      }
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setIsLoadingSync(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchChatHealth(true);
    fetchSyncLogs();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">System health and sync status</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealth}
            disabled={isLoadingHealth}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingHealth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Check Health
          </button>
          <button
            onClick={handleSync}
            disabled={isLoadingSync}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingSync ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Sync Now
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-6 rounded-xl border',
            health.overall === 'healthy' && 'bg-green-500/5 border-green-500/20',
            health.overall === 'degraded' && 'bg-yellow-500/5 border-yellow-500/20',
            health.overall === 'down' && 'bg-red-500/5 border-red-500/20'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-full',
                statusConfig[health.overall].bg
              )}>
                <Activity className={cn('w-6 h-6', statusConfig[health.overall].color)} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white capitalize">
                  System {health.overall}
                </h2>
                <p className="text-sm text-zinc-500">
                  Environment: {health.environment.nodeEnv}
                </p>
              </div>
            </div>
            {lastChecked && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-4 h-4" />
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Services Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health?.services.map((service, index) => {
            const config = statusConfig[service.status];
            const Icon = serviceIcons[service.name] || Cloud;
            
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', config.bg)}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                    config.bg, config.color
                  )}>
                    {(() => {
                      const StatusIcon = config.icon;
                      return <StatusIcon className="w-3 h-3" />;
                    })()}
                    {service.status}
                  </div>
                </div>
                <h4 className="font-medium text-white">{service.name}</h4>
                {service.latency !== undefined && (
                  <p className="text-sm text-zinc-500 mt-1">
                    Latency: {service.latency}ms
                  </p>
                )}
                {service.error && (
                  <p className="text-sm text-red-400 mt-1 truncate" title={service.error}>
                    {service.error}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Chat System Health */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Chat System Health</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchChatHealth(true)}
              disabled={isLoadingChatHealth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isLoadingChatHealth ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Quick Test
            </button>
            <button
              onClick={() => fetchChatHealth(false)}
              disabled={isLoadingChatHealth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isLoadingChatHealth ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Activity className="w-3 h-3" />
              )}
              Full Test
            </button>
          </div>
        </div>

        {chatHealth && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={cn(
              'p-4 rounded-xl border flex items-center justify-between',
              chatHealth.overall === 'pass' && 'bg-green-500/5 border-green-500/20',
              chatHealth.overall === 'partial' && 'bg-yellow-500/5 border-yellow-500/20',
              chatHealth.overall === 'fail' && 'bg-red-500/5 border-red-500/20'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', chatStatusConfig[chatHealth.overall].bg)}>
                  <MessageSquare className={cn('w-5 h-5', chatStatusConfig[chatHealth.overall].color)} />
                </div>
                <div>
                  <p className="font-medium text-white capitalize">
                    Chat System: {chatHealth.overall === 'pass' ? 'All Tests Passing' : chatHealth.overall === 'partial' ? 'Some Tests Failing' : 'Tests Failing'}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {chatHealth.summary.passed} passed, {chatHealth.summary.failed} failed, {chatHealth.summary.skipped} skipped
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                {new Date(chatHealth.timestamp).toLocaleTimeString()}
              </p>
            </div>

            {/* Test Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {chatHealth.tests.map((test, index) => {
                const config = chatStatusConfig[test.status];
                
                return (
                  <motion.div
                    key={test.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">{test.name}</h4>
                      <div className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                        config.bg, config.color
                      )}>
                        {(() => {
                          const StatusIcon = config.icon;
                          return <StatusIcon className="w-3 h-3" />;
                        })()}
                        {test.status}
                      </div>
                    </div>
                    {test.latency !== undefined && (
                      <p className="text-xs text-zinc-500">
                        Latency: {test.latency}ms
                      </p>
                    )}
                    {test.error && (
                      <p className="text-xs text-red-400 mt-1 truncate" title={test.error}>
                        {test.error}
                      </p>
                    )}
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                          View details
                        </summary>
                        <pre className="mt-1 text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {!chatHealth && !isLoadingChatHealth && (
          <div className="p-8 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
            Click &quot;Quick Test&quot; or &quot;Full Test&quot; to check chat system health
          </div>
        )}

        {isLoadingChatHealth && !chatHealth && (
          <div className="p-8 text-center text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Running tests...
          </div>
        )}
      </div>

      {/* Environment Variables */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {health && Object.entries(health.environment.configured).map(([key, value]) => (
            <div
              key={key}
              className={cn(
                'p-3 rounded-lg border text-center',
                value 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : 'bg-zinc-800/50 border-zinc-700'
              )}
            >
              <div className={cn(
                'flex items-center justify-center mb-2',
                value ? 'text-green-400' : 'text-zinc-500'
              )}>
                {value ? <CheckCircle2 className="w-5 h-5" /> : <Key className="w-5 h-5" />}
              </div>
              <p className={cn(
                'text-xs font-medium capitalize',
                value ? 'text-green-400' : 'text-zinc-500'
              )}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sync Logs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Sync Activity</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {syncLogs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No sync activity yet
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {syncLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      log.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
                    )}>
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">
                        {log.source.replace('-', ' ')}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {log.itemsUpdated} items updated
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
