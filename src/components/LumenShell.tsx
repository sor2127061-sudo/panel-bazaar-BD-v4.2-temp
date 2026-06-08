import React, { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';

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
  useEffect(() => {
    const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 500); }, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`app-splash ${exiting ? 'splash-exit' : ''}`}>
      <div className="app-splash__logo">
        <Layers size={28} color="var(--accent)" strokeWidth={1.6} />
      </div>
      <div className="app-splash__title">Panel Bazaar BD</div>
      <div className="app-splash__loader" />
    </div>
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
    </>
  );
}
