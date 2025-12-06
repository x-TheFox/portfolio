'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Info, Plus, Trash2, Calendar, Rocket, Smile } from 'lucide-react';

interface Highlight {
  label: string;
  value: string;
  icon: string;
}

interface AboutSection {
  id: string;
  title: string | null;
  content: string | null;
  highlights: Highlight[];
  showTimeline: boolean;
}

const ICON_OPTIONS = [
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'rocket', label: 'Rocket', icon: Rocket },
  { value: 'smile', label: 'Smile', icon: Smile },
];

export default function AboutPage() {
  const [about, setAbout] = useState<AboutSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await fetch('/api/cms/about');
      const data = await response.json();
      if (data.success) {
        setAbout({
          ...data.data,
          highlights: data.data.highlights || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch about section:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!about) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cms/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(about),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'About section saved successfully!' });
        setAbout({
          ...data.data,
          highlights: data.data.highlights || [],
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save about section' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof AboutSection, value: unknown) => {
    if (!about) return;
    setAbout({ ...about, [field]: value });
  };

  const addHighlight = () => {
    if (!about) return;
    setAbout({
      ...about,
      highlights: [...about.highlights, { label: '', value: '', icon: 'rocket' }],
    });
  };

  const updateHighlight = (index: number, field: keyof Highlight, value: string) => {
    if (!about) return;
    const newHighlights = [...about.highlights];
    newHighlights[index] = { ...newHighlights[index], [field]: value };
    setAbout({ ...about, highlights: newHighlights });
  };

  const removeHighlight = (index: number) => {
    if (!about) return;
    setAbout({
      ...about,
      highlights: about.highlights.filter((_, i) => i !== index),
    });
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
          <h1 className="text-2xl font-bold text-white">About Section</h1>
          <p className="text-zinc-500 mt-1">Edit the About Me section on the main page</p>
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

      {/* Title */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Section Title
        </h3>
        
        <input
          type="text"
          value={about?.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="About Me"
          className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Content</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Write about yourself. Use double line breaks for paragraphs.
        </p>
        
        <textarea
          value={about?.content || ''}
          onChange={(e) => updateField('content', e.target.value)}
          placeholder="I'm a full-stack developer passionate about building products..."
          rows={8}
          className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none font-mono text-sm"
        />
      </div>

      {/* Highlights */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Highlights</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Add key statistics or achievements to display
            </p>
          </div>
          <button
            onClick={addHighlight}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Highlight
          </button>
        </div>

        <div className="space-y-4">
          {about?.highlights.map((highlight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              {/* Icon selector */}
              <div className="w-24">
                <label className="block text-xs text-zinc-500 mb-2">Icon</label>
                <select
                  value={highlight.icon}
                  onChange={(e) => updateHighlight(index, 'icon', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div className="w-24">
                <label className="block text-xs text-zinc-500 mb-2">Value</label>
                <input
                  type="text"
                  value={highlight.value}
                  onChange={(e) => updateHighlight(index, 'value', e.target.value)}
                  placeholder="5+"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Label */}
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-2">Label</label>
                <input
                  type="text"
                  value={highlight.label}
                  onChange={(e) => updateHighlight(index, 'label', e.target.value)}
                  placeholder="Years Experience"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Delete button */}
              <button
                onClick={() => removeHighlight(index)}
                className="mt-6 p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {about?.highlights.length === 0 && (
            <p className="text-center text-zinc-500 py-8">
              No highlights yet. Add some to showcase your achievements!
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
        
        <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <h4 className="text-xl font-bold text-white mb-4">{about?.title || 'About Me'}</h4>
          
          <div className="text-zinc-300 leading-relaxed space-y-4 mb-6">
            {(about?.content || '').split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {about?.highlights && about.highlights.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {about.highlights.map((highlight, i) => {
                const IconComponent = ICON_OPTIONS.find(o => o.value === highlight.icon)?.icon || Rocket;
                return (
                  <div key={i} className="text-center p-4 rounded-xl bg-zinc-900 border border-zinc-700/50">
                    <div className="flex justify-center mb-2 text-zinc-400">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-white">{highlight.value}</div>
                    <div className="text-xs text-zinc-500">{highlight.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
