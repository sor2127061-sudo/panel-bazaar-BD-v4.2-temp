/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN MyKeys — glass key vault display
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Key, ShieldCheck, Copy, Check, ExternalLink, Loader2, RefreshCw, Layers } from 'lucide-react';

export default function MyKeys() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPurchasedCodes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          amount_paid,
          stat,
          packages:package_id (
            days,
            products:product_id (
              name
            )
          ),
          custom_bundles:bundle_id (
            name
          ),
          order_items (
            stock_items:stock_item_id (
              id,
              item_type,
              key_value,
              username,
              password
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('stat', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error loading purchased items:', err);
      showError('Failed to load purchased keys and codes!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPurchasedCodes(); }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch { return dateString; }
  };

  const getDeliverableContent = (stockItem: any) => {
    if (!stockItem) return 'No license data available';
    if (stockItem.item_type === 'key') return stockItem.key_value || 'Key not found';
    if (stockItem.item_type === 'credentials') return `USER: ${stockItem.username || ''} PASS: ${stockItem.password || ''}`;
    if (stockItem.item_type === 'custom') return stockItem.key_value || 'No info available';
    return stockItem.key_value || '';
  };

  const handleCopy = (itemId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(itemId);
    showSuccess('Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color="#10b981" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>
            Loading keys…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '5.5rem 1.25rem 2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Key size={20} color="#10b981" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                My Keys & Licenses
              </h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-mute)' }}>
                All purchased codes, credentials and license keys
              </p>
            </div>
          </div>
          <button
            onClick={fetchPurchasedCodes}
            style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-mute)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {items.map((order) => {
              let packLabel = '';
              let productName = '';
              let pkgDays: number | null = null;

              if (order.packages) {
                const pkg = order.packages;
                productName = pkg.products?.name || 'Product';
                pkgDays = pkg.days;
                packLabel = `${productName} — ${pkg.days} Days Validity`;
              } else if (order.custom_bundles) {
                productName = order.custom_bundles.name || 'Custom Bundle';
                packLabel = `${productName} (Custom Bundle)`;
              } else {
                productName = 'Digital License Pack';
                packLabel = 'Digital License Pack';
              }

              const orderItemsList = order.order_items || [];

              return (
                <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 22,
                  padding: '1.5rem',
                }}>
                  {/* Order meta header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    paddingBottom: '1rem', marginBottom: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    flexWrap: 'wrap', gap: '0.75rem',
                  }}>
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '0.2rem 0.6rem',
                          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: 999, fontSize: '0.6rem', fontWeight: 700,
                          fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: '#10b981',
                        }}>
                          📍 {productName}
                        </span>
                        {pkgDays !== null && (
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 999, fontSize: '0.6rem', fontWeight: 700,
                            fontFamily: 'var(--font-mono)', color: 'var(--text-mute)',
                          }}>
                            ⏱ {pkgDays} Days
                          </span>
                        )}
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 999, fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)', color: 'var(--text-faint)',
                        }}>
                          📅 {formatDate(order.created_at)}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                        {packLabel}
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className="badge badge-green" style={{ display: 'inline-flex', marginBottom: 4 }}>
                        <ShieldCheck size={9} /> Delivered
                      </span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-mute)', marginTop: 2 }}>
                        ৳{Number(order.amount_paid).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Keys */}
                  {orderItemsList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {orderItemsList.map((itemObj: any, index: number) => {
                        const stockItem = itemObj.stock_items;
                        if (!stockItem) return null;
                        const deliveryVal = getDeliverableContent(stockItem);
                        const keyId = `${order.id}-${stockItem.id}`;
                        const isCopied = copiedId === keyId;
                        const displayIdx = orderItemsList.length > 1 ? ` (Item ${index + 1})` : '';

                        return (
                          <div key={stockItem.id}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                              Activation Code{displayIdx} · {stockItem.item_type}
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '0.75rem',
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 14, padding: '0.875rem 1rem',
                            }}>
                              <code style={{
                                flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
                                fontWeight: 600, color: '#10b981', wordBreak: 'break-all',
                                userSelect: 'all',
                              }}>
                                {deliveryVal}
                              </code>
                              <button
                                onClick={() => handleCopy(keyId, deliveryVal)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '0.45rem 0.85rem',
                                  background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: 10, cursor: 'pointer',
                                  color: isCopied ? '#10b981' : 'var(--text-mute)',
                                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
                                  transition: 'all 0.2s', flexShrink: 0,
                                }}
                              >
                                {isCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '1rem', textAlign: 'center',
                      background: 'rgba(0,0,0,0.3)', borderRadius: 12,
                      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-mute)',
                    }}>
                      No delivery content available.
                    </div>
                  )}

                  {/* Feedback row */}
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'flex-end' }}>
                    <a href="https://m.me/" target="_blank" rel="noopener noreferrer" style={{
                      fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-mute)',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      Write Review 💬
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{
              width: 80, height: 80, borderRadius: 999,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Key size={32} color="var(--text-faint)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-dim)' }}>
                No keys found
              </h3>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                Purchase products to see your license keys and codes here.
              </p>
            </div>
            <Link to="/" className="btn-accent" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
              Explore Store
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
