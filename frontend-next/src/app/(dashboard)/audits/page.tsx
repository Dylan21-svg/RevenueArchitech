'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAudits } from '@/lib/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as any },
});

function ScoreBadge({ score, status }: { score: number; status: string }) {
  if (status === 'queued' || status === 'processing') return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium animate-pulse">⏳ {status === 'queued' ? 'Queued' : 'Auditing'}</span>
  );
  if (status === 'failed') return (
    <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">❌ Failed</span>
  );
  return (
    <span className={cn(
      'text-sm font-bold px-3 py-1 rounded-full border',
      score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
      score >= 60 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                   'bg-orange-50 text-[#DB7245] border-orange-100'
    )}>
      {score}
    </span>
  );
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudits() {
      try {
        const res = await getAudits();
        setAudits(res.data || []);
      } catch (err) {
        console.error('Failed to fetch audits:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAudits();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">Audit History</h2>
          <p className="text-slate-500 text-sm mt-1">{loading ? 'Loading...' : `${audits.length} audits total`}</p>
        </div>
        <Link
          href="/audits/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#10374E] text-white text-sm font-medium rounded-xl hover:bg-[#0d2e42] transition-colors"
        >
          <Zap size={14} /> New Audit
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-8 h-8 text-[#10374E] animate-spin mb-4" />
          <p className="text-slate-500 text-sm">Fetching your audit history...</p>
        </div>
      ) : audits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
            <Clock size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No audits found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">You haven't performed any audits yet. Run your first audit to see results.</p>
          <Link
            href="/audits/new"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#10374E] text-white text-sm font-medium rounded-xl hover:bg-[#0d2e42] transition-colors"
          >
            Run My First Audit
          </Link>
        </div>
      ) : (
        <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <span>Store URL</span>
            <span>Score</span>
            <span>Revenue Leaks</span>
            <span>Status</span>
            <span>Date</span>
            <span></span>
          </div>

          <div className="divide-y divide-slate-100">
            {audits.map((audit, i) => (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#10374E]/8 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#10374E]">
                      {audit.url.split('//').pop()?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 truncate">{audit.url}</span>
                </div>
                <ScoreBadge score={audit.score} status={audit.status} />
                <span className="text-sm font-semibold text-[#DB7245]">
                  {audit.estimated_wasted_ad_spend > 0 ? `$${audit.estimated_wasted_ad_spend.toLocaleString()}` : '—'}
                </span>
                <span className="text-xs text-slate-500 capitalize">{audit.status}</span>
                <span className="text-xs text-slate-500">
                  {audit.created_at ? new Date(audit.created_at).toLocaleDateString() : '—'}
                </span>
                {audit.status === 'complete' ? (
                  <Link href={`/audits/${audit.id}`} className="flex items-center gap-1 text-xs text-[#093090] font-medium hover:underline">
                    View <ArrowRight size={12} />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
