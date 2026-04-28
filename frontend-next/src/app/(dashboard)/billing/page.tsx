'use client';

import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as any } });

const plans = [
  {
    name: 'Starter',
    price: 49,
    audits: 10,
    features: ['10 audits / month', '1 store', 'Basic issue detection', 'Email support'],
    current: false,
    accent: '#5B5B7B',
  },
  {
    name: 'Growth',
    price: 149,
    audits: 50,
    features: ['50 audits / month', '5 stores', 'AI fix suggestions', 'Priority support', 'Audit history'],
    current: true,
    accent: '#10374E',
  },
  {
    name: 'Scale',
    price: 399,
    audits: 999,
    features: ['Unlimited audits', 'Unlimited stores', 'Auto-apply fixes', 'Dedicated CSM', 'API access'],
    current: false,
    accent: '#093090',
  },
];

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div {...fadeUp(0)}>
        <h2 className="text-2xl font-bold font-display text-slate-900">Billing</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your plan and usage.</p>
      </motion.div>

      {/* Usage summary */}
      <motion.div {...fadeUp(0.1)} className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Current Usage — Growth Plan</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Audits Used', value: '28', max: '50', pct: 56 },
            { label: 'Stores Connected', value: '3', max: '5', pct: 60 },
            { label: 'Fixes Applied', value: '12', max: '—', pct: null },
          ].map((u) => (
            <div key={u.label}>
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm text-slate-500">{u.label}</span>
                <span className="text-sm font-semibold text-slate-900">{u.value}<span className="text-slate-400 font-normal"> / {u.max}</span></span>
              </div>
              {u.pct !== null && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${u.pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full bg-[#53F6FF]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-100">
          <div>
            <p className="text-sm text-slate-600">Next billing date: <span className="font-medium text-slate-900">May 25, 2026</span></p>
            <p className="text-sm text-slate-600 mt-0.5">Amount due: <span className="font-bold text-[#10374E]">$149.00</span></p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
            <CreditCard size={14} /> Manage payment
          </button>
        </div>
      </motion.div>

      {/* Plans */}
      <motion.div {...fadeUp(0.15)}>
        <h3 className="font-semibold text-slate-900 mb-4">Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              {...fadeUp(0.2 + i * 0.06)}
              className={cn(
                'rounded-2xl border p-6 relative',
                plan.current
                  ? 'border-[#10374E] shadow-md'
                  : 'border-slate-200 bg-white'
              )}
              style={plan.current ? { background: 'linear-gradient(135deg, #10374E 0%, #0d2e42 100%)', color: '#fff' } : {}}
            >
              {plan.current && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-[#53F6FF] text-[#10374E]">
                  Current plan
                </span>
              )}
              <h4 className={cn('font-bold text-lg font-display', plan.current ? 'text-white' : 'text-slate-900')}>{plan.name}</h4>
              <div className="flex items-end gap-1 mt-2 mb-5">
                <span className={cn('text-3xl font-bold', plan.current ? 'text-[#53F6FF]' : 'text-slate-900')}>${plan.price}</span>
                <span className={cn('text-sm mb-1', plan.current ? 'text-white/60' : 'text-slate-500')}>/mo</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className={cn('flex items-center gap-2 text-sm', plan.current ? 'text-white/80' : 'text-slate-600')}>
                    <Check size={14} className={plan.current ? 'text-[#53F6FF]' : 'text-emerald-500'} />
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                  i === 2
                    ? 'bg-[#10374E] text-white hover:bg-[#0d2e42]'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                )}>
                  {i === 2 ? <><Zap size={14} /> Upgrade</> : 'Downgrade'}
                  <ArrowRight size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
