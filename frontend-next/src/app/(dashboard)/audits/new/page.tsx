'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, Globe, DollarSign, Tag, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { runAudit } from '@/lib/api';

const niches = ['General', 'Fashion', 'Beauty', 'Fitness', 'Electronics', 'Home & Garden', 'Food & Beverage', 'Jewelry'];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as any },
});

export default function NewAuditPage() {
  const router = useRouter();
  const [url, setUrl]             = useState('');
  const [spend, setSpend]         = useState('');
  const [niche, setNiche]         = useState('General');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [nicheOpen, setNicheOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('Please enter a store URL.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await runAudit(url.trim(), parseFloat(spend) || 0, niche);
      router.push(`/audits/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Audit failed. Please check the URL and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#53F6FF]/10 border border-[#53F6FF]/20 text-[#10374E] text-xs font-medium mb-4">
          <Zap size={12} className="text-[#53F6FF]" /> AI-Powered Audit
        </div>
        <h2 className="text-3xl font-bold font-display text-slate-900">New Audit</h2>
        <p className="text-slate-500 mt-2">Enter your Shopify store URL and we'll find every revenue leak in under 30 seconds.</p>
      </motion.div>

      <motion.form {...fadeUp(0.1)} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-8 space-y-6 shadow-sm">
        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Store URL <span className="text-[#DB7245]">*</span></label>
          <div className="relative">
            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourstore.myshopify.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#53F6FF]/50 focus:border-[#53F6FF] transition-all"
            />
          </div>
        </div>

        {/* Niche + Spend row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Niche */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Store Niche</label>
            <button
              type="button"
              onClick={() => setNicheOpen(!nicheOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#53F6FF]/50"
            >
              <span className="flex items-center gap-2"><Tag size={14} className="text-slate-400" />{niche}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${nicheOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {nicheOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden text-sm"
                >
                  {niches.map((n) => (
                    <li key={n}>
                      <button
                        type="button"
                        onClick={() => { setNiche(n); setNicheOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors ${niche === n ? 'text-[#10374E] font-medium bg-[#53F6FF]/8' : 'text-slate-700'}`}
                      >
                        {n}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Daily Ad Spend */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Daily Ad Spend</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                value={spend}
                onChange={(e) => setSpend(e.target.value)}
                placeholder="500"
                min="0"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#53F6FF]/50 focus:border-[#53F6FF] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-[#C35037] text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3"
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#10374E] hover:bg-[#0d2e42] text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Analysing store…</>
          ) : (
            <><Zap size={16} /> Run Audit</>
          )}
        </button>
      </motion.form>

      {/* Info cards */}
      <motion.div {...fadeUp(0.2)} className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Analysis Time', value: '< 30s' },
          { label: 'Issues Checked', value: '40+' },
          { label: 'Data Points', value: '200+' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
            <p className="text-xl font-bold text-[#10374E]">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
