'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, User, Sparkles, Code2, Award, Info,
  RefreshCw, LogOut, ChevronLeft, Menu, X, Briefcase, Network
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'Profile', icon: User },
  { href: '/admin/hero', label: 'Hero Content', icon: Sparkles },
  { href: '/admin/skills', label: 'Skills', icon: Code2 },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
  { href: '/admin/case-studies', label: 'Case Studies', icon: Briefcase },
  { href: '/admin/architecture', label: 'Architecture', icon: Network },
  { href: '/admin/about', label: 'About Section', icon: Info },
  { href: '/admin/sync', label: 'Sync & Logs', icon: RefreshCw },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/admin/login';
  
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/cms/auth', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Site</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-zinc-900 border-r border-zinc-800 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold text-white">
              <span className="text-blue-500">{"<"}</span>Sam<span className="text-blue-500">{"/>"}</span>
              <span className="text-zinc-500 font-normal ml-2">Admin</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Content Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Site
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
