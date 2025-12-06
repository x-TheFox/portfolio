'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Save, X, Cloud, Database, ExternalLink, FileText, Edit2, Image } from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';

interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  client: string | null;
  industry: string;
  type: string;
  featured: boolean;
  coverImage: string | null;
  pdfUrl: string | null;
  tags: string[];
  date: string | null;
  content: string | null;
  source: 'notion' | 'local';
  notionId: string | null;
}

const industries = ['tech', 'finance', 'healthcare', 'retail', 'gaming', 'other'];
const types = ['product-design', 'system-design', 'ux-research', 'branding', 'full-project'];

const isLocalAddition = (item: CaseStudy) => item.source === 'local';

export default function CaseStudiesPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CaseStudy | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    client: '',
    industry: 'tech',
    type: 'full-project',
    featured: false,
    coverImage: '',
    pdfUrl: '',
    tags: '',
    date: '',
    content: '',
  });

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch('/api/cms/case-studies');
      const data = await response.json();
      if (data.success) {
        setCaseStudies(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch case studies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      client: '',
      industry: 'tech',
      type: 'full-project',
      featured: false,
      coverImage: '',
      pdfUrl: '',
      tags: '',
      date: '',
      content: '',
    });
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(editingItem ? { id: editingItem.id } : {}),
      };

      const response = await fetch('/api/cms/case-studies', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: editingItem ? 'Case study updated!' : 'Case study added!' });
        if (editingItem) {
          setCaseStudies(prev => prev.map(cs => cs.id === data.data.id ? data.data : cs));
        } else {
          setCaseStudies(prev => [...prev, data.data]);
        }
        setShowAddModal(false);
        resetForm();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save case study' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: CaseStudy) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      description: item.description || '',
      client: item.client || '',
      industry: item.industry,
      type: item.type,
      featured: item.featured,
      coverImage: item.coverImage || '',
      pdfUrl: item.pdfUrl || '',
      tags: (item.tags || []).join(', '),
      date: item.date || '',
      content: item.content || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case study? This will also delete it from Notion if synced.')) return;

    try {
      const response = await fetch(`/api/cms/case-studies?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCaseStudies(prev => prev.filter(cs => cs.id !== id));
        setMessage({ type: 'success', text: 'Case study deleted!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
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
          <h1 className="text-2xl font-bold text-white">Case Studies</h1>
          <p className="text-zinc-500 mt-1">Manage case studies - Notion synced + local additions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Case Study
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

      {/* Case Studies Grid */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {caseStudies.map((cs) => (
            <motion.div
              key={cs.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start gap-4">
                {cs.coverImage ? (
                  <img
                    src={cs.coverImage}
                    alt={cs.title}
                    className="w-20 h-20 rounded-lg object-cover bg-zinc-800"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-white">{cs.title}</h3>
                      <p className="text-sm text-zinc-500 line-clamp-2">{cs.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isLocalAddition(cs) ? (
                        <Database className="w-4 h-4 text-purple-400" aria-label="Local addition" />
                      ) : (
                        <Cloud className="w-4 h-4 text-blue-400" aria-label="Synced from Notion" />
                      )}
                      <button
                        onClick={() => handleEdit(cs)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cs.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400">
                      {cs.industry}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400">
                      {cs.type}
                    </span>
                    {cs.featured && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
                        Featured
                      </span>
                    )}
                    {cs.pdfUrl && (
                      <a
                        href={cs.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <FileText className="w-3 h-3" />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {caseStudies.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No case studies found. Add some case studies or sync from Notion.
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingItem ? 'Edit Case Study' : 'Add New Case Study'}
                </h2>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          title: e.target.value,
                          slug: formData.slug || generateSlug(e.target.value)
                        });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="E-commerce Redesign"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="e-commerce-redesign"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                    rows={2}
                    placeholder="Brief description of the case study..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Client</label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                    >
                      {industries.map(ind => (
                        <option key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                    >
                      {types.map(t => (
                        <option key={t} value={t}>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="react, figma, ux"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Image URL</label>
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">PDF URL</label>
                    <input
                      type="text"
                      value={formData.pdfUrl}
                      onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Content (Markdown)</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
                    rows={6}
                    placeholder="# Overview&#10;&#10;Describe the case study..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700"
                  />
                  <label htmlFor="featured" className="text-sm text-zinc-400">Featured case study</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving || !formData.title.trim() || !formData.slug.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingItem ? 'Update' : 'Add'} Case Study
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
