/**
 * BottomNav — বাংলা লেবেল, অ্যাডমিনে লুকানো
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { Home, CreditCard, ClipboardList, Key, UserCircle } from 'lucide-react';

export default function BottomNav() {
  const { user } = useAuth();
  const { t } = useLang();
  const location = useLocation();
  if (!user) return null;

  const tabs = [
    { label: t.home,    path: '/',          icon: Home },
    { label: t.funds,   path: '/add-fund',  icon: CreditCard },
    { label: t.orders,  path: '/orders',    icon: ClipboardList },
    { label: t.keys,    path: '/codes',     icon: Key },
    { label: t.account, path: '/account',   icon: UserCircle },
  ];

  return (
    <div className="bottom-nav" style={{ display: 'block' }}>
      <style dangerouslySetInnerHTML={{ __html: '@media(min-width:768px){.bottom-nav{display:none!important;}}' }} />
      <div style={{ display: 'flex', height: 60 }}>
        {tabs.map(({ label, path, icon: Icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <NavLink key={path} to={path} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              textDecoration: 'none',
              color: active ? 'var(--accent)' : 'var(--text-faint)',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.18s',
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 2, background: 'var(--accent)', borderRadius: '0 0 3px 3px',
                  boxShadow: '0 0 10px var(--accent-g)',
                }} />
              )}
              <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
              </div>
              <span style={{ fontSize: '0.52rem', fontWeight: active ? 700 : 500, lineHeight: 1, letterSpacing: '0.01em', maxWidth: 46, textAlign: 'center' }}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
