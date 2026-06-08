import React, { useEffect, useRef, useState } from 'react';
import { Layers, X, Download, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const fn = (e: MouseEvent) => {
      el.style.setProperty('--cx', `${e.clientX}px`);
      el.style.setProperty('--cy', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, []);
  return <div ref={ref} className="cursor-spotlight" aria-hidden />;
}

function AmbientMesh() {
  return (
    <div className="lumen-mesh" aria-hidden>
      <div className="lumen-mesh__a" />
      <div className="lumen-mesh__b" />
      <div className="lumen-mesh__c" />
    </div>
  );
}

const SPLASH_KEY = 'pb_splash_v2';

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  const { siteSettings } = useAuth();
  useEffect(() => {
    const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 500); }, 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`app-splash ${exiting ? 'splash-exit' : ''}`}>
      <div className="app-splash__logo" style={{ overflow: 'hidden' }}>
        {siteSettings?.site_logo_url ? (
          <img 
            src={siteSettings.site_logo_url} 
            alt="Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
          />
        ) : (
          <Layers size={28} color="var(--accent)" strokeWidth={1.6} />
        )}
      </div>
      <div className="app-splash__title">{siteSettings?.site_name || 'Panel Bazaar BD'}</div>
      <div className="app-splash__loader" />
    </div>
  );
}

/** PWA install banner */
function InstallBanner() {
  const { t } = useLang();
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [notifShow, setNotifShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      const dismissed = sessionStorage.getItem('pb_install_dismissed');
      if (!dismissed) setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  // Notification prompt — show after install dismissed or after 8s
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const t = setTimeout(() => setNotifShow(true), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      sessionStorage.setItem('pb_install_dismissed', '1');
    }
  };

  const requestNotif = async () => {
    setNotifShow(false);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Panel Bazaar BD', {
          body: 'নতুন স্টক ও অফারের নোটিফিকেশন চালু হয়েছে ✅',
          icon: '/icon-192.png',
        });
      }
    } catch {}
  };

  const bannerStyle: React.CSSProperties = {
    position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 300,
    background: 'var(--modal-bg)', border: '1px solid var(--line-2)',
    borderRadius: 16, padding: '1rem',
    boxShadow: '0 8px 32px -4px rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', gap: '0.875rem',
    animation: 'mob-in 0.4s cubic-bezier(0.34,1.2,0.64,1) forwards',
    backdropFilter: 'blur(20px)',
  };

  return (
    <>
      {show && (
        <div style={bannerStyle}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-s)', border: '1px solid var(--accent-g)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Download size={18} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>{t.install_app}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-mute)', marginTop: 2 }}>{t.install_desc}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            <button onClick={() => { setShow(false); sessionStorage.setItem('pb_install_dismissed', '1'); }} style={{ width: 30, height: 30, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}>
              <X size={14} />
            </button>
            <button onClick={install} className="btn-accent" style={{ padding: '0.4rem 0.875rem', fontSize: '0.72rem', borderRadius: 9 }}>
              {t.install_btn}
            </button>
          </div>
        </div>
      )}

      {notifShow && !show && (
        <div style={{ ...bannerStyle, bottom: 80 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={18} color="#6366f1" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>{t.notif_title}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-mute)', marginTop: 2 }}>{t.notif_desc}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            <button onClick={() => setNotifShow(false)} style={{ width: 30, height: 30, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}>
              <X size={14} />
            </button>
            <button onClick={requestNotif} style={{ padding: '0.4rem 0.875rem', fontSize: '0.72rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700 }}>
              {t.notif_allow}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function LumenShell({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem(SPLASH_KEY); } catch { return true; }
  });
  const done = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}
    setShowSplash(false);
  };
  return (
    <>
      <AmbientMesh />
      <CursorSpotlight />
      {showSplash && <SplashScreen onDone={done} />}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
      <InstallBanner />
    </>
  );
}
