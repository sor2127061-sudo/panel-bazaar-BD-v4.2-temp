/**
 * LUMEN ProductCard — Mobile-first poster card
 * Theme-aware: all colors via CSS variables, no hardcoded dark-only values
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  minPrice: number | null;
  hasStock: boolean;
  demoUrl: string | null;
}

export default function ProductCard({ product, minPrice, hasStock }: ProductCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      to={`/topup/${product.id}`}
      className="product-card"
      style={{
        display: 'flex', flexDirection: 'column', textDecoration: 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
      }}
    >
      {/* Poster image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-2)', flexShrink: 0 }}>
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=400&auto=format&fit=crop&q=70'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {/* Theme-aware gradient overlay */}
        <div className="product-card__overlay" />

        {/* Stock badge */}
        <div style={{ position: 'absolute', top: 7, right: 7 }}>
          {hasStock ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '0.15rem 0.45rem',
              background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 999, fontSize: '0.55rem', fontWeight: 700,
              color: '#10b981', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              <span style={{
                width: 4, height: 4, borderRadius: 999,
                background: '#10b981', boxShadow: '0 0 5px #10b981',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
              Stock
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', padding: '0.15rem 0.45rem',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 999, fontSize: '0.55rem', fontWeight: 700,
              color: '#f87171', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Soon
            </span>
          )}
        </div>
      </div>

      {/* Info panel */}
      <div style={{ padding: '0.6rem 0.65rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{
          fontWeight: 800, fontSize: '0.78rem', color: 'var(--text)',
          letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          {product.name}
        </div>
        <div style={{
          fontSize: '0.6rem', color: 'var(--text-mute)',
          fontFamily: 'var(--font-mono)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {product.category}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: '0.4rem',
          borderTop: '1px solid var(--line)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700,
            color: 'var(--accent)', textShadow: '0 0 14px var(--accent-s)',
          }}>
            ৳{minPrice !== null ? minPrice.toLocaleString() : '--'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: '0.25rem 0.5rem',
            background: hasStock ? 'var(--accent-s)' : 'var(--glass)',
            border: `1px solid ${hasStock ? 'var(--accent-g)' : 'var(--line-2)'}`,
            borderRadius: 8, fontSize: '0.6rem', fontWeight: 700,
            color: hasStock ? 'var(--accent)' : 'var(--text-faint)',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {hasStock ? <><Zap size={9} />Buy</> : 'N/A'}
          </div>
        </div>
      </div>
    </Link>
  );
}
