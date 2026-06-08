/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN TopupSuccess — cinematic payment result page
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckCircle, AlertTriangle, Loader2, ArrowRight, Wallet, Home } from 'lucide-react';

export default function TopupSuccess() {
  const [searchParams] = useSearchParams();
  const { user, refreshBalance, balance } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [verificationState, setVerificationState] = useState<'verifying' | 'completed' | 'pending_processing' | 'failed' | 'signature_mismatch'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [fetchedTxnId, setFetchedTxnId] = useState<string>('');
  const [fetchedAmount, setFetchedAmount] = useState<string>('');

  const txnId = searchParams.get('txn_id') || '';
  const amount = searchParams.get('amount') || '';
  const sessionId = searchParams.get('session_id') || '';

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyAndPoll() {
      if (!sessionId) {
        setVerificationState('failed');
        setErrorMessage('Required payment session identifier is missing from the URL.');
        return;
      }

      let attempts = 0;
      const maxAttempts = 15;

      async function checkForStatus() {
        if (!active) return;
        try {
          const { data, error } = await supabase
            .from('topup_sessions').select('*').eq('id', sessionId).single();
          if (error) console.warn('Session query warning:', error.message);
          if (data) {
            const status = data.status;
            if (data.txn_id) setFetchedTxnId(data.txn_id);
            if (data.amount) setFetchedAmount(String(data.amount));
            if (status === 'completed') {
              const freshBal = await refreshBalance();
              if (active) { setCurrentBalance(freshBal); setVerificationState('completed'); showSuccess('Current balance topped up successfully!'); }
              if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
              return;
            } else if (status === 'failed') {
              if (active) { setVerificationState('failed'); setErrorMessage('The gateway reported this payment session status as failed.'); }
              if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
              return;
            }
          }
          attempts++;
          if (attempts >= maxAttempts) {
            if (active) {
              setVerificationState('pending_processing');
              showInfo('Verifying your payment status. Please wait or refresh the page.');
              const fallbackBal = await refreshBalance();
              setCurrentBalance(fallbackBal);
            }
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          }
        } catch (e) { console.error('Error polling status:', e); }
      }

      await checkForStatus();
      if (active) { pollingTimerRef.current = setInterval(async () => { await checkForStatus(); }, 2000); }
    }

    if (user) verifyAndPoll();
    return () => {
      active = false;
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [user, sessionId, refreshBalance, showError, showSuccess, showInfo]);

  const displayTxnId = fetchedTxnId || txnId;
  const displayAmount = fetchedAmount || amount;
  const displayBalance = currentBalance !== null ? currentBalance : balance;

  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5rem 1.25rem 2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {verificationState === 'verifying' && (
          <div className="glass-card--static" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 999,
              background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Verifying Payment
            </h1>
            <p style={{ color: 'var(--text-mute)', fontSize: '0.8rem' }}>
              Please wait while we confirm your transaction with the payment gateway…
            </p>
          </div>
        )}

        {verificationState === 'completed' && (
          <div className="glass-card--static" style={{ padding: '2.5rem', textAlign: 'center' }}>
            {/* Success icon with glow */}
            <div style={{
              width: 80, height: 80, borderRadius: 999,
              background: 'var(--accent-s)', border: '2px solid var(--accent-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 60px var(--accent-g)',
            }}>
              <CheckCircle size={38} color="var(--accent)" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Payment Confirmed!
            </h1>
            <p style={{ color: 'var(--text-mute)', fontSize: '0.825rem', marginBottom: '2rem' }}>
              Your wallet has been topped up successfully.
            </p>

            {/* Balance display */}
            <div style={{
              background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
              borderRadius: 16, padding: '1.25rem', marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                New Balance
              </div>
              <div className="balance-glow">৳{(displayBalance || 0).toLocaleString()}</div>
              {displayAmount && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  +৳{displayAmount} added
                </div>
              )}
            </div>

            {displayTxnId && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: '1.5rem' }}>
                TXN ID: {displayTxnId}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/" className="btn-ghost" style={{ flex: 1, textDecoration: 'none', fontSize: '0.8rem' }}>
                <Home size={14} /> Home
              </Link>
              <Link to="/add-fund" className="btn-accent" style={{ flex: 1, textDecoration: 'none', fontSize: '0.8rem' }}>
                Add More <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {verificationState === 'pending_processing' && (
          <div className="glass-card--static" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 999,
              background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <AlertTriangle size={34} color="#fbbf24" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Processing…
            </h1>
            <p style={{ color: 'var(--text-mute)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Your payment is being processed. Balance will reflect within a few minutes.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/" className="btn-ghost" style={{ flex: 1, textDecoration: 'none', fontSize: '0.8rem' }}>Home</Link>
              <Link to="/account" className="btn-accent" style={{ flex: 1, textDecoration: 'none', fontSize: '0.8rem' }}>Check Balance</Link>
            </div>
          </div>
        )}

        {(verificationState === 'failed' || verificationState === 'signature_mismatch') && (
          <div className="glass-card--static" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 999,
              background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <AlertTriangle size={34} color="#f87171" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Payment Failed
            </h1>
            <p style={{ color: 'var(--text-mute)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/" className="btn-ghost" style={{ flex: 1, textDecoration: 'none', fontSize: '0.8rem' }}>Home</Link>
              <Link to="/add-fund" className="btn-accent" style={{ flex: 1, textDecoration: 'none', fontSize: '0.8rem' }}>Try Again</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
