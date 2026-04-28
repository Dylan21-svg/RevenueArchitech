'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Zap, AlertTriangle,
  CheckCircle, Clock, ArrowRight, BarChart3, Target
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { cn, formatCurrency, getScoreColor } from '@/lib/utils';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as any },
});

const revenueData = [
  { month: 'Oct', value: 18400 }, { month: 'Nov', value: 22100 },
  { month: 'Dec', value: 29800 }, { month: 'Jan', value: 24300 },
  { month: 'Feb', value: 31200 }, { month: 'Mar', value: 28900 },
  { month: 'Apr', value: 35600 },
];

const recentAudits = [
  { id: '1', url: 'gymshark.com',         score: 72, status: 'complete', leaks: '$4,200', time: '2h ago' },
  { id: '2', url: 'fashionnova.com',      score: 58, status: 'complete', leaks: '$8,900', time: '5h ago' },
  { id: '3', url: 'mvmtwatches.com',      score: 84, status: 'complete', leaks: '$1,100', time: '1d ago' },
  { id: '4', url: 'ruggable.com',         score: 0,  status: 'running',  leaks: '—',      time: 'Now' },
];

const statCards = [
  {
    label: 'Revenue Recovered',
    value: '$24,800',
    delta: '+18%',
    up: true,
    icon: TrendingUp,
    accent: '#53F6FF',
  },
  {
    label: 'Active Leaks Found',
    value: '14',
    delta: '-3 this week',
    up: false,
    icon: AlertTriangle,
    accent: '#DB7245',
  },
  {
    label: 'Audits Run',
    value: '38',
    delta: '+6 this month',
    up: true,
    icon: BarChart3,
    accent: '#093090',
  },
  {
    label: 'Fixes Applied',
    value: '29',
    delta: '76% success',
    up: true,
    icon: CheckCircle,
    accent: '#10374E',
  },
];

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#DB7245';
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
      <circle
        cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ - fill}
        strokeLinecap="round" transform="rotate(-90 34 34)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Good afternoon 👋</h2>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening with your stores today.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} {...fadeUp(0.08 * i)}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.accent + '18' }}
              >
                <card.icon size={18} style={{ color: card.accent }} />
              </div>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                card.up ? 'text-emerald-600 bg-emerald-50' : 'text-[#DB7245] bg-orange-50'
              )}>
                {card.delta}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart + Recent audits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div {...fadeUp(0.2)} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
              <p className="text-sm text-slate-500">Last 7 months</p>
            </div>
            <span className="text-sm font-bold text-[#10374E]">{formatCurrency(35600)}<span className="text-slate-400 font-normal ml-1">this month</span></span>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#53F6FF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#53F6FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#53F6FF" strokeWidth={2.5} fill="url(#rev)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quick action */}
        <motion.div {...fadeUp(0.25)} className="bg-[#10374E] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#53F6FF]/15 flex items-center justify-center mb-4">
              <Zap size={22} className="text-[#53F6FF]" />
            </div>
            <h3 className="font-bold text-white text-lg font-display">Run an Audit</h3>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">Detect revenue leaks in your Shopify store in under 30 seconds.</p>
          </div>
          <Link
            href="/audits/new"
            className="mt-6 flex items-center justify-center gap-2 w-full bg-[#53F6FF] text-[#10374E] font-semibold text-sm py-3 rounded-xl hover:bg-white transition-colors"
          >
            Start New Audit <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>

      {/* Recent audits */}
      <motion.div {...fadeUp(0.3)} className="bg-white rounded-2xl border border-slate-200/80">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Audits</h3>
          <Link href="/audits" className="text-xs text-[#093090] font-medium hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentAudits.map((audit, i) => (
            <motion.div
              key={audit.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <ScoreRing score={audit.score} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{audit.url}</p>
                <p className="text-xs text-slate-500 mt-0.5">{audit.time}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#DB7245]">{audit.leaks}</p>
                <p className="text-xs text-slate-400">leaks</p>
              </div>
              <span className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium',
                audit.status === 'complete'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              )}>
                {audit.status === 'running' ? '⏳ Running' : '✓ Complete'}
              </span>
              {audit.status === 'complete' && (
                <Link href={`/audits/${audit.id}`} className="text-slate-400 hover:text-[#093090] transition-colors">
                  <ArrowRight size={16} />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
