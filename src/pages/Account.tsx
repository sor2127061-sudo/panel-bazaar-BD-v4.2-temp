/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN Account — editorial dark profile page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Transaction } from '../types';
import { User as UserIcon, RefreshCw, Copy, Check, LogOut, Settings, Award, History, TrendingUp, KeyRound, Loader2, Wallet, ShoppingBag } from 'lucide-react';

export default function Account() {
  const { user, balance, refreshBalance, updateProfileName } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bonusHistory, setBonusHistory] = useState<Transaction[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      setStatsLoading(true);
      const { data: completedOrders, error: ordersErr } = await supabase
        .from('orders').select('amount_paid').eq('user_id', user.id).eq('stat', 'completed');
      if (ordersErr) throw ordersErr;
      if (completedOrders) {
        setTotalOrders(completedOrders.length);
        setTotalSpent(completedOrders.reduce((sum, o) => sum + Number(o.amount_paid), 0));
      }
      const { data: txns, error: txnsErr } = await supabase
        .from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (txnsErr) throw txnsErr;
      if (txns) {
        setTransactions(txns);
        setBonusHistory(txns.filter(t => t.type === 'bonus'));
      }
    } catch (err: any) {
      showError('Failed to load user accounts and statistics!');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user) { setNewName(user.display_name || ''); fetchUserData(); }
  }, [user]);

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
      await fetchUserData();
      showSuccess('Balances and wallet records updated!');
    } catch { showError('Failed to refresh latest ledger!'); }
    finally { setRefreshing(false); }
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      await updateProfileName(newName.trim());
      showSuccess('Profile name updated successfully!');
    } catch (err: any) { showError(err.message || 'Failed to apply name changes!'); }
    finally { setSavingName(false); }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { showError('Password must be at least 6 characters long!'); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showSuccess('Password updated successfully!');
      setNewPassword('');
    } catch (err: any) { showError(err.message || 'Failed to update security password!'); }
    finally { setSavingPassword(false); }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccess('Sign out completed successfully.');
      navigate('/');
    } catch (err: any) { showError(err.message || 'Error signing out'); }
  };

  const referralLink = user ? `${window.location.origin}/register?ref=${user.id}` : '';
  const handleCopyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showSuccess('Referral invitation link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getMemberSince = () => {
    if (!user?.created_at) return 'Member';
    try {
      const d = new Date(user.created_at);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `Member since ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return 'Member'; }
  };

  if (!user) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const txnTypeCfg: Record<string, { cls: string }> = {
    topup:    { cls: 'badge-blue'   },
    purchase: { cls: 'badge-yellow' },
    bonus:    { cls: 'badge-green'  },
    refund:   { cls: 'badge-dim'    },
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '5.5rem 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* ── Profile Header ── */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 22, padding: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: 999,
              background: 'var(--accent-s)',
              border: '2px solid var(--accent-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)',
              boxShadow: '0 0 24px var(--accent-s)',
            }}>
              {user.display_name ? user.display_name.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                {user.display_name || user.email?.split('@')[0]}
              </h1>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', color: 'var(--text-mute)' }}>{user.email}</p>
              <span style={{
                display: 'inline-block', marginTop: '0.4rem',
                padding: '0.15rem 0.6rem',
                background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
                borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--font-mono)',
              }}>
                {getMemberSince()}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: 10,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <LogOut size={13} /> Log Out
          </button>
        </div>

        {/* ── Balance + Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Balance card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-s) 0%, var(--accent-s) 100%)',
            border: '1px solid var(--accent-g)',
            borderRadius: 20, padding: '1.25rem',
            gridColumn: 'span 2',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>
                  Wallet Balance
                </div>
                <div className="balance-glow">৳{balance.toLocaleString()}</div>
              </div>
              <button onClick={handleRefreshBalance} disabled={refreshing} style={{
                width: 34, height: 34, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-mute)',
              }}>
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => navigate('/add-fund')} className="btn-accent" style={{ flex: 1, fontSize: '0.75rem', padding: '0.6rem' }}>
                Add Funds
              </button>
              <button onClick={() => navigate('/')} className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', padding: '0.6rem' }}>
                Explore Store
              </button>
            </div>
          </div>

          {/* Stat: Orders */}
          <div style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '1.25rem',
          }}>
            <ShoppingBag size={18} color="var(--accent)" style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
              {statsLoading ? '—' : totalOrders}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-mute)', marginTop: 4 }}>Total Orders</div>
          </div>

          {/* Stat: Spent */}
          <div style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '1.25rem',
          }}>
            <TrendingUp size={18} color="#818cf8" style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
              {statsLoading ? '—' : `৳${totalSpent.toLocaleString()}`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-mute)', marginTop: 4 }}>Total Spent</div>
          </div>

          {/* Referral */}
          <div style={{
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '1.25rem',
          }}>
            <Award size={18} color="#fbbf24" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-mute)', marginBottom: 8 }}>Referral Link</div>
            <button onClick={handleCopyReferral} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 0.75rem',
              background: copiedLink ? 'var(--accent-s)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${copiedLink ? 'var(--accent-g)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, cursor: 'pointer',
              color: copiedLink ? 'var(--accent)' : 'var(--text-mute)',
              fontSize: '0.7rem', fontWeight: 700,
            }}>
              {copiedLink ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
            </button>
          </div>
        </div>

        {/* ── Settings ── */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.125rem 1.25rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', fontSize: '0.875rem', fontWeight: 700,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Settings size={16} color="var(--text-mute)" />
              Account Settings
            </div>
            <span style={{ color: 'var(--text-mute)', fontSize: '0.75rem', transform: settingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>

          {settingsOpen && (
            <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Change name */}
              <form onSubmit={handleSaveDisplayName} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}>
                  Display Name
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="lumen-input-plain" placeholder="Your display name" style={{ flex: 1 }} />
                  <button type="submit" disabled={savingName} className="btn-accent" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', flexShrink: 0 }}>
                    {savingName ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Save'}
                  </button>
                </div>
              </form>

              {/* Change password */}
              <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}>
                  New Password
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="lumen-input-plain" placeholder="Min 6 characters" style={{ flex: 1 }} />
                  <button type="submit" disabled={savingPassword} className="btn-ghost" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', flexShrink: 0 }}>
                    {savingPassword ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div style={{
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
        }}>
          <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={16} color="var(--text-mute)" />
            <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>Transaction History</h2>
          </div>

          {statsLoading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({length: 4}).map((_,i) => (
                <div key={i} className="sk" style={{ height: 56, borderRadius: 12 }} />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div>
              {transactions.slice(0, 20).map(txn => {
                const isDebit = txn.type === 'purchase';
                const cfg = txnTypeCfg[txn.type] || { cls: 'badge-dim' };
                return (
                  <div key={txn.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.025)',
                    gap: '0.75rem',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
                        <span className={`badge ${cfg.cls}`}>{txn.type}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)' }}>
                          #{txn.id.slice(0, 5).toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.note || 'Transaction'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: 2 }}>
                        {new Date(txn.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700,
                        color: isDebit ? '#f87171' : 'var(--accent)',
                      }}>
                        {isDebit ? '' : '+'}{Number(txn.amount).toLocaleString()} ৳
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)' }}>
                        Bal: ৳{Number(txn.balance_after).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-mute)', fontSize: '0.8rem' }}>
              No transactions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
