'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, User, MapPin, FileText, Globe } from 'lucide-react';
import { UploadDropzone } from '@/lib/uploadthing';

interface Profile {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  shortBio: string | null;
  profileImageUrl: string | null;
  resumeUrl: string | null;
  socialLinks: Record<string, string>;
  location: string | null;
  available: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/cms/profile');
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cms/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' });
        setProfile(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof Profile, value: unknown) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const updateSocialLink = (platform: string, url: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      socialLinks: { ...profile.socialLinks, [platform]: url },
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
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-zinc-500 mt-1">Manage your personal information</p>
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

      {/* Basic Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Name</label>
            <input
              type="text"
              value={profile?.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={profile?.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Available for Work</label>
            <button
              onClick={() => updateField('available', !profile?.available)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                profile?.available
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {profile?.available ? '✓ Available' : 'Not Available'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Short Bio (Hero)</label>
          <input
            type="text"
            value={profile?.shortBio || ''}
            onChange={(e) => updateField('shortBio', e.target.value)}
            placeholder="A brief tagline for the hero section"
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Full Bio</label>
          <textarea
            value={profile?.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            rows={5}
            placeholder="Tell your story..."
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Social Links
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['github', 'linkedin', 'twitter'].map((platform) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-zinc-400 mb-2 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={profile?.socialLinks?.[platform] || ''}
                onChange={(e) => updateSocialLink(platform, e.target.value)}
                placeholder={`https://${platform}.com/username`}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Resume */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Resume
        </h3>

        <div className="space-y-4">
          {profile?.resumeUrl && (
            <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
              <span className="text-zinc-300">Current resume uploaded</span>
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                View →
              </a>
            </div>
          )}

          <UploadDropzone
            endpoint="resumeFile"
            onClientUploadComplete={(res) => {
              console.log('Upload complete response:', res);
              if (res && res[0]) {
                const url = res[0].url || res[0].serverData?.url;
                console.log('Using URL:', url);
                if (url) {
                  updateField('resumeUrl', url);
                  setMessage({ type: 'success', text: 'Resume uploaded! Remember to save.' });
                } else {
                  setMessage({ type: 'error', text: 'Upload succeeded but no URL returned' });
                }
              }
            }}
            onUploadError={(error) => {
              console.error('Upload error:', error);
              setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
            }}
            onUploadBegin={(name) => {
              console.log('Upload starting:', name);
              setMessage({ type: 'success', text: `Uploading ${name}...` });
            }}
            className="ut-label:text-zinc-400 ut-allowed-content:text-zinc-500 ut-button:bg-blue-600 ut-button:hover:bg-blue-700 border-zinc-700 bg-zinc-800/50"
          />
          
          {/* Direct URL fallback */}
          <div className="pt-4 border-t border-zinc-800">
            <label className="block text-xs text-zinc-500 mb-2">Or enter resume URL directly:</label>
            <input
              type="url"
              value={profile?.resumeUrl || ''}
              onChange={(e) => updateField('resumeUrl', e.target.value)}
              placeholder="https://example.com/your-resume.pdf"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
