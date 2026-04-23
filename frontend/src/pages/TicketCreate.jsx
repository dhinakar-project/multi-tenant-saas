import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';
import { notify } from '../utils/toast';

function TicketCreate() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'Medium' });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  const tenantSlug = localStorage.getItem('tenantSlug');

  // Debounced AI suggestions as user types
  useEffect(() => {
    if (!formData.title || formData.title.length < 10) {
      setAiSuggestion(null);
      return;
    }
    clearTimeout(debounceRef.current);
    setAiLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.post('/ai/suggest', {
          title: formData.title,
          description: formData.description || '',
        });
        setAiSuggestion(res.data);
      } catch {
        // Silently ignore — AI panel is informational
      } finally {
        setAiLoading(false);
      }
    }, 900);
    return () => clearTimeout(debounceRef.current);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/tickets', {
        ...formData,
        aiCategory: aiSuggestion?.category || null,
        tags,
      });
      setShowSuccess(true);
      notify.ai('✦ Ticket created — AI categorization starting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (val) => {
    const t = val.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 6) {
      setTags(prev => [...prev, t]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  if (!tenantSlug) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-3">No Tenant Selected</h2>
          <p className="text-slate-400 mb-6 text-sm">Please sign in to your organization to create a ticket.</p>
          <button onClick={() => navigate('/sign-in')} className="btn-primary w-full">Go to Login</button>
        </div>
      </div>
    );
  }

  const priorityOptions = [
    { level: 'Low', desc: 'Non-urgent improvement', color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
    { level: 'Medium', desc: 'Broken but workaround exists', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
    { level: 'High', desc: 'Significant impact', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)' },
    { level: 'Urgent', desc: 'Production outage', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
  ];

  // Confidence ring SVG
  const conf = aiSuggestion?.confidence != null ? Math.round(aiSuggestion.confidence * 100) : null;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = conf != null ? (circumference - (conf / 100) * circumference) : circumference;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <span className="badge badge-ai" style={{ marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>✦</span> AI-Assisted Ticket Form
        </span>
        <h1 style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 800, color: '#f1f5f9', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Create New Ticket
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>
          Describe your issue — Gemini AI will categorize and triage it automatically.
        </p>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Form ── */}
        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Title */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Ticket Subject <span style={{ color: '#a78bfa' }}>*</span>
              </label>
              <input
                required
                placeholder="e.g., Cannot access billing portal on staging"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#f1f5f9', padding: '12px 14px', fontSize: 15,
                  outline: 'none', transition: 'all 150ms', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Detailed Description <span style={{ color: '#a78bfa' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  required
                  rows={7}
                  placeholder="Steps to reproduce, expected behavior, error logs..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: '#f1f5f9', padding: '12px 14px', fontSize: 14,
                    outline: 'none', resize: 'none', transition: 'all 150ms', boxSizing: 'border-box', lineHeight: 1.6,
                  }}
                />
                <span style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 11, color: '#334155', pointerEvents: 'none' }}>
                  {formData.description.length} chars
                </span>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Priority Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {priorityOptions.map(p => {
                  const isSelected = formData.priority === p.level;
                  return (
                    <label
                      key={p.level}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                        borderRadius: 10, cursor: 'pointer', transition: 'all 150ms',
                        background: isSelected ? p.bg : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? p.border : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: isSelected ? `0 0 12px ${p.bg}` : 'none',
                      }}
                    >
                      <input
                        type="radio" name="priority" value={p.level}
                        checked={isSelected}
                        onChange={() => setFormData({ ...formData, priority: p.level })}
                        style={{ accentColor: p.color, width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ color: isSelected ? p.color : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{p.level}</div>
                        <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{p.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Tags <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, minHeight: 44, alignItems: 'center',
              }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
                    border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, padding: '2px 10px',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                      style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}
                    >×</button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={tags.length === 0 ? 'Type tag + Enter...' : ''}
                  style={{ flex: 1, minWidth: 80, background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 13 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 2, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Submitting...
                  </span>
                ) : 'Submit Ticket →'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: AI Suggestions Panel ── */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
              <div>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>AI Live Analysis</div>
                <div style={{ color: '#334155', fontSize: 11 }}>Updates as you type</div>
              </div>
            </div>

            {/* Loading state */}
            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'rgba(139,92,246,0.06)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)' }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 500 }}>🤖 AI is analyzing...</span>
              </div>
            )}

            {/* No suggestion yet */}
            {!aiLoading && !aiSuggestion && formData.title.length < 10 && (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: '#334155' }}>
                <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.5 }}>🤖</div>
                <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>Start typing your ticket title to see AI suggestions appear here.</p>
              </div>
            )}

            {/* AI suggestion card */}
            {!aiLoading && aiSuggestion && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Category + confidence */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Category</div>
                    <span className="badge badge-ai" style={{ fontSize: 13 }}>
                      ✦ {aiSuggestion.category || 'Other'}
                    </span>
                  </div>

                  {/* Circular confidence meter */}
                  {conf !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                        <circle
                          cx="32" cy="32" r={radius} fill="none"
                          stroke={conf >= 80 ? '#4ade80' : conf >= 60 ? '#fbbf24' : '#f87171'}
                          strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={progress}
                          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', color: '#f1f5f9', fontSize: 13, fontWeight: 800 }}>
                        {conf}%
                      </div>
                      <div style={{ color: '#475569', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Confidence</div>
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>AI Priority Suggestion</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                    borderRadius: 20, fontSize: 13, fontWeight: 700,
                    background: aiSuggestion.priority === 'High' ? 'rgba(239,68,68,0.12)' :
                      aiSuggestion.priority === 'Medium' ? 'rgba(251,191,36,0.12)' : 'rgba(59,130,246,0.12)',
                    color: aiSuggestion.priority === 'High' ? '#f87171' :
                      aiSuggestion.priority === 'Medium' ? '#fbbf24' : '#60a5fa',
                    border: `1px solid ${aiSuggestion.priority === 'High' ? 'rgba(239,68,68,0.25)' :
                      aiSuggestion.priority === 'Medium' ? 'rgba(251,191,36,0.25)' : 'rgba(59,130,246,0.25)'}`,
                  }}>
                    ↑ {aiSuggestion.priority || 'Medium'}
                  </div>
                </div>

                {/* Apply suggestion button */}
                <button
                  type="button"
                  onClick={() => {
                    if (aiSuggestion.priority) {
                      setFormData(d => ({ ...d, priority: aiSuggestion.priority }));
                      notify.ai('AI suggestion applied!');
                    }
                  }}
                  style={{
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                    color: '#a78bfa', borderRadius: 8, padding: '8px 14px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                >
                  ↑ Apply AI Priority Suggestion
                </button>
              </div>
            )}
          </div>

          {/* Tips card */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Tips for better AI results</div>
            {[
              'Include specific error messages or codes',
              'Mention affected users or features',
              'Describe what you expected vs what happened',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                <span style={{ color: '#7c3aed', flexShrink: 0 }}>✓</span> {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', maxWidth: 380 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h3 style={{ color: '#4ade80', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Ticket Created!</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>AI categorization is running in the background...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketCreate;
