/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN ProductDetail — cinematic product purchase flow
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Product, Package, StockItem } from '../types';
import { ArrowLeft, ShieldCheck, Wallet, Zap, Coins, Copy, Check, Ticket, AlertTriangle, PackageCheck, PlayCircle } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, balance, refreshBalance } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { t } = useLang();

  // Extract YouTube/setup video URL from description
  const extractVideoId = (desc: string): string | null => {
    if (!desc) return null;
    const m = desc.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  };
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stockCounts, setStockCounts] = useState<{ [packageId: string]: number }>({});
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'auto'>('wallet');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [deliveredItem, setDeliveredItem] = useState<StockItem | null>(null);
  const [copying, setCopying] = useState<boolean>(false);

  useEffect(() => {
    async function loadProductDetails() {
      if (!id) return;
      try {
        setLoading(true);
        const { data: prodData, error: prodError } = await supabase.from('products').select('*').eq('id', id).single();
        if (prodError) throw prodError;
        setProduct(prodData);

        const { data: pkgData, error: pkgError } = await supabase.from('packages').select('*').eq('product_id', id).eq('is_active', true);
        if (pkgError) throw pkgError;
        setPackages(pkgData || []);

        const { data: stockData, error: stockError } = await supabase.from('stock_items').select('package_id').eq('is_sold', false);
        if (stockError) throw stockError;

        const counts: { [packageId: string]: number } = {};
        if (stockData) stockData.forEach((item: any) => { counts[item.package_id] = (counts[item.package_id] || 0) + 1; });
        setStockCounts(counts);

        if (pkgData && pkgData.length > 0) {
          const availablePkg = pkgData.find(p => (counts[p.id] || 0) > 0);
          setSelectedPackage(availablePkg || pkgData[0]);
        }
      } catch (err: any) {
        showError('Failed to load product details! Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadProductDetails();
  }, [id, showError]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    showInfo('This promo code is either expired or not applicable to this product category.');
    setPromoApplied(false);
  };

  const handlePurchase = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedPackage) { showError('Please select a purchase package to continue!'); return; }

    const price = Number(selectedPackage.price);
    const stockAvailable = stockCounts[selectedPackage.id] || 0;

    if (stockAvailable <= 0) { showError('This package is currently out of stock. Please wait or choose another package.'); return; }

    setPurchasing(true);
    let freshBalance = balance;
    try { freshBalance = await refreshBalance(); } catch (e) { console.warn('Error refreshing balance:', e); }

    if (freshBalance < price) {
      showError('Your wallet balance is insufficient! Please add funds to complete your purchase.');
      setPurchasing(false);
      return;
    }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('purchase_package', { package_id_param: selectedPackage.id });
      if (rpcError) throw rpcError;
      if (!rpcData) throw new Error('Purchase succeeded but no digital keys or credentials were returned.');
      showSuccess('Purchase completed successfully!');
      setDeliveredItem(rpcData);
      setPurchaseSuccess(true);
      await refreshBalance();
      setStockCounts(prev => ({ ...prev, [selectedPackage.id]: Math.max(0, (prev[selectedPackage.id] || 1) - 1) }));
    } catch (err: any) {
      showError(err.message || 'Failed to complete purchase! Please refresh your balance or stock details.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCopyCode = () => {
    if (!deliveredItem) return;
    let str = '';
    if (deliveredItem.item_type === 'key') str = deliveredItem.key_value || '';
    else if (deliveredItem.item_type === 'credentials') str = `USER: ${deliveredItem.username || ''} PASS: ${deliveredItem.password || ''}`;
    else str = deliveredItem.key_value || '';
    navigator.clipboard.writeText(str);
    setCopying(true);
    showSuccess('Credentials copied to clipboard!');
    setTimeout(() => setCopying(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '5.5rem 1.25rem 2rem' }}>
          <div className="sk" style={{ width: 140, height: 36, borderRadius: 10, marginBottom: '1.5rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '1.5rem' }}>
            <div className="sk" style={{ borderRadius: 22, aspectRatio: '4/5' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="sk" style={{ height: 36, borderRadius: 10, width: '70%' }} />
              <div className="sk" style={{ height: 60, borderRadius: 10 }} />
              <div className="sk" style={{ height: 120, borderRadius: 14 }} />
              <div className="sk" style={{ height: 54, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={40} color="#f87171" style={{ marginBottom: 12 }} />
          <p style={{ color: '#f87171', fontWeight: 700, marginBottom: 12 }}>Product not found!</p>
          <Link to="/" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <ArrowLeft size={14} /> Return to Market
          </Link>
        </div>
      </div>
    );
  }

  // ── Purchase Success Modal ──
  if (purchaseSuccess && deliveredItem) {
    let deliveryStr = '';
    if (deliveredItem.item_type === 'key') deliveryStr = deliveredItem.key_value || '';
    else if (deliveredItem.item_type === 'credentials') deliveryStr = `USER: ${deliveredItem.username || ''}\nPASS: ${deliveredItem.password || ''}`;
    else deliveryStr = deliveredItem.key_value || '';

    return (
      <div className="page-enter" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.25rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div className="glass-card--static" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 999,
              background: 'var(--accent-s)', border: '2px solid var(--accent-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 60px var(--accent-g)',
            }}>
              <PackageCheck size={38} color="var(--accent)" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Purchase Complete!
            </h1>
            <p style={{ color: 'var(--text-mute)', fontSize: '0.825rem', marginBottom: '1.5rem' }}>
              {t.key_delivered}
            </p>

            <div style={{
              background: 'var(--code-bg)', border: '1px solid var(--code-border)',
              borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                Activation Code · {deliveredItem.item_type}
              </div>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all', display: 'block', userSelect: 'all', whiteSpace: 'pre' }}>
                {deliveryStr}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={handleCopyCode} className={copying ? 'btn-accent' : 'btn-ghost'} style={{ flex: 1, fontSize: '0.8rem' }}>
                {copying ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/" className="btn-ghost" style={{ flex: 1, textDecoration: 'none', fontSize: '0.75rem' }}>Home</Link>
              <Link to="/codes" className="btn-accent" style={{ flex: 1, textDecoration: 'none', fontSize: '0.75rem' }}>My Keys</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedStock = selectedPackage ? (stockCounts[selectedPackage.id] || 0) : 0;

  return (
    <div className="page-enter" style={{ minHeight: '100vh', paddingBottom: '6rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '5.5rem 1.25rem 2rem' }}>

        {/* Back link */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.5rem 0.875rem',
          background: 'var(--back-btn-bg)', border: '1px solid var(--back-btn-border)',
          borderRadius: 10, color: 'var(--text-mute)', textDecoration: 'none',
          fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.5rem',
          transition: 'color 0.15s',
        }}>
          <ArrowLeft size={14} color="var(--accent)" /> Return to Gallery
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>

          {/* LEFT — Product image + description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: 'var(--card-bg)', backdropFilter: 'blur(16px)',
              border: '1px solid var(--card-border)', borderRadius: 22,
              overflow: 'hidden',
            }}>
              <div style={{ position: 'relative', aspectRatio: '16/10', background: 'var(--bg-2)' }}>
                <img
                  src={product.image_url || 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=600&auto=format&fit=crop&q=70'}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'var(--img-overlay)',
                }} />
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span style={{
                    padding: '0.2rem 0.65rem',
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999,
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                  }}>
                    {product.category}
                  </span>
                </div>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {product.name}
                </h1>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Authorized License Keys Store
                </p>

                {product.description && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {t.description}
                    </div>
                    <div style={{
                      fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.7,
                      background: 'var(--desc-bg)', border: '1px solid var(--desc-border)',
                      borderRadius: 12, padding: '1rem', whiteSpace: 'pre-line',
                    }}>
                      {product.description.replace(/https?:\/\/\S+/g, '').trim()}
                    </div>
                    {/* Setup video embed — extracted from description URL */}
                    {(() => {
                      const vid = extractVideoId(product.description);
                      if (!vid) return null;
                      return (
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <PlayCircle size={11} /> {t.setup_video}
                          </div>
                          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '16/9', background: '#000' }}>
                            <iframe
                              src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`}
                              title={t.setup_video}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div style={{
              display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            }}>
              {[
                { icon: <ShieldCheck size={13} />, label: t.genuine },
                { icon: <Zap size={13} />, label: t.instant_delivery },
                { icon: <Wallet size={13} />, label: t.wallet_payment },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.45rem 0.875rem',
                  background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
                  borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)',
                }}>
                  {icon} {label}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Purchase form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Balance display */}
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1.125rem',
                background: 'var(--accent-s)', border: '1px solid var(--accent-g)',
                borderRadius: 14,
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-mute)', fontWeight: 600 }}>Your Balance</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                  ৳{balance.toLocaleString()}
                </div>
              </div>
            )}

            {/* Package selection */}
            <div className="glass-card--static" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', marginBottom: '0.875rem' }}>
                Select Package
              </div>

              {packages.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-mute)', fontSize: '0.8rem' }}>
                  No packages available for this product.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {packages.map(pkg => {
                    const inStock = (stockCounts[pkg.id] || 0) > 0;
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        disabled={!inStock}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.875rem 1rem',
                          background: isSelected ? 'var(--accent-s)' : 'var(--pkg-btn-bg)',
                          border: `1px solid ${isSelected ? 'var(--accent-g)' : 'var(--pkg-btn-border)'}`,
                          borderRadius: 14, cursor: inStock ? 'pointer' : 'not-allowed',
                          opacity: inStock ? 1 : 0.5,
                          transition: 'all 0.18s',
                          width: '100%',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                            {pkg.days} Days
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-mute)', marginTop: 2 }}>
                            {inStock ? `${stockCounts[pkg.id]} in stock` : 'Out of stock'}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700,
                          color: isSelected ? 'var(--accent)' : 'var(--text)',
                        }}>
                          ৳{Number(pkg.price).toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Promo code */}
            <div className="glass-card--static" style={{ padding: '1.125rem' }}>
              <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="lumen-input-plain"
                  style={{ flex: 1, fontSize: '0.8125rem' }}
                />
                <button type="submit" className="btn-ghost" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', flexShrink: 0 }}>
                  <Ticket size={14} /> Apply
                </button>
              </form>
            </div>

            {/* Purchase summary + button */}
            {selectedPackage && (
              <div className="glass-card--static" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--purchase-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-mute)', fontWeight: 600 }}>
                    {product.name} · {selectedPackage.days} Days
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)' }}>
                    ৳{Number(selectedPackage.price).toLocaleString()}
                  </span>
                </div>

                {!user ? (
                  <Link to="/login" className="btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                    Login to Purchase
                  </Link>
                ) : selectedStock > 0 ? (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="btn-accent"
                    style={{ width: '100%', opacity: purchasing ? 0.7 : 1 }}
                  >
                    {purchasing ? (
                      <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: 999, animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                    ) : (
                      <><Zap size={15} /> Buy Now · ৳{Number(selectedPackage.price).toLocaleString()}</>
                    )}
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </button>
                ) : (
                  <button disabled className="btn-ghost" style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                    Out of Stock
                  </button>
                )}

                {user && balance < Number(selectedPackage?.price || 0) && selectedStock > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#fbbf24' }}>
                    <AlertTriangle size={12} />
                    Insufficient balance.{' '}
                    <Link to="/add-fund" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Add Funds →</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
