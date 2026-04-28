'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, Code, Eye, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAudit } from '@/lib/api';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as any } });

export default function FixDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const auditId = searchParams.get('auditId');

  const [fix, setFix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  useEffect(() => {
    async function loadFix() {
      if (!auditId) {
        setError('No audit reference provided.');
        setLoading(false);
        return;
      }
      try {
        const res = await getAudit(auditId);
        const issues = res.data.report?.top_fixes || [];
        const found = issues.find((i: any) => i.id === id);
        if (found) {
          setFix(found);
        } else {
          setError('Fix not found in this audit.');
        }
      } catch (err) {
        setError('Failed to fetch fix details.');
      } finally {
        setLoading(false);
      }
    }
    loadFix();
  }, [id, auditId]);

  const handleApplyFix = () => {
    setDeploying(true);
    // Simulate deployment delay
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
      alert('Fix successfully deployed to Shopify store!');
    }, 2000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40">
      <Loader2 className="w-10 h-10 text-[#10374E] animate-spin mb-4" />
      <p className="text-slate-500">Loading fix details...</p>
    </div>
  );

  if (error || !fix) return (
    <div className="max-w-md mx-auto text-center py-20">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Error</h2>
      <p className="text-slate-500 mt-2">{error}</p>
      <Link href={auditId ? `/audits/${auditId}` : '/audits'} className="mt-6 inline-flex items-center gap-2 text-[#093090] font-medium hover:underline">
        <ArrowLeft size={16} /> Back to Audit
      </Link>
    </div>
  );

  const severity = fix.priority > 0.5 ? 'critical' : fix.priority > 0.3 ? 'high' : 'medium';
  const severityStyle = severity === 'critical' ? 'bg-red-50 text-[#C35037] border-red-100' : 'bg-orange-50 text-[#DB7245] border-orange-100';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div {...fadeUp(0)}>
        <Link href={`/audits/${auditId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors">
          <ArrowLeft size={14} /> Back to audit
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-slate-900">{fix.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", severityStyle)}>{severity}</span>
              <span className="text-sm font-semibold text-[#DB7245]">+{Math.round(fix.expected_metric_improvement * 100)}% CVR Lift</span>
            </div>
          </div>
          <button 
            onClick={handleApplyFix}
            disabled={deploying || deployed}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#10374E] text-white text-sm font-semibold rounded-xl hover:bg-[#0d2e42] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deploying ? <Loader2 size={14} className="animate-spin" /> : deployed ? <CheckCircle size={14} /> : <Zap size={14} />} 
            {deploying ? 'Deploying...' : deployed ? 'Deployed' : 'Apply Fix'}
          </button>
        </div>
      </motion.div>

      {/* Problem Description */}
      <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-[#DB7245]" /> The Problem</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{fix.problem_description}</p>
        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-xs font-semibold text-[#C35037] uppercase tracking-wider mb-1">Impact</p>
          <p className="text-sm text-slate-700">{fix.why_it_hurts_conversion}</p>
        </div>
      </motion.div>

      {/* Suggested Fix */}
      <motion.div {...fadeUp(0.12)} className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Zap size={16} className="text-emerald-500" /> Suggested Fix</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{fix.suggested_fix}</p>
      </motion.div>

      {/* Evidence */}
      <motion.div {...fadeUp(0.15)} className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Eye size={16} className="text-[#5B5B7B]" /> Supporting Evidence</h3>
        <ul className="space-y-3">
          {fix.supporting_evidence?.map((item: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-[#10374E]/8 text-[#10374E] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100 italic">
          {fix.deployment_mode === 'auto-fix' ? 'This fix can be automatically deployed to your Shopify theme.' : 'This fix requires manual insertion or adjustment in your Shopify theme editor.'}
        </p>
      </motion.div>

      {/* Code Change (Simulated) */}
      <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Code size={16} className="text-[#5B5B7B]" />
          <h3 className="font-semibold text-slate-900">Code / Structure Change</h3>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-[#10374E] mb-3 uppercase tracking-wider">Action Plan</p>
          <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{fix.suggested_fix}</pre>
        </div>
      </motion.div>

      {/* Expected impact */}
      <motion.div {...fadeUp(0.25)} className="navy-gradient rounded-2xl p-6 grid grid-cols-3 gap-6">
        {[
          { label: 'Deployment Mode', value: fix.deployment_mode === 'auto-fix' ? 'Auto' : 'Manual' },
          { label: 'Expected CVR Lift', value: `+${Math.round(fix.expected_metric_improvement * 100)}%` },
          { label: 'Apply Time', value: '< 2 min' },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-2xl font-bold text-[#53F6FF]">{m.value}</p>
            <p className="text-white/60 text-xs mt-1">{m.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
