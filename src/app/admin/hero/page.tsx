'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroContent {
  id: string;
  persona: string;
  headline: string;
  subheadline: string;
  ctaText: string | null;
  ctaHref: string | null;
  secondaryCtaText: string | null;
  secondaryCtaHref: string | null;
  accentColor: string | null;
  showStats: boolean;
}

const personas = [
  { id: 'recruiter', label: 'Recruiter', color: 'blue' },
  { id: 'engineer', label: 'Engineer', color: 'green' },
  { id: 'designer', label: 'Designer', color: 'purple' },
  { id: 'cto', label: 'CTO', color: 'amber' },
  { id: 'gamer', label: 'Gamer', color: 'red' },
  { id: 'curious', label: 'Curious', color: 'zinc' },
];

export default function HeroPage() {
  const [activePersona, setActivePersona] = useState('recruiter');
  const [content, setContent] = useState<Record<string, HeroContent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      const response = await fetch('/api/cms/hero');
      const data = await response.json();
      if (data.success) {
        setContent(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hero content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const currentContent = content[activePersona];
    if (!currentContent) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cms/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...currentContent, persona: activePersona }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Hero content saved!' });
        setContent({ ...content, [activePersona]: data.data });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof HeroContent, value: unknown) => {
    const currentContent = content[activePersona];
    if (!currentContent) return;
    setContent({
      ...content,
      [activePersona]: { ...currentContent, [field]: value },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const currentContent = content[activePersona];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hero Content</h1>
          <p className="text-zinc-500 mt-1">Customize hero section per persona</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
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

      {/* Persona Tabs */}
      <div className="flex flex-wrap gap-2">
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setActivePersona(persona.id)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activePersona === persona.id
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            )}
          >
            {persona.label}
          </button>
        ))}
      </div>

      {/* Content Editor */}
      {currentContent && (
        <motion.div
          key={activePersona}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {personas.find(p => p.id === activePersona)?.label} Hero
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Headline</label>
              <input
                type="text"
                value={currentContent.headline || ''}
                onChange={(e) => updateField('headline', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Subheadline</label>
              <textarea
                value={currentContent.subheadline || ''}
                onChange={(e) => updateField('subheadline', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Primary CTA Text</label>
                <input
                  type="text"
                  value={currentContent.ctaText || ''}
                  onChange={(e) => updateField('ctaText', e.target.value)}
                  placeholder="View Projects"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Primary CTA Link</label>
                <input
                  type="text"
                  value={currentContent.ctaHref || ''}
                  onChange={(e) => updateField('ctaHref', e.target.value)}
                  placeholder="#projects or /resume.pdf"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Secondary CTA Text</label>
                <input
                  type="text"
                  value={currentContent.secondaryCtaText || ''}
                  onChange={(e) => updateField('secondaryCtaText', e.target.value)}
                  placeholder="Contact Me"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Secondary CTA Link</label>
                <input
                  type="text"
                  value={currentContent.secondaryCtaHref || ''}
                  onChange={(e) => updateField('secondaryCtaHref', e.target.value)}
                  placeholder="#contact"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Accent Color</label>
                <select
                  value={currentContent.accentColor || ''}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="from-blue-600 to-blue-500">Blue</option>
                  <option value="from-green-600 to-green-500">Green</option>
                  <option value="from-purple-600 to-purple-500">Purple</option>
                  <option value="from-amber-600 to-amber-500">Amber</option>
                  <option value="from-red-600 to-red-500">Red</option>
                  <option value="from-zinc-600 to-zinc-500">Zinc</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Show Stats</label>
                <button
                  onClick={() => updateField('showStats', !currentContent.showStats)}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border transition-colors',
                    currentContent.showStats
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  )}
                >
                  {currentContent.showStats ? '✓ Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preview hint */}
      <p className="text-sm text-zinc-500 text-center">
        Changes will be reflected on the homepage based on visitor persona detection.
      </p>
    </div>
  );
}
