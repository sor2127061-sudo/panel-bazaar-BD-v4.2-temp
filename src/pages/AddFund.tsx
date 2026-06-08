/**
 * LUMEN AddFund — Mobile-first topup page
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { Coins, ChevronRight, Loader2, Info, ShieldAlert } from 'lucide-react';

export default function AddFund() {
  const { balance } = useAuth();
  const { showSuccess, showError } = useToast();
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const presets = [50, 100, 200, 300, 500, 1000];

  const handleProceedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10) { showError('Minimum recharge amount is ৳10!'); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');
      const response = await fetch('https://wwtsltimoaqgmbvsfbfv.supabase.co/functions/v1/create-topup-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      if (!response.ok) {
        const e2 = await response.json().catch(() => ({}));
        throw new Error(e2.message || e2.error || `Server error (${response.status})`);
      }
      const data = await response.json();
      if (data?.checkout_url) { showSuccess('Redirecting to payment...'); window.location.href = data.checkout_url; }
      else throw new Error('Checkout URL not received!');
    } catch (err: any) { showError(err.message || 'Payment session failed!'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-enter page-wrap">
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '1.25rem 1rem 2rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(16,185,129,0.15)', marginBottom: '0.875rem' }}>
            <Coins size={24} color="#10b981" strokeWidth={1.6} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Add Funds</h1>
          <p style={{ color: 'var(--text-mute)', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>bKash · Nagad · Rocket</p>
        </div>

        {/* Balance */}
        <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(16,185,129,0.03) 100%)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 18, padding: '1.125rem', textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>Current Balance</div>
          <div className="balance-glow">৳{(balance || 0).toLocaleString()}</div>
        </div>

        <form onSubmit={handleProceedPayment}>
          <div className="glass-card--static" style={{ padding: '1.125rem' }}>

            {/* Presets — 3 per row */}
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.6rem', fontFamily: 'var(--font-mono)' }}>Quick Select</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {presets.map(p => (
                <button key={p} type="button" onClick={() => setAmount(p)} className={`preset-btn ${amount === p ? 'active' : ''}`}>
                  ৳{p}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>Custom Amount</div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>৳</span>
              <input
                type="number" inputMode="numeric" min={10}
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter amount (min ৳10)"
                className="lumen-input-plain"
                style={{ paddingLeft: '1.75rem' }}
              />
            </div>

            {/* Info */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.625rem 0.75rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, marginBottom: '1rem' }}>
              <Info size={13} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-mute)', lineHeight: 1.5 }}>Balance updates automatically after payment. Contact support if it takes over 5 minutes.</span>
            </div>

            <button type="submit" disabled={loading || !amount || Number(amount) < 10} className="btn-accent" style={{ width: '100%', opacity: (loading || !amount || Number(amount) < 10) ? 0.5 : 1, fontSize: '0.875rem', padding: '0.875rem' }}>
              {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <>Proceed to Payment <ChevronRight size={15} /></>}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '1rem', fontSize: '0.68rem', color: 'var(--text-faint)' }}>
          <ShieldAlert size={11} /> Secured payment · Panel Bazaar BD
        </div>
      </div>
    </div>
  );
}
