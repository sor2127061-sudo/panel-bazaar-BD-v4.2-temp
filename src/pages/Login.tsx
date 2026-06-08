/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN Login — cinematic dark glass card, floating labels
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Loader2, ArrowRight, UserPlus, Layers } from 'lucide-react';

export default function Login() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }
    setErrorMessage('');
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      showSuccess('Successfully logged in! Welcome back.');
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Failed to sign in. Please verify your email and password.');
      showError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-enter" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5rem 1rem 2rem',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)',
            marginBottom: '1.25rem',
          }}>
            <Layers size={24} color="#10b981" strokeWidth={1.6} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-mute)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Sign in to your Panel Bazaar BD account
          </p>
        </div>

        {/* Glass card */}
        <div className="glass-card--static" style={{ padding: '2rem' }}>

          {errorMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              fontSize: '0.8rem',
              color: '#f87171',
              marginBottom: '1.5rem',
            }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Email field */}
            <div className="lumen-field">
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="lumen-input"
                placeholder="email"
                autoComplete="email"
              />
              <label htmlFor="email" className="lumen-label">Email address</label>
            </div>

            {/* Password field */}
            <div className="lumen-field">
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="lumen-input"
                placeholder="password"
                autoComplete="current-password"
              />
              <label htmlFor="password" className="lumen-label">Password</label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? (
                <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </form>

          <hr className="lumen-divider" />

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-mute)' }}>New to Panel Bazaar BD? </span>
            <Link to="/register" style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
              Create account <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
        </div>

        {/* Decorative lines */}
        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '1.5rem', letterSpacing: '0.05em' }}>
          PANEL BAZAAR BD · SECURE LOGIN · LUMEN
        </p>
      </div>
    </div>
  );
}
