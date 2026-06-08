import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootEl = document.getElementById('root')!;

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err: any) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;background:#000;display:flex;align-items:center;justify-content:center;font-family:monospace;color:#f87171;text-align:center;padding:2rem;">
      <div>
        <div style="font-size:2rem;margin-bottom:1rem;">💥</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:0.5rem;color:#F4F4F6;">অ্যাপ শুরু হয়নি</div>
        <pre style="font-size:0.72rem;color:#7A7A86;max-width:500px;white-space:pre-wrap;text-align:left;background:#111;padding:1rem;border-radius:12px;border:1px solid rgba(255,255,255,0.06);">${err?.message || 'Unknown error'}</pre>
      </div>
    </div>
  `;
}

// PWA: Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}
