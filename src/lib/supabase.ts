import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  document.body.innerHTML = `
    <div style="min-height:100vh;background:#07080A;display:flex;align-items:center;justify-content:center;font-family:monospace;color:#f87171;text-align:center;padding:2rem;">
      <div>
        <div style="font-size:2rem;margin-bottom:1rem;">⚠️</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:0.5rem;color:#F4F4F6;">Missing Environment Variables</div>
        <div style="font-size:0.8rem;color:#7A7A86;max-width:400px;">
          Add <code style="color:#10b981">VITE_SUPABASE_URL</code> and 
          <code style="color:#10b981">VITE_SUPABASE_ANON_KEY</code> 
          to your Netlify site environment variables, then redeploy.
        </div>
      </div>
    </div>
  `;
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
