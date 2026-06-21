import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Trophy,
  Settings,
  LogOut,
  Leaf,
  Menu,
  X,
  Bot,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import ParticleBackground from '@/components/ParticleBackground'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assessment', icon: ClipboardList, label: 'Assessment' },
  { to: '/chat', icon: MessageSquare, label: 'AI Coach' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/assessment', icon: ClipboardList, label: 'Assess' },
  { to: '/chat', icon: Bot, label: 'AI Coach' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      logout()
      navigate('/login')
    }
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Translucent Glowing Morphism Background Blobs */}
      <div className="glass-glow-blob blob-1" />
      <div className="glass-glow-blob blob-2" />
      <div className="glass-glow-blob blob-3" />

      {/* Floating Eco-Friendly Particles (Leaves and Circles) */}
      <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
        <ParticleBackground count={15} />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 99, backdropFilter: 'blur(8px)',
          }}
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with Glassmorphic styling */}
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        aria-label="Main navigation"
        style={{
          width: 240, minHeight: '100vh',
          background: 'rgba(13, 17, 23, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0,
          flexShrink: 0, zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3FB950, #26a641)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(63,185,80,0.4)',
            flexShrink: 0,
          }} className="leaf-spin-hover">
            <Leaf size={18} color="#07090D" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              EcoMentor
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', fontWeight: 600 }}>AI COACH</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'none', padding: '0.25rem' }}
            className="mobile-close-btn"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-nav-item scale-hover ${isActive ? 'active' : ''}`}
              aria-label={label}
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} aria-hidden="true" style={{ transition: 'transform 0.3s ease' }} />
                  {label}
                  {isActive && <span className="sr-only"> (current page)</span>}
                  {label === 'AI Coach' && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.3)',
                      borderRadius: 10, padding: '0.1rem 0.4rem',
                      fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      display: 'flex', alignItems: 'center', gap: '0.15rem',
                      boxShadow: '0 0 10px rgba(63,185,80,0.2)',
                    }}>
                      <Sparkles size={8} />
                      AI
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout Panel */}
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: '#07090D',
                flexShrink: 0, boxShadow: '0 0 10px rgba(88,166,255,0.3)',
              }}>
                {userInitial}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.city || user.email}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{ color: 'var(--danger)', justifyContent: 'flex-start' }}
            aria-label="Log out"
            id="btn-logout"
          >
            <LogOut size={16} aria-hidden="true" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main
        id="main-content"
        role="main"
        className="app-main"
        style={{ flex: 1, overflowY: 'auto', minWidth: 0, zIndex: 1 }}
        tabIndex={-1}
      >
        {/* Mobile top bar with glass blur */}
        <div style={{
          display: 'none', alignItems: 'center', gap: '1rem',
          padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}
          className="mobile-topbar"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.25rem' }}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3FB950, #26a641)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Leaf size={14} color="#07090D" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              EcoMentor <span style={{ color: 'var(--primary)' }}>AI</span>
            </span>
          </div>
        </div>

        <div style={{ padding: '2rem', maxWidth: 1400 }}>
          {children}
        </div>

        {/* Mobile bottom navigation */}
        <nav
          className="mobile-bottom-nav"
          style={{ display: 'none' }}
          aria-label="Mobile navigation"
        >
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.5rem 0.75rem',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.65rem',
                fontWeight: 500,
                transition: 'color 0.15s',
                flex: 1,
              })}
              aria-label={label}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            left: -100% !important;
            transition: left 0.25s ease !important;
          }
          .sidebar.open { left: 0 !important; }
          .mobile-backdrop { display: block !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-close-btn { display: block !important; }
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(13,17,23,0.92);
            border-top: 1px solid rgba(255,255,255,0.06);
            backdrop-filter: blur(20px);
            z-index: 50;
            padding: 0.25rem 0;
            padding-bottom: env(safe-area-inset-bottom, 0.25rem);
          }
          .app-main > div { padding-bottom: 5rem !important; }
          .page-content { padding: 1rem; }
        }
      `}</style>
    </div>
  )
}
