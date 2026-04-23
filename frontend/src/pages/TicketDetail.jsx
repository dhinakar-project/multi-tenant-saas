import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import api, { setClerkTokenGetter } from '../api/api';
import { useTenant } from '../context/TenantContext';
import VoiceAssistant from '../components/VoiceAssistant';
import { SkeletonList } from '../components/SkeletonCard';
import { timeAgo } from '../utils/timeAgo';
import { notify } from '../utils/toast';

// ── Avatar initials circle ─────────────────────────────────────
function Avatar({ name, size = 32 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const hash = name ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
  const colors = ['#7c3aed', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626'];
  const bg = colors[hash % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Simple markdown bold/italic renderer ──────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function TicketDetail() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { isAdmin } = useTenant();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);

  useEffect(() => { setClerkTokenGetter(getToken); }, [getToken]);
  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const [ticketRes, commentsRes] = await Promise.all([
      api.get(`/tickets/${id}`),
      api.get(`/tickets/${id}/comments`),
    ]);
    setTicket(ticketRes.data);
    setComments(commentsRes.data);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/tickets/${id}/status`, { status: newStatus });
      setTicket(t => ({ ...t, status: newStatus }));
      notify.success(`Status changed to ${newStatus}`);
    } catch {
      notify.error('Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/tickets/${id}/comments`, { message: newComment });
      setNewComment('');
      fetchData();
      notify.success('Comment posted');
    } catch {
      notify.error('Failed to post comment');
    }
  };

  const handleDraftReply = async () => {
    setDraftLoading(true);
    try {
      const res = await api.post(`/tickets/${id}/ai/draft`);
      const draft = res.data?.draftReply || res.data?.reply || '';
      setNewComment(draft);
      notify.ai('✦ AI draft reply inserted');
    } catch {
      notify.error('Could not generate draft reply');
    } finally {
      setDraftLoading(false);
    }
  };

  if (!ticket) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 0' }}>
        <SkeletonList count={4} lines={5} />
      </div>
    );
  }

  const priorityColor = {
    Critical: '#f87171', Urgent: '#f87171',
    High: '#f97316', Medium: '#fbbf24', Low: '#60a5fa'
  }[ticket.priority] || '#94a3b8';

  const statusStyles = {
    Open: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    InProgress: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
    'In Progress': { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
    Resolved: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
    Closed: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  };
  const ss = statusStyles[ticket.status] || { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', animation: 'fadeInUp 0.4s ease both' }}>

      {/* Back nav */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 24, padding: '6px 0', transition: 'color 150ms' }}
        onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Dashboard
      </button>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Main content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Ticket header card */}
          <div className="glass-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.3, flex: 1 }}>
                {ticket.title}
              </h1>
              <span style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: `${priorityColor}18`, color: priorityColor, border: `1px solid ${priorityColor}40`,
              }}>
                {ticket.priority}
              </span>
            </div>

            {ticket.description && (
              <div style={{
                color: '#94a3b8', fontSize: 14.5, lineHeight: 1.8, whiteSpace: 'pre-wrap',
                padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20,
              }}>
                {ticket.description}
              </div>
            )}

            {/* Status change */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#475569', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status:</span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  value={ticket.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={!isAdmin}
                  style={{
                    padding: '6px 28px 6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: ss.bg, color: ss.color, border: `1px solid ${ss.color}40`,
                    outline: 'none', cursor: isAdmin ? 'pointer' : 'not-allowed',
                    appearance: 'none', WebkitAppearance: 'none',
                    opacity: isAdmin ? 1 : 0.6,
                  }}
                >
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={ss.color} strokeWidth="2.5" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {!isAdmin && <span style={{ color: '#334155', fontSize: 11 }}>Admin only</span>}
            </div>
          </div>

          {/* AI Insights card */}
          {ticket.aiStatus === 'DONE' && (
            <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✦</span> AI Analysis Results
                </div>
                <span className="badge badge-ai" style={{ fontSize: 10 }}>Gemini Flash</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Category', value: ticket.aiCategory },
                  { label: 'Suggested Priority', value: ticket.aiSuggestedPriority },
                  { label: 'Confidence', value: ticket.aiConfidence != null ? `${Math.round(ticket.aiConfidence * 100)}%` : null },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                    <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 15 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
              {ticket.aiReasoning && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.12)', borderLeft: '3px solid #7c3aed' }}>
                  <span style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Reasoning: </span>
                  <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>{ticket.aiReasoning}</span>
                </div>
              )}
            </div>
          )}
          {ticket.aiStatus === 'PENDING' && (
            <div className="glass-card" style={{ padding: 24, border: '1px dashed rgba(139,92,246,0.2)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#a78bfa' }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                AI Analysis in progress...
              </div>
            </div>
          )}

          {/* Comments section */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ color: '#f1f5f9', fontSize: 17, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              Comments
              <span style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b', fontSize: 12, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                {comments.length}
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {comments.map(c => {
                const authorName = c.author?.fullName || c.author?.email || 'Unknown';
                return (
                  <div key={c.id} style={{
                    display: 'flex', gap: 12, padding: '14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: '3px solid rgba(139,92,246,0.4)',
                  }}>
                    <Avatar name={authorName} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{authorName}</span>
                        <span style={{ color: '#334155', fontSize: 11, fontWeight: 500 }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p
                        style={{ color: '#94a3b8', fontSize: 14, margin: 0, lineHeight: 1.7 }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(c.message) }}
                      />
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#334155' }}>
                  <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>💬</div>
                  <p style={{ fontSize: 14, margin: 0 }}>No comments yet. Be the first!</p>
                </div>
              )}
            </div>

            {/* Comment form */}
            <form onSubmit={handleAddComment} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <textarea
                  rows={4}
                  placeholder="Add a comment... (supports **bold** and *italic*)"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, color: '#f1f5f9', padding: '12px 14px', fontSize: 14,
                    outline: 'none', resize: 'none', transition: 'border-color 150ms', boxSizing: 'border-box', lineHeight: 1.6,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleDraftReply}
                  disabled={draftLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                    color: '#a78bfa', borderRadius: 8, padding: '8px 14px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: draftLoading ? 0.6 : 1, transition: 'all 150ms',
                  }}
                >
                  {draftLoading
                    ? <><div style={{ width: 12, height: 12, border: '1.5px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating...</>
                    : <><span>✦</span> AI Draft Reply</>}
                </button>
                <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
                  Post Comment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ticket metadata */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Ticket Details</div>
            {[
              { label: 'ID', value: <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{ticket.id?.substring(0, 8)}...</span> },
              { label: 'Created', value: timeAgo(ticket.createdAt) },
              { label: 'Status', value: <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>{ticket.status}</span> },
              { label: 'Priority', value: <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${priorityColor}18`, color: priorityColor }}>{ticket.priority}</span> },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{label}</span>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Activity */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>+</div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>Ticket created</div>
                  <div style={{ color: '#334155', fontSize: 11, marginTop: 2 }}>{timeAgo(ticket.createdAt)}</div>
                </div>
              </div>
              {ticket.aiStatus === 'DONE' && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✦</div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>AI analysis completed</div>
                    <div style={{ color: '#a78bfa', fontSize: 11, marginTop: 2 }}>Category: {ticket.aiCategory}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {ticket && <VoiceAssistant mode="ticket" ticketId={id} ticketTitle={ticket.title || ''} />}
    </div>
  );
}

export default TicketDetail;
