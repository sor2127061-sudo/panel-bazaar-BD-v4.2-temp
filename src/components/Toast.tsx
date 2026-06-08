import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps { toasts: ToastMessage[]; onDismiss: (id: string) => void; }

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div style={{ position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none', width: 'min(420px, 92vw)' }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />)}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => { const t = setTimeout(() => onDismiss(toast.id), 4000); return () => clearTimeout(t); }, [toast.id, onDismiss]);
  const cfg = {
    success: { icon: <CheckCircle2 size={16} color="#10b981" />, border: 'rgba(16,185,129,0.25)', glow: 'rgba(16,185,129,0.15)' },
    error:   { icon: <AlertCircle  size={16} color="#f87171" />, border: 'rgba(239,68,68,0.25)',  glow: 'rgba(239,68,68,0.12)' },
    info:    { icon: <Info         size={16} color="#818cf8" />, border: 'rgba(99,102,241,0.25)', glow: 'rgba(99,102,241,0.12)' },
  }[toast.type];
  return (
    <motion.div layout initial={{ opacity: 0, y: 20, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.94, transition: { duration: 0.18 } }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} style={{ pointerEvents: 'auto', width: '100%' }}>
      <div className="toast-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(7,8,10,0.94)', border: `1px solid ${cfg.border}`, boxShadow: `0 8px 32px -4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)` }}>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: cfg.glow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.icon}</div>
        <span style={{ flex: 1, fontSize: '0.8375rem', fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{toast.message}</span>
        <button onClick={() => onDismiss(toast.id)} style={{ width: 24, height: 24, background: 'none', border: 'none', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)', flexShrink: 0 }}><X size={13} /></button>
      </div>
    </motion.div>
  );
}
