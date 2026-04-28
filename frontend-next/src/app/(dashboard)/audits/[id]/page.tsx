'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, ArrowLeft, ExternalLink,
  TrendingUp, Zap, Eye, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAudit } from '@/lib/api';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as any },
});

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'text-[#C35037]',  bg: 'bg-red-50 border-red-100',    label: 'Critical' },
  high:     { color: 'text-[#DB7245]',  bg: 'bg-orange-50 border-orange-100', label: 'High' },
  medium:   { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100', label: 'Medium' },
  low:      { color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200',   label: 'Low' },
};

function ScoreGauge({ score }: { score: number }) {
  const data = [{ value: score }];
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#DB7245';
  return (
    <div className="relative w-40 h-40">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" fill={color} cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{Math.round(score)}</span>
        <span className="text-xs text-slate-500 mt-1">Leak Score</span>
      </div>
    </div>
  );
}

export default function AuditDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    async function loadAudit() {
      try {
        const res = await getAudit(id);
        if (isMounted) {
          setAudit(res.data);
          // If still pending, poll again in 3 seconds
          if (res.data.status === 'queued' || res.data.status === 'running') {
            timeoutId = setTimeout(loadAudit, 3000);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch audit:', err);
          setError('Could not load audit details.');
          setLoading(false);
        }
      }
    }
    
    if (id) {
      loadAudit();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="w-10 h-10 text-[#10374E] animate-spin mb-4" />
      <p className="text-slate-500">Analysing diagnostic data...</p>
    </div>
  );

  if (error || !audit) return (
    <div className="max-w-md mx-auto text-center py-20">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Error</h2>
      <p className="text-slate-500 mt-2">{error || 'Audit not found.'}</p>
      <Link href="/audits" className="mt-6 inline-flex items-center gap-2 text-[#093090] font-medium hover:underline">
        <ArrowLeft size={16} /> Back to audits
      </Link>
    </div>
  );

  const issues = audit.report?.top_fixes || [];
  const wastedSpend = audit.estimated_wasted_ad_spend || 0;
  const bottleneck = audit.summary || 'Initial analysis pending...';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + header */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between">
        <div>
          <Link href="/audits" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to audits
          </Link>
          <h2 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
            {audit.url}
            <a href={audit.url.startsWith('http') ? audit.url : `https://${audit.url}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#093090]">
              <ExternalLink size={16} />
            </a>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Audit completed {audit.completed_at ? new Date(audit.completed_at).toLocaleString() : 'Just now'}
          </p>
        </div>
        <Link
          href="/audits/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#10374E] text-white text-sm font-medium rounded-xl hover:bg-[#0d2e42] transition-colors"
        >
          <Zap size={14} /> Re-audit
        </Link>
      </motion.div>

      {/* Score + key metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div {...fadeUp(0.1)} className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center">
          <ScoreGauge score={audit.score || 0} />
        </motion.div>

        {[
          { label: 'Wasted Ad Spend', value: `$${Math.round(wastedSpend).toLocaleString()} / day`, icon: TrendingUp, color: '#C35037' },
          { label: 'Trust Score',     value: `${Math.round((audit.trust_score || 0) * 100)}%`, icon: Eye,        color: '#DB7245' },
          { label: 'Issues Found',    value: `${issues.length}`,                        icon: AlertTriangle, color: '#5B5B7B' },
        ].map((m, i) => (
          <motion.div key={m.label} {...fadeUp(0.12 + i * 0.06)} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{m.label}</span>
              <m.icon size={16} style={{ color: m.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Primary bottleneck */}
      <motion.div {...fadeUp(0.2)} className="bg-[#10374E] rounded-2xl p-6 flex items-start gap-4 shadow-xl shadow-blue-900/10 border border-white/5">
        <div className="w-10 h-10 rounded-xl bg-[#53F6FF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle size={18} className="text-[#53F6FF]" />
        </div>
        <div>
          <p className="text-xs text-[#53F6FF] font-medium uppercase tracking-wider mb-1">Primary Bottleneck Identified</p>
          <p className="text-white font-medium leading-relaxed">{bottleneck}</p>
        </div>
      </motion.div>

      {/* Issues list */}
      <motion.div {...fadeUp(0.25)} className="bg-white rounded-2xl border border-slate-200/80">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Diagnostic Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {issues.length > 0 ? issues.map((issue: any, i: number) => {
            const severity = issue.priority > 0.5 ? 'critical' : issue.priority > 0.3 ? 'high' : 'medium';
            const cfg = severityConfig[severity] || severityConfig.medium;
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', cfg.bg, cfg.color)}>
                  {cfg.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{issue.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{issue.suggested_fix}</p>
                </div>
                <span className="text-sm font-semibold text-[#DB7245] whitespace-nowrap">
                  +{Math.round(issue.expected_metric_improvement * 100)}% CVR
                </span>
                <Link
                  href={`/fixes/${issue.id}?auditId=${audit.id}`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#10374E] text-white font-medium hover:bg-[#0d2e42] transition-colors whitespace-nowrap"
                >
                  <Zap size={11} /> View Fix
                </Link>
              </motion.div>
            );
          }) : (
            <div className="p-10 text-center text-slate-500 text-sm">
              No specific fixes generated for this audit.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
