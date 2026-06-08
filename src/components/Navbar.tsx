import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Menu, X, Home, CreditCard, ShoppingBag, Key, User as UserIcon, LogOut, Package, RefreshCw, Send, Layers, Sun, Moon, Languages } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function Navbar() {
  const { user, dbUser, balance, refreshBalance, siteSettings } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { lang, t, toggle: toggleLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > lastY.current + 10 && y > 80) setHidden(true);
      else if (y < lastY.current - 8) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess('Logged out successfully');
      setIsOpen(false);
      navigate('/');
    } catch (err: any) { showError(err.message || 'Error signing out'); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try { await refreshBalance(); showSuccess('Balance updated'); }
    catch { showError('Failed to refresh balance'); }
    finally { setIsRefreshing(false); }
  };

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Admin link removed — accessible via /admin URL only
  const drawerLinks = [
    { label: t.home,          path: '/',               icon: <Home size={18} /> },
    { label: t.bundles,       path: '/bundles',        icon: <Package size={18} /> },
    ...(user ? [
      { label: t.funds,         path: '/add-fund',       icon: <CreditCard size={18} /> },
      { label: t.orders,        path: '/orders',         icon: <ShoppingBag size={18} /> },
      { label: t.keys,          path: '/codes',          icon: <Key size={18} /> },
      { label: t.stock_request, path: '/stock-request',  icon: <Send size={18} /> },
      { label: t.account,       path: '/account',        icon: <UserIcon size={18} /> },
    ] : []),
  ];

  const isDark = theme === 'dark';

  return (
    <>
      <nav className={`app-nav ${scrolled ? 'app-nav--scrolled' : ''} ${hidden ? 'app-nav--hidden' : ''}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none', flexShrink: 0 }}>
            {siteSettings?.site_logo_url
              ? <img src={siteSettings.site_logo_url} alt="Logo" style={{ height: 26, width: 26, borderRadius: 6, objectFit: 'cover' }} />
              : <div style={{ width: 28, height: 28, background: 'var(--accent-s)', border: '1px solid var(--accent-g)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={14} color="var(--accent)" strokeWidth={1.8} />
                </div>
            }
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {siteSettings?.site_name || 'Panel Bazaar BD'}
            </span>
          </Link>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              style={{ width: 34, height: 34, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0, transition: 'background 0.2s, color 0.2s', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-sans)' }}
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'লাইট মোড' : 'ডার্ক মোড'}
              style={{ width: 34, height: 34, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0, transition: 'background 0.2s, color 0.2s' }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {user ? (
              <>
                {/* Balance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.32rem 0.65rem', background: 'var(--accent-s)', border: '1px solid var(--accent-g)', borderRadius: 999 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>৳{(balance||0).toLocaleString()}</span>
                  <button onClick={handleRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1, color: 'var(--accent)', opacity: 0.7 }}>
                    <RefreshCw size={9} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

                {/* Hamburger */}
                <button onClick={() => setIsOpen(o => !o)} aria-label="Menu" style={{ width: 34, height: 34, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)', flexShrink: 0 }}>
                  {isOpen ? <X size={16} /> : <Menu size={16} />}
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <Link to="/login" className="btn-ghost" style={{ padding: '0.38rem 0.85rem', fontSize: '0.72rem', textDecoration: 'none' }}>{t.login}</Link>
                <Link to="/register" className="btn-accent" style={{ padding: '0.38rem 0.85rem', fontSize: '0.72rem', textDecoration: 'none' }}>{t.register}</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 56, right: 0, bottom: 0,
        width: 'min(290px, 84vw)', zIndex: 96,
        background: 'var(--bg-1)',
        backdropFilter: 'blur(28px) saturate(180%)',
        borderLeft: '1px solid var(--line)',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(0,0,0,0.2)',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom,0px)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
              {siteSettings?.site_name || 'Panel Bazaar BD'}
            </div>
            {user && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--text-mute)', marginTop: 2 }}>{user.email}</div>}
          </div>
          <button onClick={() => setIsOpen(false)} style={{ width: 30, height: 30, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}>
            <X size={15} />
          </button>
        </div>

        {/* Balance */}
        {user && (
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)' }}>Wallet</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)' }}>
              ৳{(balance||0).toLocaleString()}
            </div>
            <Link to="/add-fund" onClick={() => setIsOpen(false)} className="btn-accent" style={{ marginTop: '0.625rem', width: '100%', fontSize: '0.72rem', textDecoration: 'none', justifyContent: 'center', padding: '0.6rem' }}>
              + Add Funds
            </Link>
          </div>
        )}

        {/* Links */}
        <div style={{ flex: 1, padding: '0.5rem' }}>
          {drawerLinks.map(item => (
            <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.8rem 0.875rem', borderRadius: 11, marginBottom: 2,
              textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
              color: isActive(item.path) ? 'var(--accent)' : 'var(--text-dim)',
              background: isActive(item.path) ? 'var(--accent-s)' : 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}>
              <span style={{ color: isActive(item.path) ? 'var(--accent)' : 'var(--text-mute)' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--line)' }}>
          {user ? (
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.8rem', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <LogOut size={14} /> Log Out
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-ghost" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center', padding: '0.7rem' }}>Login</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="btn-accent" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center', padding: '0.7rem' }}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
