/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN StockRequest — glass form + history
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StockRequest as StockRequestType } from '../types';
import { PlusCircle, RefreshCw, Send, Loader2, Calendar, Inbox } from 'lucide-react';

export default function StockRequest() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [requests, setRequests] = useState<StockRequestType[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [productName, setProductName] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequestHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('stock_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data as StockRequestType[]) || []);
    } catch (err: any) {
      showError('Failed to load request history from database!');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchRequestHistory(); }, [user]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!productName.trim()) { showError('Please enter a product name first!'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('stock_requests').insert([{
        user_id: user.id,
        product_name: productName.trim(),
        note: note.trim() || null,
        stat: 'pending',
      }]);
      if (error) throw error;
      showSuccess('Your stock request has been submitted successfully!');
      setProductName('');
      setNote('');
      await fetchRequestHistory();
    } catch (err: any) {
      showError(err.message || 'Failed to submit stock request!');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch { return dateString; }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '5.5rem 1.25rem 2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PlusCircle size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Request Stock</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-mute)' }}>
              Product out of stock? Submit a request and we'll restock it shortly.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>

          {/* Form */}
          <div className="glass-card--static" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Send size={15} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>New Request</h3>
            </div>

            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  Product Name
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix Premium 1 Month"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="lumen-input-plain"
                />
              </div>

              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  Additional Notes (optional)
                </div>
                <textarea
                  placeholder="Any extra details about the request..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '0.875rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, color: 'var(--text)',
                    fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                    outline: 'none', resize: 'vertical',
                    transition: 'border-color 0.18s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-accent" style={{ width: '100%', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? (
                  <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                ) : (
                  <><Send size={14} /> Submit Request</>
                )}
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </button>
            </form>
          </div>

          {/* Request History */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Inbox size={15} color="var(--text-mute)" /> Request History
              </h3>
              <button onClick={fetchRequestHistory} style={{
                width: 30, height: 30, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-mute)',
              }}>
                <RefreshCw size={13} />
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {Array.from({length: 3}).map((_,i) => <div key={i} className="sk" style={{ height: 80, borderRadius: 14 }} />)}
              </div>
            ) : requests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {requests.map(req => (
                  <div key={req.id} style={{
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: req.note ? '0.5rem' : 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)', flex: 1 }}>
                        {req.product_name}
                      </div>
                      <span className={`badge ${req.stat === 'done' ? 'badge-green' : 'badge-yellow'}`}>
                        <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
                        {req.stat === 'done' ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    {req.note && (
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-mute)' }}>{req.note}</p>
                    )}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)' }}>
                      {formatDate(req.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '2.5rem', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.07)',
                borderRadius: 16,
              }}>
                <Inbox size={28} color="var(--text-faint)" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-mute)', margin: 0 }}>No requests submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
