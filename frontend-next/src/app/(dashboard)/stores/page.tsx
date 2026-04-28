'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as any } });

const stores = [
  {
    id: 's1', name: 'gymshark.com', audits: 6, trend: 'up',
    data: [{ v: 58 }, { v: 63 }, { v: 67 }, { v: 65 }, { v: 71 }, { v: 72 }],
    lastScore: 72, improvement: '+14 pts', lastDate: 'Apr 25',
  },
  {
    id: 's2', name: 'fashionnova.com', audits: 4, trend: 'down',
    data: [{ v: 70 }, { v: 66 }, { v: 61 }, { v: 58 }],
    lastScore: 58, improvement: '-12 pts', lastDate: 'Apr 24',
  },
  {
    id: 's3', name: 'mvmtwatches.com', audits: 3, trend: 'up',
    data: [{ v: 74 }, { v: 79 }, { v: 84 }],
    lastScore: 84, improvement: '+10 pts', lastDate: 'Apr 23',
  },
];

export default function StoresPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">Store History</h2>
          <p className="text-slate-500 text-sm mt-1">Score trends across all audited stores</p>
        </div>
      </motion.div>

      <div className="space-y-4">
        {stores.map((store, i) => (
          <motion.div
            key={store.id}
            {...fadeUp(0.1 + i * 0.08)}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-6">
              {/* Store info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-[#10374E]/8 flex items-center justify-center font-bold text-[#10374E]">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{store.name}</p>
                    <p className="text-xs text-slate-500">{store.audits} audits • Last: {store.lastDate}</p>
                  </div>
                </div>
              </div>

              {/* Trend sparkline */}
              <div className="w-32 h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={store.data}>
                    <Line
                      type="monotone" dataKey="v" strokeWidth={2} dot={false}
                      stroke={store.trend === 'up' ? '#34d399' : '#DB7245'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Score + delta */}
              <div className="text-right w-28">
                <p className={cn(
                  'text-2xl font-bold',
                  store.lastScore >= 80 ? 'text-emerald-500' : store.lastScore >= 60 ? 'text-yellow-500' : 'text-[#DB7245]'
                )}>
                  {store.lastScore}
                </p>
                <div className={cn(
                  'flex items-center justify-end gap-1 text-xs font-medium',
                  store.trend === 'up' ? 'text-emerald-500' : 'text-[#DB7245]'
                )}>
                  {store.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {store.improvement}
                </div>
              </div>

              <Link
                href={`/audits?store=${store.id}`}
                className="flex items-center gap-1.5 text-sm text-[#093090] font-medium hover:underline whitespace-nowrap"
              >
                View audits <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
