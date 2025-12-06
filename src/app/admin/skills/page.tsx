'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Save, X, Cloud, Database, Github, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  icon: string | null;
  notionId: string | null;
  source: 'notion' | 'local' | 'github';
  isLocalAddition: boolean;
}

interface GitHubSkill {
  name: string;
  level: number;
  category: string;
  source: 'github';
  confidence: number;
  selected?: boolean;
}

const categories = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps',
  'Mobile',
  'AI/ML',
  'Design',
  'Tools',
  'Language',
  'Other',
];

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // GitHub sync state
  const [githubUsername, setGithubUsername] = useState('');
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [githubSkills, setGithubSkills] = useState<GitHubSkill[]>([]);
  const [githubStats, setGithubStats] = useState<{ languagesFound: number; topicsFound: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'Frontend',
    level: 80,
    icon: '',
    personas: ['global'] as string[],
  });

  const personaOptions = [
    { value: 'global', label: 'Global (All personas)' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'designer', label: 'Designer' },
    { value: 'cto', label: 'CTO' },
    { value: 'gamer', label: 'Gamer' },
    { value: 'curious', label: 'Curious' },
  ];

  const togglePersona = (persona: string) => {
    setNewSkill(prev => {
      const currentPersonas = prev.personas;
      if (persona === 'global') {
        // If selecting global, clear others
        return { ...prev, personas: ['global'] };
      }
      // Remove global if selecting specific persona
      const withoutGlobal = currentPersonas.filter(p => p !== 'global');
      if (withoutGlobal.includes(persona)) {
        // Remove persona if already selected
        const newPersonas = withoutGlobal.filter(p => p !== persona);
        return { ...prev, personas: newPersonas.length === 0 ? ['global'] : newPersonas };
      }
      // Add persona
      return { ...prev, personas: [...withoutGlobal, persona] };
    });
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/cms/skills');
      const data = await response.json();
      if (data.success) {
        setSkills(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cms/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSkill),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Skill added!' });
        setSkills([...skills, data.data]);
        setShowAddModal(false);
        setNewSkill({ name: '', category: 'Frontend', level: 80, icon: '', personas: ['global'] });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add skill' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill?.source === 'notion') {
      setMessage({ type: 'error', text: 'Cannot delete Notion-synced skills' });
      return;
    }

    try {
      const response = await fetch(`/api/cms/skills?id=${skillId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSkills(skills.filter(s => s.id !== skillId));
        setMessage({ type: 'success', text: 'Skill deleted!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  // GitHub sync functions
  const fetchGitHubSkills = async () => {
    if (!githubUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a GitHub username' });
      return;
    }
    
    setIsLoadingGitHub(true);
    setMessage(null);
    setGithubSkills([]);
    setGithubStats(null);
    
    try {
      const response = await fetch(`/api/github/skills?username=${encodeURIComponent(githubUsername)}`);
      const data = await response.json();
      
      if (data.success) {
        setGithubSkills(data.skills.map((s: GitHubSkill) => ({ ...s, selected: true })));
        setGithubStats(data.stats);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch GitHub skills' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to GitHub' });
    } finally {
      setIsLoadingGitHub(false);
    }
  };

  const toggleGitHubSkill = (index: number) => {
    setGithubSkills(skills => 
      skills.map((s, i) => i === index ? { ...s, selected: !s.selected } : s)
    );
  };

  const selectAllGitHubSkills = (selected: boolean) => {
    setGithubSkills(skills => skills.map(s => ({ ...s, selected })));
  };

  const importGitHubSkills = async () => {
    const selectedSkills = githubSkills.filter(s => s.selected);
    if (selectedSkills.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one skill to import' });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const response = await fetch('/api/github/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: selectedSkills }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Imported: ${data.imported}, Updated: ${data.updated}, Skipped: ${data.skipped}` 
        });
        setShowGitHubModal(false);
        setGithubSkills([]);
        fetchSkills(); // Refresh skills list
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to import skills' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import skills' });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredSkills = activeCategory
    ? skills.filter(s => s.category.toLowerCase() === activeCategory.toLowerCase())
    : skills;

  const uniqueCategories = [...new Set(skills.map(s => s.category))];

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Skills</h1>
          <p className="text-zinc-500 mt-1">Manage skills - GitHub synced + local additions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGitHubModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            <Github className="w-4 h-4" />
            Sync from GitHub
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>
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

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            !activeCategory
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          )}
        >
          All ({skills.length})
        </button>
        {uniqueCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            {category} ({skills.filter(s => s.category === category).length})
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredSkills.map((skill) => (
            <motion.div
              key={skill.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {skill.icon && (
                    <span className="text-2xl">{skill.icon}</span>
                  )}
                  <div>
                    <h3 className="font-medium text-white">{skill.name}</h3>
                    <p className="text-sm text-zinc-500">{skill.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {skill.source === 'github' ? (
                    <Github className="w-4 h-4 text-green-400" aria-label="Synced from GitHub" />
                  ) : skill.source === 'notion' ? (
                    <Cloud className="w-4 h-4 text-blue-400" aria-label="Synced from Notion" />
                  ) : (
                    <Database className="w-4 h-4 text-purple-400" aria-label="Local addition" />
                  )}
                  {skill.source !== 'notion' && (
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Proficiency</span>
                  <span className="text-zinc-400">{skill.level}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No skills found. Add some skills or sync from Notion.
        </div>
      )}

      {/* Add Modal */}
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
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add New Skill</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Name *</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="e.g., TypeScript"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Proficiency: {newSkill.level}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Icon (emoji)</label>
                  <input
                    type="text"
                    value={newSkill.icon}
                    onChange={(e) => setNewSkill({ ...newSkill, icon: e.target.value })}
                    placeholder="e.g., ⚛️"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Visibility (Personas)</label>
                  <div className="flex flex-wrap gap-2">
                    {personaOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => togglePersona(option.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm transition-colors',
                          newSkill.personas.includes(option.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Select which personas can see this skill. Global means all personas.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSkill}
                    disabled={isSaving || !newSkill.name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Add Skill
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GitHub Sync Modal */}
      <AnimatePresence>
        {showGitHubModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowGitHubModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Github className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Sync from GitHub</h2>
                </div>
                <button
                  onClick={() => {
                    setShowGitHubModal(false);
                    setGithubSkills([]);
                    setGithubStats(null);
                  }}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Username Input */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="Enter GitHub username"
                  className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && fetchGitHubSkills()}
                />
                <button
                  onClick={fetchGitHubSkills}
                  disabled={isLoadingGitHub || !githubUsername.trim()}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isLoadingGitHub ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Analyze
                </button>
              </div>

              {/* Stats */}
              {githubStats && (
                <div className="flex gap-4 mb-4 text-sm">
                  <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">
                    {githubStats.languagesFound} languages
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">
                    {githubStats.topicsFound} topics
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">
                    {githubSkills.length} skills detected
                  </span>
                </div>
              )}

              {/* Skills List */}
              {githubSkills.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-500">
                      {githubSkills.filter(s => s.selected).length} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectAllGitHubSkills(true)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Select All
                      </button>
                      <span className="text-zinc-600">|</span>
                      <button
                        onClick={() => selectAllGitHubSkills(false)}
                        className="text-sm text-zinc-400 hover:text-zinc-300"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                    {githubSkills.map((skill, index) => (
                      <div
                        key={`${skill.name}-${index}`}
                        onClick={() => toggleGitHubSkill(index)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                          skill.selected
                            ? 'bg-blue-600/20 border border-blue-500/30'
                            : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center',
                            skill.selected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-zinc-600'
                          )}>
                            {skill.selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <span className="font-medium text-white">{skill.name}</span>
                            <span className="text-sm text-zinc-500 ml-2">({skill.category})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-zinc-400">{skill.level}%</div>
                          <div className="w-20 h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        setShowGitHubModal(false);
                        setGithubSkills([]);
                      }}
                      className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={importGitHubSkills}
                      disabled={isImporting || githubSkills.filter(s => s.selected).length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isImporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Import Selected
                    </button>
                  </div>
                </>
              )}

              {/* Empty State */}
              {!isLoadingGitHub && githubSkills.length === 0 && githubUsername && (
                <div className="text-center py-8 text-zinc-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Enter a GitHub username and click Analyze to detect skills</p>
                </div>
              )}

              {/* Loading State */}
              {isLoadingGitHub && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
                  <p className="text-zinc-400">Analyzing GitHub profile...</p>
                  <p className="text-sm text-zinc-500 mt-1">This may take a moment</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
