'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, Save, X, Cloud, Database, ExternalLink, Award } from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing';
import { cn } from '@/lib/utils';

interface Certificate {
  id: string;
  name: string;
  title?: string; // alias for name
  issuer: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  imageUrl: string | null;
  notionId: string | null;
  source: 'notion' | 'local';
}

// Helper to check if cert is deletable (local additions only)
const isLocalAddition = (cert: Certificate) => cert.source === 'local';
const getCertTitle = (cert: Certificate) => cert.title || cert.name;

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newCert, setNewCert] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/cms/certificates');
      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCertificate = async () => {
    if (!newCert.title.trim() || !newCert.issuer.trim()) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cms/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCert,
          issueDate: newCert.issueDate || null,
          expiryDate: newCert.expiryDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Certificate added!' });
        setCertificates([...certificates, data.data]);
        setShowAddModal(false);
        setNewCert({
          title: '',
          issuer: '',
          issueDate: '',
          expiryDate: '',
          credentialId: '',
          credentialUrl: '',
          imageUrl: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add certificate' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    const cert = certificates.find(c => c.id === certId);
    if (!cert || !isLocalAddition(cert)) {
      setMessage({ type: 'error', text: 'Cannot delete Notion-synced certificates' });
      return;
    }

    try {
      const response = await fetch(`/api/cms/certificates?id=${certId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCertificates(certificates.filter(c => c.id !== certId));
        setMessage({ type: 'success', text: 'Certificate deleted!' });
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
          <h1 className="text-2xl font-bold text-white">Certificates</h1>
          <p className="text-zinc-500 mt-1">Manage certifications - Notion synced + local additions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Certificate
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

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {certificates.map((cert) => (
            <motion.div
              key={cert.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start gap-4">
                {cert.imageUrl ? (
                  <img
                    src={cert.imageUrl}
                    alt={getCertTitle(cert)}
                    className="w-16 h-16 rounded-lg object-cover bg-zinc-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Award className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-white truncate">{getCertTitle(cert)}</h3>
                      <p className="text-sm text-zinc-500">{cert.issuer}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isLocalAddition(cert) ? (
                        <Database className="w-4 h-4 text-purple-400" aria-label="Local addition" />
                      ) : (
                        <Cloud className="w-4 h-4 text-blue-400" aria-label="Synced from Notion" />
                      )}
                      {isLocalAddition(cert) && (
                        <button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="text-zinc-500">
                  {cert.issueDate && (
                    <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                  )}
                  {cert.expiryDate && (
                    <span className="ml-3">
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Verify
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {certificates.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No certificates found. Add some certificates or sync from Notion.
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
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add New Certificate</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newCert.title}
                    onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                    placeholder="e.g., AWS Solutions Architect"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Issuer *</label>
                  <input
                    type="text"
                    value={newCert.issuer}
                    onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                    placeholder="e.g., Amazon Web Services"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Issue Date</label>
                    <input
                      type="date"
                      value={newCert.issueDate}
                      onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={newCert.expiryDate}
                      onChange={(e) => setNewCert({ ...newCert, expiryDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Credential ID</label>
                  <input
                    type="text"
                    value={newCert.credentialId}
                    onChange={(e) => setNewCert({ ...newCert, credentialId: e.target.value })}
                    placeholder="e.g., ABC123XYZ"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Credential URL</label>
                  <input
                    type="url"
                    value={newCert.credentialUrl}
                    onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Certificate Image</label>
                  {newCert.imageUrl ? (
                    <div className="relative">
                      <img
                        src={newCert.imageUrl}
                        alt="Certificate preview"
                        className="w-full h-32 object-cover rounded-lg bg-zinc-800"
                      />
                      <button
                        onClick={() => setNewCert({ ...newCert, imageUrl: '' })}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <UploadButton
                      endpoint="certificateImage"
                      onClientUploadComplete={(res) => {
                        console.log('Certificate upload complete:', res);
                        if (res?.[0]) {
                          const url = res[0].url || res[0].serverData?.url;
                          if (url) {
                            setNewCert({ ...newCert, imageUrl: url });
                          }
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.error('Certificate upload error:', error);
                        setMessage({ type: 'error', text: error.message });
                      }}
                      onUploadBegin={(name) => {
                        console.log('Certificate upload starting:', name);
                      }}
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCertificate}
                    disabled={isSaving || newCert.title.trim() === '' || newCert.issuer.trim() === ''}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white transition-colors",
                      (isSaving || newCert.title.trim() === '' || newCert.issuer.trim() === '')
                        ? "bg-zinc-700 opacity-50 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Add Certificate
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
