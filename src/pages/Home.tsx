/**
 * LUMEN Home — Mobile-first cinematic hero + product catalog
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product, Package, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { useToast } from '../context/ToastContext';
import { Search, Zap, ShieldCheck, Award, ShoppingCart, AlertCircle } from 'lucide-react';

export default function Home() {
  const { showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stockCounts, setStockCounts] = useState<{ [k: string]: number }>({});
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (!error && data) {
        setCategories(['All', ...data.map((c: Category) => c.name)]);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [{ data: p, error: pe }, { data: pk, error: pke }, { data: s, error: se }] = await Promise.all([
          supabase.from('products').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('packages').select('*').eq('is_active', true),
          supabase.from('stock_items').select('package_id').eq('is_sold', false),
        ]);
        if (pe) throw pe; if (pke) throw pke; if (se) throw se;
        const counts: { [k: string]: number } = {};
        s?.forEach((i: any) => { counts[i.package_id] = (counts[i.package_id] || 0) + 1; });
        setProducts(p || []); setPackages(pk || []); setStockCounts(counts);
      } catch (err: any) { showError('Failed to load catalog. Please refresh.'); }
      finally { setIsLoading(false); }
    }
    load();
  }, [showError]);

  const productMetrics = useMemo(() => {
    const m: { [id: string]: { minPrice: number | null; hasStock: boolean } } = {};
    products.forEach(prod => {
      const pkgs = packages.filter(pk => pk.product_id === prod.id);
      let minPrice: number | null = null; let hasStock = false;
      pkgs.forEach(pk => {
        if (minPrice === null || pk.price < minPrice) minPrice = Number(pk.price);
        if ((stockCounts[pk.id] || 0) > 0) hasStock = true;
      });
      m[prod.id] = { minPrice, hasStock };
    });
    return m;
  }, [products, packages, stockCounts]);

  const extractYoutubeLink = (desc: string) => {
    if (!desc) return null;
    const m = desc.match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+)/);
    return m ? m[0] : null;
  };

  const filtered = useMemo(() =>
    products.filter(p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
    ), [products, searchQuery, activeCategory]);

  return (
    <div className="page-enter page-wrap">

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(1.5rem,5vw,4rem) 1rem clamp(1.25rem,4vw,3rem)', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '80vmax', height: '30vmax', background: 'radial-gradient(ellipse,var(--accent-s) 0%,transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'var(--accent-s)', border: '1px solid var(--accent-g)', borderRadius: 999, marginBottom: '1rem' }}>
            <Zap size={10} color="var(--accent)" />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>Instant Digital Delivery</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1.75rem,6vw,3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1, margin: '0 0 0.75rem' }}>
            Panel Bazaar{' '}
            <span className="gradient-text-accent">BD</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.78rem,2vw,0.9rem)', color: 'var(--text-mute)', maxWidth: 400, margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
            Premium streaming panels & digital keys — delivered instantly.
          </p>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[{ icon: <ShieldCheck size={12} />, l: 'Genuine' }, { icon: <Zap size={12} />, l: 'Instant' }, { icon: <Award size={12} />, l: 'Trusted' }].map(({ icon, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-mute)', fontWeight: 500 }}>
                <span style={{ color: 'var(--accent)' }}>{icon}</span> {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ padding: '0 1rem', marginBottom: '1.25rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
          <input
            type="search"
            placeholder="Search products…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="lumen-input-plain"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Category pills — horizontal scroll */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-none">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}>
              {cat === 'All' ? 'All' : cat}
            </button>
          ))}
          <Link to="/bundles" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: 'var(--accent-s)', border: '1px dashed var(--accent-g)', borderRadius: 999, color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <ShoppingCart size={10} /> Bundles
          </Link>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <div style={{ padding: '0 1rem' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sk" style={{ borderRadius: 20, aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-g)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>
                {activeCategory === 'All' ? 'All Products' : activeCategory}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '0.7rem', color: 'var(--text-mute)', marginLeft: '0.4rem' }}>{filtered.length}</span>
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: '0.75rem',
            }}>
              {/* 3 columns on wider mobile / tablet */}
              <style>{`@media(min-width:480px){.prod-grid{grid-template-columns:repeat(3,1fr)!important;}}@media(min-width:768px){.prod-grid{grid-template-columns:repeat(4,1fr)!important;gap:1rem!important;}}`}</style>
              {filtered.map(product => {
                const m = productMetrics[product.id] || { minPrice: null, hasStock: false };
                return <ProductCard key={product.id} product={product} minPrice={m.minPrice} hasStock={m.hasStock} demoUrl={extractYoutubeLink(product.description)} />;
              })}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <AlertCircle size={36} color="var(--text-faint)" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-dim)', fontSize: '0.9rem' }}>Nothing found</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-mute)' }}>Try different keywords or clear filters.</p>
            </div>
            {(searchQuery || activeCategory !== 'All') && (
              <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.5rem 1.1rem' }}>
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
