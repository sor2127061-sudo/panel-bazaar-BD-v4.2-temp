/**
 * @license SPDX-License-Identifier: Apache-2.0
 * LUMEN Register — dark glass card, floating labels
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loader2, ArrowRight, LogIn, Layers, User, Mail, Lock } from 'lucide-react';

export default function Register() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const referrerId = searchParams.get('ref');

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setErrorMessage('Please fill in all requested fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      // 1. SignUp user credentials via Supabase auth engine
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (signUpError) throw signUpError;

      const authUser = signUpData.user;
      if (!authUser) {
        throw new Error('Account was created, but no user session was found. Please log in.');
      }

      // 2. Insert corresponding record into users profile table
      const profileData: any = {
        id: authUser.id,
        email: email.trim(),
        display_name: displayName.trim(),
      };

      if (referrerId) {
        profileData.referrer_id = referrerId;
      }

      const { error: dbError } = await supabase
        .from('users')
        .insert([profileData]);

      if (dbError) {
        console.warn('Custom profile database insert failed/skipped:', dbError.message);
      }

      showSuccess('Account registered successfully! Welcome aboard.');
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Failed to create account. This email address might already be registered.');
      showError(err.message || 'Registration failed');
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
            Create account
          </h1>
          <p style={{ color: 'var(--text-mute)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Join Panel Bazaar BD — instant digital delivery
          </p>
          {referrerId && (
            <div style={{
              marginTop: '0.75rem',
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 999,
              fontSize: '0.7rem',
              color: '#10b981',
              fontFamily: 'var(--font-mono)',
            }}>
              Referral active
            </div>
          )}
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

            {/* Display name */}
            <div className="lumen-field">
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="lumen-input"
                placeholder="name"
                autoComplete="name"
              />
              <label htmlFor="displayName" className="lumen-label">Display name</label>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="lumen-field">
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="lumen-input"
                placeholder="password"
                autoComplete="new-password"
              />
              <label htmlFor="password" className="lumen-label">Password (min 6 chars)</label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? (
                <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
              ) : (
                <>Complete Registration <ArrowRight size={15} /></>
              )}
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </button>
          </form>

          <hr className="lumen-divider" />

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-mute)' }}>Already have an account? </span>
            <Link to="/login" style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
              Sign in <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '1.5rem', letterSpacing: '0.05em' }}>
          PANEL BAZAAR BD · SECURE SIGNUP · LUMEN
        </p>
      </div>
    </div>
  );
}
