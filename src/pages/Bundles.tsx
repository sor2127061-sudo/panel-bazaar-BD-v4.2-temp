/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN Bundles — custom bundle purchase page
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StockItem } from '../types';
import { Package, ShieldCheck, Zap, Coins, Check, Copy, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function Bundles() {
  const { user, balance, refreshBalance } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [deliveredItems, setDeliveredItems] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_bundles')
        .select(`
          *,
          bundle_components (
            id,
            package_id,
            packages:package_id (
              id,
              days,
              price,
              products:product_id (
                id,
                name,
                image_url
              )
            )
          )
        `)
        .eq('is_active', true);
      if (error) throw error;
      setBundles(data || []);
    } catch (err: any) {
      showError('Failed to load custom bundles list!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBundles(); }, []);

  const handleBuyBundle = async (bundle: any) => {
    if (!user) { navigate('/login'); return; }
    const price = Number(bundle.price);
    setPurchasingId(bundle.id);
    let freshBalance = balance;
    try { freshBalance = await refreshBalance(); } catch (e) { console.warn('Refresh err:', e); }
    if (freshBalance < price) {
      showError('Insufficient wallet balance! Please add funds to proceed.');
      setPurchasingId(null);
      return;
    }
    try {
      const components = bundle.bundle_components || [];
      if (components.length === 0) throw new Error('This bundle has no component items attached!');
      const claimedStockItems: StockItem[] = [];
      for (const comp of components) {
        const packageItem = comp.packages;
        if (!packageItem) throw new Error('Some package components in this bundle are currently inactive!');
        const { data: stockRecords, error: stockFetchErr } = await supabase
          .from('stock_items').select('*').eq('package_id', packageItem.id).eq('is_sold', false).limit(1);
        if (stockFetchErr || !stockRecords || stockRecords.length === 0)
          throw new Error(`Component "${packageItem.products?.name || 'license'}" is currently out of stock inside this bundle!`);
        claimedStockItems.push(stockRecords[0] as StockItem);
      }
      const newBalance = freshBalance - price;
      const { error: deductErr } = await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      if (deductErr) throw new Error(`Balance deduction failed: ${deductErr.message}`);
      for (const stockItem of claimedStockItems) {
        const { error: sellErr } = await supabase.from('stock_items')
          .update({ is_sold: true, sold_to: user.id, sold_at: new Date().toISOString() }).eq('id', stockItem.id);
        if (sellErr) {
          await supabase.from('users').update({ balance: freshBalance }).eq('id', user.id);
          throw new Error(`Stock assignment failed: ${sellErr.message}`);
        }
      }
      const { data: orderRow, error: orderErr } = await supabase
        .from('orders').insert([{ user_id: user.id, source: 'bundle', bundle_id: bundle.id, amount_paid: price, stat: 'completed', delivered_at: new Date().toISOString() }]).select().single();
      if (orderErr) console.warn('Logging bundle order err:', orderErr.message);
      const orderId = orderRow?.id;
      if (orderId) {
        await supabase.from('order_items').insert(claimedStockItems.map(stk => ({ order_id: orderId, stock_item_id: stk.id })));
      }
      await supabase.from('transactions').insert([{ user_id: user.id, type: 'purchase', amount: -price, balance_after: newBalance, note: `Purchased Bundle Pack: ${bundle.name}` }]);
      showSuccess('Bundle purchased successfully!');
      const deliveredList = claimedStockItems.map(stk => {
        const compObj = components.find((c: any) => c.package_id === stk.package_id);
        return { ...stk, product_name: compObj?.packages?.products?.name || 'Product Key' };
      });
      setDeliveredItems(deliveredList);
      setPurchaseSuccess(true);
      await refreshBalance();
    } catch (err: any) {
      showError(err.message || 'Processing of your bundle failed!');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleCopyCode = (idStr: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idStr);
    showSuccess('Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>
            Loading Bundles…
          </p>
        </div>
      </div>
    );
  }

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
            <Package size={20} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
              Custom Super Bundles
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-mute)' }}>
              Bundled license keys at reduced rates
            </p>
          </div>
        </div>

        {/* Purchase success */}
        {purchaseSuccess && deliveredItems.length > 0 && (
          <div style={{
            background: 'var(--accent-s)',
            border: '2px solid var(--accent-g)',
            borderRadius: 22, padding: '1.75rem', marginBottom: '2rem',
            boxShadow: '0 0 60px -10px var(--accent-s)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="#000" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>Bundle Acquired! 🎉</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-mute)' }}>Your genuine license keys are ready below.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deliveredItems.map(item => {
                let displayVal = '';
                if (item.item_type === 'key') displayVal = item.key_value || '';
                else if (item.item_type === 'credentials') displayVal = `USER: ${item.username || ''} PASS: ${item.password || ''}`;
                else displayVal = item.key_value || '';
                const isCopied = copiedId === item.id;
                return (
                  <div key={item.id} style={{
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, padding: '1rem',
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                      {item.product_name} · {item.item_type}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all', userSelect: 'all' }}>
                        {displayVal}
                      </code>
                      <button onClick={() => handleCopyCode(item.id, displayVal)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
                        background: isCopied ? 'var(--accent-s)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isCopied ? 'var(--accent-g)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 8, cursor: 'pointer',
                        color: isCopied ? 'var(--accent)' : 'var(--text-mute)',
                        fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {isCopied ? <><Check size={11} /> Done</> : <><Copy size={11} /> Copy</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Link to="/codes" className="btn-accent" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
                View All Keys
              </Link>
              <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* Bundle cards */}
        {bundles.length === 0 ? (
          <div className="empty-state">
            <div style={{
              width: 80, height: 80, borderRadius: 999,
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={32} color="var(--text-faint)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-dim)' }}>No bundles available</h3>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-mute)' }}>Check back soon for new bundle offerings.</p>
            </div>
            <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>Browse Products</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '1.25rem' }}>
            {bundles.map(bundle => {
              const components = bundle.bundle_components || [];
              const isPurchasing = purchasingId === bundle.id;
              return (
                <div key={bundle.id} style={{
                  background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 22,
                  overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                  {/* Top accent */}
                  <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), var(--accent))' }} />

                  <div style={{ padding: '1.5rem' }}>
                    {/* Bundle header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>
                          {bundle.name}
                        </h3>
                        {bundle.description && (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-mute)' }}>
                            {bundle.description}
                          </p>
                        )}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700,
                        color: 'var(--accent)', textShadow: '0 0 20px var(--accent-g)',
                        flexShrink: 0, marginLeft: '1rem',
                      }}>
                        ৳{Number(bundle.price).toLocaleString()}
                      </div>
                    </div>

                    {/* Components */}
                    {components.length > 0 && (
                      <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {components.map((comp: any) => {
                          const pkg = comp.packages;
                          const product = pkg?.products;
                          return (
                            <div key={comp.id} style={{
                              display: 'flex', alignItems: 'center', gap: '0.6rem',
                              padding: '0.5rem 0.75rem',
                              background: 'var(--accent-s)',
                              border: '1px solid var(--accent-s)',
                              borderRadius: 10,
                            }}>
                              {product?.image_url && (
                                <img src={product.image_url} alt={product.name} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} referrerPolicy="no-referrer" />
                              )}
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', flex: 1 }}>
                                {product?.name || 'Product'}
                              </span>
                              {pkg?.days && (
                                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>
                                  {pkg.days}d
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Buy button */}
                    {user ? (
                      <button
                        onClick={() => handleBuyBundle(bundle)}
                        disabled={isPurchasing}
                        className="btn-accent"
                        style={{ width: '100%', opacity: isPurchasing ? 0.7 : 1 }}
                      >
                        {isPurchasing ? (
                          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Purchasing…</>
                        ) : (
                          <><Zap size={15} /> Buy Bundle · ৳{Number(bundle.price).toLocaleString()}</>
                        )}
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      </button>
                    ) : (
                      <Link to="/login" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', width: '100%' }}>
                        Login to Purchase
                      </Link>
                    )}

                    {user && balance < Number(bundle.price) && (
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertCircle size={12} /> Insufficient balance.{' '}
                        <Link to="/add-fund" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Add Funds →</Link>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
