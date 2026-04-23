import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTicketStore } from '../store/useTicketStore'

const QUICK_ACTIONS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: '⊞', path: '/dashboard', group: 'Navigation' },
  { id: 'new-ticket', label: 'Create New Ticket', icon: '+', path: '/tickets/new', group: 'Navigation' },
  { id: 'admin', label: 'Admin Console', icon: '⚡', path: '/admin', group: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings', group: 'Navigation' },
]

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const tickets = useTicketStore(s => s.tickets)

  // Fuzzy filter tickets + quick actions
  const q = query.toLowerCase()
  const matchedTickets = q.length >= 2
    ? tickets.filter(t => t.title?.toLowerCase().includes(q)).slice(0, 5).map(t => ({
        id: `ticket-${t.id}`,
        label: t.title,
        icon: '🎫',
        path: `/tickets/${t.id}`,
        group: 'Tickets',
        badge: t.status,
      }))
    : []

  const matchedActions = q.length === 0
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(q))

  const allItems = [...matchedActions, ...matchedTickets]

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
    }
  }, [isOpen])

  const execute = useCallback((item) => {
    navigate(item.path)
    onClose()
  }, [navigate, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') return onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, allItems.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter' && allItems[selected]) {
        execute(allItems[selected])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, allItems, selected, execute, onClose])

  if (!isOpen) return null

  // Group items
  const groups = {}
  allItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = []
    groups[item.group].push(item)
  })

  let itemIndex = 0

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
          </svg>
          <input
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Search tickets or type a command..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#f1f5f9', fontSize: 15, fontWeight: 500,
            }}
          />
          <kbd style={{ background: 'rgba(255,255,255,0.06)', color: '#475569', fontSize: 11, padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'mono' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
          {allItems.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#475569', fontSize: 14 }}>
              No results for "{query}"
            </div>
          )}

          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div style={{ padding: '6px 16px 4px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {group}
              </div>
              {items.map((item) => {
                const idx = itemIndex++
                const isSelected = idx === selected
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelected(idx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', textAlign: 'left', background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer', color: isSelected ? '#a78bfa' : '#cbd5e1',
                      fontSize: 14, fontWeight: 500, transition: 'all 80ms',
                    }}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 12, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <kbd style={{ background: 'rgba(255,255,255,0.06)', color: '#475569', fontSize: 10, padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>↵</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, fontSize: 11, color: '#334155' }}>
          <span><kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>↵</kbd> open</span>
          <span><kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
