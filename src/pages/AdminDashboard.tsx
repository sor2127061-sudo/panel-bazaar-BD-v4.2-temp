/**
 * Admin Dashboard — fully mobile responsive
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Product, Package, StockItem, Order, StockRequest as StockReqType, Category } from '../types';
import { Settings, Package as Pkg, Database, ShoppingBag, HelpCircle, Sparkles, Plus, Edit2, Trash2, RefreshCw, Save, X, BarChart3, Layers, CheckCircle, Tag } from 'lucide-react';

type Tab = 'overview' | 'products' | 'categories' | 'packages' | 'stock' | 'orders' | 'requests' | 'branding';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',    label: 'Overview',    icon: <BarChart3 size={15} /> },
  { key: 'products',    label: 'Products',    icon: <Layers size={15} /> },
  { key: 'categories',  label: 'Categories',  icon: <Tag size={15} /> },
  { key: 'packages',    label: 'Packages',    icon: <Pkg size={15} /> },
  { key: 'stock',       label: 'Stock',       icon: <Database size={15} /> },
  { key: 'orders',      label: 'Orders',      icon: <ShoppingBag size={15} /> },
  { key: 'requests',    label: 'Requests',    icon: <HelpCircle size={15} /> },
  { key: 'branding',    label: 'Branding',    icon: <Sparkles size={15} /> },
];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.125rem', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, background: 'var(--glass)', border: '1px solid var(--line-2)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mute)' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '1.125rem' }}>{children}</div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '0.75rem 0.875rem', background: 'var(--input-bg)', border: '1px solid var(--line-2)', borderRadius: 11, color: 'var(--text)', fontFamily: 'var(--font-sans)', fontSize: 16, outline: 'none' };
const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 72 };
const sel: React.CSSProperties = { ...inp };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const { dbUser, fetchSiteSettings } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (dbUser && dbUser.role !== 'admin') { showError('Unauthorized'); navigate('/'); }
  }, [dbUser, navigate, showError]);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#10b981');

  // Product modal
  const [showProd, setShowProd] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [pName, setPName] = useState(''); const [pDesc, setPDesc] = useState('');
  const [pCat, setPCat] = useState<any>(''); const [pImg, setPImg] = useState('');
  const [pActive, setPActive] = useState(true); const [pSort, setPSort] = useState(0);

  // Package modal
  const [showPkg, setShowPkg] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);
  const [kgProd, setKgProd] = useState(''); const [kgDays, setKgDays] = useState<any>(30);
  const [kgPrice, setKgPrice] = useState(0); const [kgActive, setKgActive] = useState(true);

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCat, setShowCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSort, setCatSort] = useState(0);

  // Stock modal
  const [showStock, setShowStock] = useState(false);
  const [skPkg, setSkPkg] = useState(''); const [skType, setSkType] = useState<any>('key');
  const [skKey, setSkKey] = useState(''); const [skUser, setSkUser] = useState(''); const [skPass, setSkPass] = useState('');
  const [skBulk, setSkBulk] = useState(''); const [skBulkMode, setSkBulkMode] = useState(false);

  useEffect(() => {
    if (!dbUser || dbUser.role !== 'admin') return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: p }, { data: pk }, { data: s }, { data: o }, { data: r }, { data: ss }, { data: cats }] = await Promise.all([
          supabase.from('products').select('*').order('sort_order', { ascending: true }),
          supabase.from('packages').select('*'),
          supabase.from('stock_items').select('*, packages:package_id(days, products:product_id(name))').order('created_at', { ascending: false }),
          supabase.from('orders').select('id,user_id,source,amount_paid,status:stat,created_at,users:user_id(email)').order('created_at', { ascending: false }),
          supabase.from('stock_requests').select('*, users:user_id(email)').order('created_at', { ascending: false }),
          supabase.from('site_settings').select('*'),
          supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        ]);
        setProducts(p || []); setPackages(pk || []); setStockItems(s || []);
        setOrders(o || []); setRequests(r || []); setCategories(cats || []);
        if (ss?.length) {
          const row = ss[0];
          if ('site_name' in row) { setBrandName(row.site_name||''); setBrandLogo(row.site_logo_url||''); setBrandColor(row.primary_color||'#10b981'); }
          else { ss.forEach((x:any) => { if(x.key==='site_name')setBrandName(x.value); if(x.key==='site_logo_url')setBrandLogo(x.value); if(x.key==='primary_color')setBrandColor(x.value); }); }
        }
      } catch(e:any) { showError('Failed to load admin data'); }
      finally { setLoading(false); }
    })();
  }, [dbUser, reload]);

  const stats = useMemo(() => ({
    revenue: orders.filter(o=>o.status==='completed').reduce((s:number,o:any)=>s+Number(o.amount_paid),0),
    products: products.filter(p=>p.is_active).length,
    available: stockItems.filter(s=>!s.is_sold).length,
    sold: stockItems.filter(s=>s.is_sold).length,
    orders: orders.length,
    pending: requests.filter(r=>r.stat==='pending').length,
  }), [products, stockItems, orders, requests]);

  const saveProd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) { showError('Product name required'); return; }
    try {
      const pl = { name: pName, description: pDesc, category: pCat, image_url: pImg, is_active: pActive, sort_order: Number(pSort) };
      if (editProd) { const {error} = await supabase.from('products').update(pl).eq('id', editProd.id); if(error) throw error; showSuccess('Product updated!'); }
      else { const {error} = await supabase.from('products').insert([pl]); if(error) throw error; showSuccess('Product added!'); }
      setShowProd(false); setReload(r=>r+1);
    } catch(e:any){ showError(e.message); }
  };

  const toggleProd = async (id: string, cur: boolean) => {
    const {error} = await supabase.from('products').update({is_active:!cur}).eq('id',id);
    if(error) showError(error.message); else { showSuccess(`Product ${!cur?'shown':'hidden'}`); setReload(r=>r+1); }
  };

  const delProd = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const {error} = await supabase.from('products').delete().eq('id',id);
    if(error) showError(error.message); else { showSuccess('Deleted'); setReload(r=>r+1); }
  };

  const savePkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kgProd) { showError('Select a product'); return; }
    try {
      const pl = { product_id: kgProd, days: Number(kgDays), price: Number(kgPrice), is_active: kgActive };
      if (editPkg) { const {error} = await supabase.from('packages').update(pl).eq('id', editPkg.id); if(error) throw error; showSuccess('Package updated!'); }
      else { const {error} = await supabase.from('packages').insert([pl]); if(error) throw error; showSuccess('Package added!'); }
      setShowPkg(false); setReload(r=>r+1);
    } catch(e:any){ showError(e.message); }
  };

  const delPkg = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    const {error} = await supabase.from('packages').delete().eq('id',id);
    if(error) showError(error.message); else { showSuccess('Deleted'); setReload(r=>r+1); }
  };

  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skPkg) { showError('Select a package'); return; }
    try {
      if (skBulkMode) {
        const lines = skBulk.split('\n').map(l=>l.trim()).filter(Boolean);
        if (!lines.length) { showError('Enter stock values'); return; }
        const ins = lines.map(v => skType==='key'
          ? { package_id: skPkg, item_type: skType, key_value: v, is_sold: false }
          : { package_id: skPkg, item_type: skType, username: v.split(/[:\s]+/)[0], password: v.split(/[:\s]+/)[1]||'', is_sold: false }
        );
        const {error} = await supabase.from('stock_items').insert(ins);
        if(error) throw error; showSuccess(`${lines.length} items added!`);
      } else {
        const pl: any = { package_id: skPkg, item_type: skType, is_sold: false };
        if (skType==='key'||skType==='custom') pl.key_value = skKey;
        else { pl.username = skUser; pl.password = skPass; }
        const {error} = await supabase.from('stock_items').insert([pl]);
        if(error) throw error; showSuccess('Stock added!');
      }
      setShowStock(false); setSkKey(''); setSkUser(''); setSkPass(''); setSkBulk('');
      setReload(r=>r+1);
    } catch(e:any){ showError(e.message); }
  };

  const delStock = async (id: string) => {
    if (!confirm('Delete this stock item?')) return;
    const {error} = await supabase.from('stock_items').delete().eq('id',id);
    if(error) showError(error.message); else { showSuccess('Deleted'); setReload(r=>r+1); }
  };

  const doneReq = async (id: string) => {
    const {error} = await supabase.from('stock_requests').update({stat:'done',updated_at:new Date().toISOString()}).eq('id',id);
    if(error) showError(error.message); else { showSuccess('Marked done'); setReload(r=>r+1); }
  };

  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { showError('Category name required'); return; }
    const slug = catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      const { error } = await supabase.from('categories').insert([{ name: catName.trim(), slug, sort_order: Number(catSort), is_active: true }]);
      if (error) throw error;
      showSuccess('Category added!');
      setShowCat(false); setCatName(''); setCatSlug(''); setCatSort(0);
      setReload(r => r + 1);
    } catch (e: any) { showError(e.message); }
  };

  const toggleCat = async (id: string, cur: boolean) => {
    const { error } = await supabase.from('categories').update({ is_active: !cur }).eq('id', id);
    if (error) showError(error.message); else { showSuccess(`Category ${!cur ? 'enabled' : 'disabled'}`); setReload(r => r + 1); }
  };

  const delCat = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) showError(error.message); else { showSuccess('Deleted'); setReload(r => r + 1); }
  };

  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) { showError('Name required'); return; }
    try {
      const {error} = await supabase.from('site_settings').upsert({id:1,site_name:brandName,site_logo_url:brandLogo,primary_color:brandColor});
      if (error) {
        await supabase.from('site_settings').upsert([
          {key:'site_name',value:brandName},{key:'site_logo_url',value:brandLogo},{key:'primary_color',value:brandColor}
        ],{onConflict:'key'});
      }
      showSuccess('Branding saved!'); await fetchSiteSettings();
    } catch(e:any){ showError(e.message); }
  };

  if (loading) return (
    <div className="page-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <RefreshCw size={28} color="var(--accent)" style={{ animation:'spin 1s linear infinite', marginBottom:12 }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-mute)' }}>Loading…</p>
      </div>
    </div>
  );

  return (
    <div className="page-enter page-wrap" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'var(--accent-s)', border:'1px solid var(--accent-g)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Settings size={18} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'var(--text)' }}>Admin Panel</h1>
            <p style={{ margin:0, fontSize:'0.7rem', color:'var(--text-mute)' }}>Panel Bazaar BD</p>
          </div>
        </div>

        {/* Tab bar — horizontal scroll on mobile */}
        <div style={{ overflowX:'auto', marginBottom:'1rem' }} className="scrollbar-none">
          <div style={{ display:'flex', gap:'0.25rem', padding:'0.375rem', background:'var(--glass)', border:'1px solid var(--line)', borderRadius:14, width:'max-content', minWidth:'100%' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`admin-tab ${activeTab===t.key?'active':''}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem', marginBottom:'1.25rem' }}>
              <style>{`@media(min-width:480px){.stat-grid{grid-template-columns:repeat(3,1fr)!important;}}@media(min-width:768px){.stat-grid{grid-template-columns:repeat(6,1fr)!important;}}`}</style>
              {[
                {l:'Revenue',    v:`৳${stats.revenue.toLocaleString()}`, c:'var(--accent)'},
                {l:'Products',   v:stats.products,   c:'#818cf8'},
                {l:'Available',  v:stats.available,  c:'var(--accent)'},
                {l:'Sold',       v:stats.sold,        c:'#f87171'},
                {l:'Orders',     v:stats.orders,      c:'#f59e0b'},
                {l:'Requests',   v:stats.pending,     c:'#f59e0b'},
              ].map(({l,v,c}) => (
                <div key={l} className="stat-card">
                  <div style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-mute)', fontFamily:'var(--font-mono)', marginBottom:'0.35rem' }}>{l}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.35rem', fontWeight:700, color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:16 }}>
              <div style={{ padding:'0.75rem 1rem', borderBottom:'1px solid var(--line)', fontSize:'0.8rem', fontWeight:700, color:'var(--text)' }}>Recent Orders</div>
              <div className="table-wrap">
                <table className="lumen-table">
                  <thead><tr><th>ID</th><th>User</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.slice(0,8).map((o:any) => (
                      <tr key={o.id}>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem' }}>#{o.id.slice(-5).toUpperCase()}</td>
                        <td style={{ fontSize:'0.73rem' }}>{o.users?.email?.split('@')[0] || '—'}</td>
                        <td style={{ fontFamily:'var(--font-mono)', color:'var(--accent)' }}>৳{Number(o.amount_paid).toLocaleString()}</td>
                        <td><span className={`badge ${o.status==='completed'?'badge-green':o.status==='pending'?'badge-yellow':'badge-dim'}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
              <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)' }}>Products ({products.length})</span>
              <button onClick={() => { setEditProd(null); setPName(''); setPDesc(''); setPCat(categories[0]?.name || ''); setPImg(''); setPActive(true); setPSort(0); setShowProd(true); }} className="btn-accent" style={{ fontSize:'0.72rem', padding:'0.45rem 0.875rem' }}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {products.map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:14 }}>
                  {p.image_url && <img src={p.image_url} alt={p.name} style={{ width:40, height:30, borderRadius:7, objectFit:'cover', flexShrink:0 }} referrerPolicy="no-referrer" />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.8rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <span className="badge badge-dim" style={{ marginTop:2 }}>{p.category}</span>
                  </div>
                  <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
                    <button onClick={() => toggleProd(p.id, p.is_active)} className={`badge ${p.is_active?'badge-green':'badge-dim'}`} style={{ cursor:'pointer', border:'none', padding:'0.25rem 0.5rem' }}>
                      {p.is_active?'On':'Off'}
                    </button>
                    <button onClick={() => { setEditProd(p); setPName(p.name); setPDesc(p.description||''); setPCat(p.category); setPImg(p.image_url||''); setPActive(p.is_active); setPSort(p.sort_order); setShowProd(true); }} style={{ width:30, height:30, background:'var(--glass)', border:'1px solid var(--line-2)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-mute)' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => delProd(p.id)} style={{ width:30, height:30, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#ef4444' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* ── CATEGORIES ── */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
              <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)' }}>Categories ({categories.length})</span>
              <button onClick={() => { setCatName(''); setCatSlug(''); setCatSort(0); setShowCat(true); }} className="btn-accent" style={{ fontSize:'0.72rem', padding:'0.45rem 0.875rem' }}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:14 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.8rem', color:'var(--text)' }}>{cat.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.63rem', color:'var(--text-mute)', marginTop:2 }}>/{cat.slug} · order: {cat.sort_order}</div>
                  </div>
                  <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
                    <button onClick={() => toggleCat(cat.id, cat.is_active)} className={`badge ${cat.is_active?'badge-green':'badge-dim'}`} style={{ cursor:'pointer', border:'none', padding:'0.25rem 0.5rem' }}>
                      {cat.is_active?'Active':'Off'}
                    </button>
                    <button onClick={() => delCat(cat.id)} style={{ width:30, height:30, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#ef4444' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-mute)', fontSize:'0.8rem' }}>No categories yet.</div>}
            </div>
          </div>
        )}

        {/* ── PACKAGES ── */}
        {activeTab === 'packages' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
              <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)' }}>Packages ({packages.length})</span>
              <button onClick={() => { setEditPkg(null); setKgProd(products[0]?.id||''); setKgDays(30); setKgPrice(0); setKgActive(true); setShowPkg(true); }} className="btn-accent" style={{ fontSize:'0.72rem', padding:'0.45rem 0.875rem' }}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {packages.map(pk => {
                const prod = products.find(p => p.id === pk.product_id);
                return (
                  <div key={pk.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:14 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.8rem', color:'var(--text)' }}>{prod?.name || '—'}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--text-mute)', marginTop:2 }}>{pk.days}d · ৳{Number(pk.price).toLocaleString()}</div>
                    </div>
                    <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
                      <span className={`badge ${pk.is_active?'badge-green':'badge-dim'}`}>{pk.is_active?'Active':'Off'}</span>
                      <button onClick={() => { setEditPkg(pk); setKgProd(pk.product_id); setKgDays(pk.days); setKgPrice(Number(pk.price)); setKgActive(pk.is_active); setShowPkg(true); }} style={{ width:30, height:30, background:'var(--glass)', border:'1px solid var(--line-2)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-mute)' }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => delPkg(pk.id)} style={{ width:30, height:30, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#ef4444' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STOCK ── */}
        {activeTab === 'stock' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
              <div>
                <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)' }}>Stock </span>
                <span className="badge badge-green">{stats.available} available</span>
                <span className="badge badge-red" style={{ marginLeft:4 }}>{stats.sold} sold</span>
              </div>
              <button onClick={() => { setSkPkg(packages[0]?.id||''); setSkType('key'); setSkKey(''); setSkUser(''); setSkPass(''); setSkBulk(''); setSkBulkMode(false); setShowStock(true); }} className="btn-accent" style={{ fontSize:'0.72rem', padding:'0.45rem 0.875rem' }}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              {stockItems.slice(0,60).map((s:any) => {
                const pkg = s.packages;
                const val = s.item_type==='key' ? s.key_value : s.username ? `${s.username}/${s.password}` : s.key_value;
                return (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.625rem 0.875rem', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</div>
                      <div style={{ fontSize:'0.63rem', color:'var(--text-mute)', marginTop:1 }}>{pkg?.products?.name} · {pkg?.days}d · {s.item_type}</div>
                    </div>
                    <div style={{ display:'flex', gap:'0.35rem', flexShrink:0, alignItems:'center' }}>
                      <span className={`badge ${s.is_sold?'badge-red':'badge-green'}`}>{s.is_sold?'Sold':'Free'}</span>
                      {!s.is_sold && (
                        <button onClick={() => delStock(s.id)} style={{ width:28, height:28, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#ef4444' }}>
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)', marginBottom:'0.875rem' }}>Orders ({orders.length})</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              {orders.map((o:any) => (
                <div key={o.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', padding:'0.75rem', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:13 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem', color:'var(--text-mute)' }}>#{o.id.slice(-5).toUpperCase()}</div>
                    <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text)', marginTop:1 }}>{o.users?.email?.split('@')[0] || o.user_id.slice(0,8)}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'var(--text-faint)', marginTop:1 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--accent)' }}>৳{Number(o.amount_paid).toLocaleString()}</div>
                    <span className={`badge ${o.status==='completed'?'badge-green':o.status==='pending'?'badge-yellow':'badge-dim'}`} style={{ marginTop:3 }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REQUESTS ── */}
        {activeTab === 'requests' && (
          <div>
            <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)', marginBottom:'0.875rem' }}>
              Stock Requests
              {stats.pending > 0 && <span className="badge badge-yellow" style={{ marginLeft:8 }}>{stats.pending} pending</span>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {requests.map((r:any) => (
                <div key={r.id} style={{ padding:'0.875rem', background:'var(--bg-1)', border:'1px solid var(--line)', borderRadius:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem', marginBottom: r.note ? '0.4rem' : 0 }}>
                    <div>
                      <span className={`badge ${r.stat==='done'?'badge-green':'badge-yellow'}`} style={{ marginBottom:4 }}>{r.stat==='done'?'Done':'Pending'}</span>
                      <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text)' }}>{r.product_name}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-mute)', marginTop:2 }}>{r.users?.email} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    {r.stat === 'pending' && (
                      <button onClick={() => doneReq(r.id)} className="btn-accent" style={{ fontSize:'0.68rem', padding:'0.4rem 0.75rem', flexShrink:0 }}>
                        <CheckCircle size={12} /> Done
                      </button>
                    )}
                  </div>
                  {r.note && <div style={{ fontSize:'0.73rem', color:'var(--text-mute)' }}>{r.note}</div>}
                </div>
              ))}
              {requests.length === 0 && <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-mute)', fontSize:'0.8rem' }}>No requests yet.</div>}
            </div>
          </div>
        )}

        {/* ── BRANDING ── */}
        {activeTab === 'branding' && (
          <div style={{ maxWidth:460 }}>
            <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text)', marginBottom:'1rem' }}>Site Branding</div>
            <form onSubmit={saveBrand} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <Field label="Site Name"><input style={inp} type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="Panel Bazaar BD" /></Field>
              <Field label="Logo URL"><input style={inp} type="url" value={brandLogo} onChange={e=>setBrandLogo(e.target.value)} placeholder="https://..." /></Field>
              <Field label="Primary Color">
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input style={{ ...inp, flex:1 }} type="text" value={brandColor} onChange={e=>setBrandColor(e.target.value)} placeholder="#10b981" />
                  <input type="color" value={brandColor} onChange={e=>setBrandColor(e.target.value)} style={{ width:44, height:44, borderRadius:10, border:'none', cursor:'pointer', padding:2, background:'var(--input-bg)' }} />
                </div>
              </Field>
              <button type="submit" className="btn-accent" style={{ width:'100%' }}><Save size={14} /> Save Branding</button>
            </form>
          </div>
        )}
      </div>

      {/* ── Product Modal ── */}
      {showProd && (
        <Modal title={editProd ? 'Edit Product' : 'Add Product'} onClose={() => setShowProd(false)}>
          <form onSubmit={saveProd} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <Field label="Name"><input style={inp} type="text" value={pName} onChange={e=>setPName(e.target.value)} required /></Field>
            <Field label="Description"><textarea style={ta} value={pDesc} onChange={e=>setPDesc(e.target.value)} /></Field>
            <Field label="Category">
              <select style={sel} value={pCat} onChange={e=>setPCat(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Image URL"><input style={inp} type="url" value={pImg} onChange={e=>setPImg(e.target.value)} placeholder="https://..." /></Field>
            <Field label="Sort Order"><input style={inp} type="number" value={pSort} onChange={e=>setPSort(Number(e.target.value))} /></Field>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <input type="checkbox" checked={pActive} onChange={e=>setPActive(e.target.checked)} id="pa" style={{ width:16, height:16, accentColor:'var(--accent)' }} />
              <label htmlFor="pa" style={{ fontSize:'0.82rem', color:'var(--text-dim)', cursor:'pointer' }}>Active (visible to customers)</label>
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button type="button" onClick={() => setShowProd(false)} className="btn-ghost" style={{ flex:1, fontSize:'0.78rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex:1, fontSize:'0.78rem' }}><Save size={13} /> {editProd?'Update':'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Category Modal ── */}
      {showCat && (
        <Modal title="Add Category" onClose={() => setShowCat(false)}>
          <form onSubmit={saveCat} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <Field label="Name"><input style={inp} type="text" value={catName} onChange={e=>setCatName(e.target.value)} placeholder="e.g. NON ROOT" required /></Field>
            <Field label="Slug (auto-generated if empty)"><input style={inp} type="text" value={catSlug} onChange={e=>setCatSlug(e.target.value)} placeholder="e.g. non-root" /></Field>
            <Field label="Sort Order"><input style={inp} type="number" value={catSort} onChange={e=>setCatSort(Number(e.target.value))} /></Field>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button type="button" onClick={() => setShowCat(false)} className="btn-ghost" style={{ flex:1, fontSize:'0.78rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex:1, fontSize:'0.78rem' }}><Save size={13} /> Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Package Modal ── */}
      {showPkg && (
        <Modal title={editPkg ? 'Edit Package' : 'Add Package'} onClose={() => setShowPkg(false)}>
          <form onSubmit={savePkg} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <Field label="Product"><select style={sel} value={kgProd} onChange={e=>setKgProd(e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Duration"><select style={sel} value={kgDays} onChange={e=>setKgDays(Number(e.target.value))}>{[1,3,7,15,30].map(d=><option key={d} value={d}>{d} days</option>)}</select></Field>
            <Field label="Price (৳)"><input style={inp} type="number" min={0} value={kgPrice} onChange={e=>setKgPrice(Number(e.target.value))} /></Field>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <input type="checkbox" checked={kgActive} onChange={e=>setKgActive(e.target.checked)} id="ka" style={{ width:16, height:16, accentColor:'var(--accent)' }} />
              <label htmlFor="ka" style={{ fontSize:'0.82rem', color:'var(--text-dim)', cursor:'pointer' }}>Active</label>
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button type="button" onClick={() => setShowPkg(false)} className="btn-ghost" style={{ flex:1, fontSize:'0.78rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex:1, fontSize:'0.78rem' }}><Save size={13} /> {editPkg?'Update':'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Stock Modal ── */}
      {showStock && (
        <Modal title="Add Stock" onClose={() => setShowStock(false)}>
          <form onSubmit={saveStock} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <Field label="Package">
              <select style={sel} value={skPkg} onChange={e=>setSkPkg(e.target.value)}>
                {packages.map(pk => { const prod = products.find(p=>p.id===pk.product_id); return <option key={pk.id} value={pk.id}>{prod?.name} — {pk.days}d — ৳{pk.price}</option>; })}
              </select>
            </Field>
            <Field label="Type"><select style={sel} value={skType} onChange={e=>setSkType(e.target.value)}><option value="key">License Key</option><option value="credentials">Credentials</option><option value="custom">Custom</option></select></Field>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <input type="checkbox" checked={skBulkMode} onChange={e=>setSkBulkMode(e.target.checked)} id="sb" style={{ width:16, height:16, accentColor:'var(--accent)' }} />
              <label htmlFor="sb" style={{ fontSize:'0.78rem', color:'var(--text-dim)', cursor:'pointer' }}>Bulk insert (one per line)</label>
            </div>
            {skBulkMode
              ? <Field label="Values (one per line)"><textarea style={{ ...ta, minHeight:100 }} value={skBulk} onChange={e=>setSkBulk(e.target.value)} placeholder={"KEY1\nKEY2\nKEY3"} /></Field>
              : skType === 'credentials'
                ? <><Field label="Username"><input style={inp} type="text" value={skUser} onChange={e=>setSkUser(e.target.value)} /></Field><Field label="Password"><input style={inp} type="text" value={skPass} onChange={e=>setSkPass(e.target.value)} /></Field></>
                : <Field label="Key Value"><input style={inp} type="text" value={skKey} onChange={e=>setSkKey(e.target.value)} placeholder="XXXX-XXXX-XXXX" /></Field>
            }
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button type="button" onClick={() => setShowStock(false)} className="btn-ghost" style={{ flex:1, fontSize:'0.78rem' }}>Cancel</button>
              <button type="submit" className="btn-accent" style={{ flex:1, fontSize:'0.78rem' }}><Plus size={13} /> Add Stock</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
