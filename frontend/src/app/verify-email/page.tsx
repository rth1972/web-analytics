'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token found.'); return; }

    fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) { setStatus('success'); setMessage(data.message); }
        else         { setStatus('error');   setMessage(data.error); }
      })
      .catch(() => { setStatus('error'); setMessage('Could not connect to server.'); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm text-center bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
        {status === 'loading' && (
          <p className="text-[var(--muted-foreground)] text-sm">Verifying your email…</p>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-semibold text-lg mb-2">Email Verified</h2>
            <p className="text-[var(--muted-foreground)] text-sm">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-semibold text-lg mb-2">Verification Failed</h2>
            <p className="text-[var(--muted-foreground)] text-sm">{message}</p>
          </>
        )}
        <a href="/login" className="mt-6 inline-block text-sm text-[var(--primary)] hover:underline">← Back to login</a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
