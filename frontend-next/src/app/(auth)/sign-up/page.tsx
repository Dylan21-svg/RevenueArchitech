'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, AlertCircle, Zap, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
  };

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">Check your email</h2>
      <p className="text-slate-500 text-sm">We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
      <Link href="/sign-in" className="mt-6 inline-block text-sm text-[#093090] font-medium hover:underline">Back to sign in</Link>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="mb-8">
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#10374E] flex items-center justify-center">
            <Zap size={14} className="text-[#53F6FF]" />
          </div>
          <span className="font-display font-bold text-[#10374E]">RevenueArchitect</span>
        </div>
        <h1 className="text-3xl font-bold font-display text-slate-900">Create your account</h1>
        <p className="text-slate-500 mt-2 text-sm">Start recovering lost revenue in minutes. No credit card required.</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        {[
          { label: 'Full Name',  value: name,     setter: setName,     type: 'text',     icon: User,  placeholder: 'Jane Smith' },
          { label: 'Email',      value: email,    setter: setEmail,    type: 'email',    icon: Mail,  placeholder: 'you@example.com' },
          { label: 'Password',   value: password, setter: setPassword, type: 'password', icon: Lock,  placeholder: '••••••••' },
        ].map(({ label, value, setter, type, icon: Icon, placeholder }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <div className="relative">
              <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={type} value={value} onChange={(e) => setter(e.target.value)} required placeholder={placeholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#53F6FF]/40 focus:border-[#53F6FF] transition-all"
              />
            </div>
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 text-[#C35037] text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-[#10374E] text-white font-semibold text-sm hover:bg-[#0d2e42] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
      <p className="mt-3 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[#093090] font-medium hover:underline">Sign in</Link>
      </p>
    </motion.div>
  );
}
