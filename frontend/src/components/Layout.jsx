import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useTenant } from '../context/TenantContext';
import AdminModeModal from './admin/AdminModeModal';
import TenantSwitcher from './admin/TenantSwitcher';
import RoleBadge from './admin/RoleBadge';
import VoiceAssistant from './VoiceAssistant';
import CommandPalette from './CommandPalette';

// ── Inline SVG Icons ──────────────────────────────────────────
const Icons = {
  Dashboard: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  NewTicket: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Settings: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93A10 10 0 1 1 4.93 19.07 10 10 0 0 1 19.07 4.93"/>
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
    </svg>
  ),
  Admin: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  ChevronLeft: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Logout: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { path: '/tickets/new', label: 'New Ticket', icon: Icons.NewTicket },
  { path: '/settings', label: 'Settings', icon: Icons.Settings },
  { path: '/admin', label: 'Admin', icon: Icons.Admin, adminOnly: true },
]

function Layout({ children }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, userRole, tenantName, tenantSlug } = useTenant();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalVariant, setAdminModalVariant] = useState('confirm');
  const [cmdOpen, setCmdOpen] = useState(false);

  // Collapsible sidebar state — persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebarCollapsed') === 'true'; } catch { return false; }
  });

  const toggleSidebar = () => setSidebarCollapsed(c => {
    const next = !c;
    localStorage.setItem('sidebarCollapsed', String(next));
    return next;
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const isAdminPath = location.pathname === '/admin';

  const handleAdminClick = (e) => {
    e.preventDefault();
    setAdminModalVariant(isAdmin ? 'confirm' : 'restricted');
    setShowAdminModal(true);
  };

  const handleAdminConfirm = () => {
    setShowAdminModal(false);
    navigate('/admin');
  };

  // Global Ctrl+K / Cmd+K listener for command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 64 : 220;

  // User avatar initials
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.primaryEmailAddress?.emailAddress?.[0] || 'U').toUpperCase();

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ── Collapsible Sidebar ── */}
      {isSignedIn && (
        <aside style={{
          width: sidebarWidth,
          minHeight: '100vh',
          background: 'rgba(5,6,15,0.8)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          zIndex: 40,
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139,92,246,0.4)',
                animation: 'pulse-glow 3s ease-in-out infinite',
              }}>
                <span style={{ color: 'white', fontSize: 16 }}>◆</span>
              </div>
              {!sidebarCollapsed && (
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  SaaS Tickets
                </span>
              )}
            </Link>
          </div>

          {/* Tenant pill */}
          {!sidebarCollapsed && (tenantName || tenantSlug) && (
            <div style={{
              margin: '0 12px 20px',
              padding: '10px 14px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#86efac', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tenantName || 'Loading...'}
              </span>
            </div>
          )}

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => {
              const active = item.path === '/admin' ? isAdminPath : isActive(item.path);
              const clickHandler = item.path === '/admin' ? handleAdminClick : undefined;
              const Tag = clickHandler ? 'button' : Link;
              const tagProps = clickHandler
                ? { onClick: clickHandler, style: {} }
                : { to: item.path, style: {} };

              const activeStyle = {
                color: '#a78bfa',
                background: 'rgba(139,92,246,0.12)',
                borderRadius: 10,
                position: 'relative',
              };

              return (
                <Tag
                  key={item.path}
                  {...tagProps}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: sidebarCollapsed ? '10px 0' : '10px 14px', borderRadius: 10, textDecoration: 'none',
                    ...(active ? activeStyle : { color: '#64748b' }),
                    transition: 'all 150ms',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    margin: '2px 8px',
                    width: 'calc(100% - 16px)',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: '60%', borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #a78bfa, #818cf8)',
                      boxShadow: '0 0 8px #a78bfa',
                    }} />
                  )}
                  <span style={{ flexShrink: 0, display: 'flex', opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  {!sidebarCollapsed && <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </Tag>
              );
            })}
          </nav>

          {/* Bottom: User + logout + toggle */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px' }}>
            {/* User info */}
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white',
                }}>
                  {initials}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.fullName || 'User'}
                  </div>
                  {userRole && (
                    <div style={{ color: '#475569', fontSize: 11, fontWeight: 500 }}>
                      {userRole}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              title={sidebarCollapsed ? 'Log out' : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: '9px 12px', borderRadius: 8, border: '1px solid transparent',
                background: 'transparent', color: 'rgba(148,163,184,0.7)', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, transition: 'all 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              {Icons.Logout}
              {!sidebarCollapsed && <span>Log out</span>}
            </button>

            {/* Collapse toggle */}
            <button
              onClick={toggleSidebar}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)', color: '#475569', cursor: 'pointer',
                fontSize: 12, marginTop: 6, transition: 'all 150ms',
              }}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              {sidebarCollapsed ? Icons.ChevronRight : Icons.ChevronLeft}
              {!sidebarCollapsed && <span style={{ marginLeft: 6 }}>Collapse</span>}
            </button>
          </div>
        </aside>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar (compact — tenant switcher + role + ⌘K hint) */}
        {isSignedIn && (
          <nav style={{
            height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', background: 'rgba(5,6,15,0.6)',
            backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky', top: 0, zIndex: 30,
          }}>
            {/* Replace existing search bar in navbar */}
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '8px 14px',
                color: '#475569', fontSize: 14, cursor: 'pointer',
                transition: 'all 150ms', minWidth: 220,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#94a3b8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#475569'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Search...</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '1px 6px', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>⌘</kbd>
                <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '1px 6px', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>K</kbd>
              </div>
            </button>

            {/* Right: TenantSwitcher + role + user */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TenantSwitcher />
              {userRole && <RoleBadge role={userRole} />}
            </div>
          </nav>
        )}

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>

      {/* Modals & floating elements */}
      {showAdminModal && (
        <AdminModeModal
          variant={adminModalVariant}
          onConfirm={handleAdminConfirm}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {isSignedIn && <VoiceAssistant mode="dashboard" />}

      {/* Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

export default Layout;
