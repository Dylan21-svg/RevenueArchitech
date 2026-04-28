import { redirect } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 navy-gradient flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#53F6FF] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10374E" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span className="text-white font-display font-bold text-lg">RevenueArchitect</span>
        </div>

        <div>
          <blockquote className="text-white/80 text-xl leading-relaxed font-light mb-6">
            "We found <span className="text-[#53F6FF] font-semibold">$8,400 / month</span> in revenue leaks in our first audit. The ROI was immediate."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">JM</div>
            <div>
              <p className="text-white font-medium text-sm">James Morrison</p>
              <p className="text-white/50 text-xs">Founder, ModernThread</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avg. Revenue Recovered', value: '$12K+' },
            { label: 'Audits Run',             value: '1,200+' },
            { label: 'Fix Success Rate',        value: '94%' },
          ].map((s) => (
            <div key={s.label} className="bg-white/8 rounded-xl p-4">
              <p className="text-[#53F6FF] font-bold text-xl">{s.value}</p>
              <p className="text-white/50 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
