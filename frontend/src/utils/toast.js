import toast from 'react-hot-toast'

export const notify = {
  success: (msg) => toast.success(msg, {
    style: { background: '#0f172a', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
    iconTheme: { primary: '#4ade80', secondary: '#0f172a' },
    duration: 3500,
  }),
  error: (msg) => toast.error(msg, {
    style: { background: '#0f172a', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
    iconTheme: { primary: '#f87171', secondary: '#0f172a' },
    duration: 5000,
  }),
  loading: (msg) => toast.loading(msg, {
    style: { background: '#0f172a', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '12px', fontSize: '14px' },
  }),
  ai: (msg) => toast(msg, {
    icon: '✦',
    style: { background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
    duration: 4000,
  }),
  dismiss: (id) => toast.dismiss(id),
}
