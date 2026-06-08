/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN Orders — glass cards with status badges
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order } from '../types';
import { ClipboardList, ShoppingBag, ArrowRight, Loader2, Calendar, CreditCard } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const { showError } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserOrders() {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            source,
            package_id,
            bundle_id,
            amount_paid,
            status:stat,
            created_at,
            delivered_at,
            packages:package_id (
              days,
              price,
              product_id,
              products:product_id (
                name,
                image_url
              )
            ),
            custom_bundles:bundle_id (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data as any[]) || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        showError('Failed to load orders from database!');
      } finally {
        setLoading(false);
      }
    }
    loadUserOrders();
  }, [user, showError]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch { return dateString; }
  };

  const statusCfg = {
    pending:   { label: 'Pending',   cls: 'badge-yellow' },
    completed: { label: 'Delivered', cls: 'badge-green'  },
    delivered: { label: 'Delivered', cls: 'badge-green'  },
    cancelled: { label: 'Cancelled', cls: 'badge-dim'    },
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>
            Loading orders…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '5.5rem 1.25rem 2rem' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ClipboardList size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              My Orders
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-mute)' }}>
              All purchases and order history
            </p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {orders.map((order) => {
              let productName = '';
              let coverUrl = '';
              let daysStr = '';

              if (order.source === 'bundle' && order.custom_bundles) {
                productName = order.custom_bundles.name || 'Custom Bundle';
                daysStr = 'Package Bundle';
              } else if (order.packages) {
                const pkg = order.packages as any;
                productName = pkg.products?.name || 'Product';
                coverUrl = pkg.products?.image_url || '';
                daysStr = `${pkg.days} Days Validity`;
              } else {
                productName = 'Digital Item';
              }

              const displayId = order.id.slice(-5).toUpperCase();
              const cfg = (statusCfg as any)[order.status] || { label: order.status, cls: 'badge-dim' };

              return (
                <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 18,
                  padding: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem', flexWrap: 'wrap',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Left side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      overflow: 'hidden', flexShrink: 0,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {coverUrl ? (
                        <img src={coverUrl} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                      ) : (
                        <ShoppingBag size={18} color="var(--text-mute)" />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                          #ORDER-{displayId}
                        </span>
                        <span style={{ color: 'var(--text-faint)', fontSize: '0.6rem' }}>·</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)' }}>
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div style={{
                        fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {productName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
                        {daysStr}
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                      ৳{Number(order.amount_paid).toLocaleString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${cfg.cls}`}>
                        <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor' }} />
                        {cfg.label}
                      </span>
                      {order.status === 'pending' && (
                        <Link to="/add-fund" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '0.2rem 0.6rem',
                          background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.25)',
                          borderRadius: 999, textDecoration: 'none',
                          fontSize: '0.6rem', fontWeight: 700, color: '#fbbf24',
                          fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          <CreditCard size={9} /> Pay Now
                        </Link>
                      )}
                    </div>
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
              <ShoppingBag size={32} color="var(--text-faint)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-dim)' }}>
                No orders yet
              </h3>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                You haven't purchased any keys or subscriptions yet.
              </p>
            </div>
            <Link to="/" className="btn-accent" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
              Browse Store <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
