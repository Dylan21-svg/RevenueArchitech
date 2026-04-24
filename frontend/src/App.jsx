import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Bell, Bookmark, Home as HomeIcon, Activity, Settings, Users,
  TrendingUp, TrendingDown, Target, Zap, ChevronDown, LayoutTemplate,
  BarChart3, MousePointerClick, RefreshCcw, Filter
} from 'lucide-react';
import { 
  AreaChart, Area, ResponsiveContainer 
} from 'recharts';
import { supabase } from './services/supabase';
import { useStore } from './store/useStore';

// --- Utility Components ---

// Smooth number counter for metrics
const CountUp = ({ to, duration = 2, prefix = "", suffix = "", decimals = 0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / (duration * 1000), 1);
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(to * ease);
      if (percentage < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [to, duration]);
  return <span className="metric-number">{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

// Container for staggered grid items
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const GlassCard = ({ children, className = "", noHover = false }) => (
  <motion.div 
    variants={staggerItem}
    whileHover={!noHover ? { scale: 1.01, boxShadow: "0 15px 35px -10px rgba(15,23,42,0.08)" } : {}}
    className={`glass-panel p-6 bg-white/60 ${className}`}
  >
    {children}
  </motion.div>
);

// --- SVG Flux Stream Component ---
const FluxStreamVisualizer = () => {
  return (
    <div className="relative w-full h-[260px] mt-8">
      {/* Background Grid Lines for architecture feel */}
      <div className="absolute inset-0 border-b border-slate-200/40" style={{ top: '25%' }} />
      <div className="absolute inset-0 border-b border-slate-200/40" style={{ top: '50%' }} />
      <div className="absolute inset-0 border-b border-slate-200/40" style={{ top: '75%' }} />
      
      {/* SVG Wave Streams */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
        <defs>
          <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00B4B4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00B4B4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00B4B4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Teal Stream (Main Flow) */}
        <motion.path 
          d="M0,40 Q150,40 250,100 T500,80 T750,140 T1000,160"
          fill="none" stroke="url(#tealGrad)" strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.path 
          d="M0,40 Q150,40 250,100 T500,80 T750,140 T1000,160 L1000,200 L0,200 Z"
          fill="url(#tealFill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        />

        {/* Purple Stream (Secondary/Leak Flow) */}
        <motion.path 
          d="M0,140 Q150,150 250,180 T500,120 T750,170 T1000,190"
          fill="none" stroke="#A855F7" strokeWidth="2" strokeDasharray="6 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
        />
        
        {/* Animated Flow Particles */}
        <motion.circle r="4" fill="#00B4B4">
          <motion.animateMotion dur="4s" repeatCount="indefinite" path="M0,40 Q150,40 250,100 T500,80 T750,140 T1000,160" />
        </motion.circle>
      </svg>

      {/* Nodes and Labels */}
      <div className="absolute inset-0 flex justify-between px-[2%] items-end pb-0 text-xs font-medium text-slate-400">
        <span className="w-16 text-center">Visits</span>
        <span className="w-24 text-center">Product Views</span>
        <span className="w-16 text-center">Cart</span>
        <span className="w-16 text-center">Checkout</span>
        <span className="w-16 text-center">Purchase</span>
      </div>

      {/* Holographic Overlays */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
        className="absolute glass-panel p-3 left-[28%] top-[25%] flex flex-col items-center z-10 before:content-[''] before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:border-[5px] before:border-transparent before:border-t-white/90"
      >
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Add to Cart rate</span>
        <span className="text-xl font-bold font-mono text-slate-800">8.1%</span>
        <div className="absolute -bottom-3 w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
        className="absolute glass-panel p-3 left-[70%] top-[45%] flex flex-col items-center z-10 before:content-[''] before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:border-[5px] before:border-transparent before:border-t-white/90"
      >
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Revenue</span>
          <TrendingUp size={12} className="text-[#10B981]"/>
        </div>
        <span className="text-2xl font-bold font-mono text-slate-800">(345k)</span>
        <div className="absolute -bottom-3 w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
      </motion.div>
    </div>
  );
};


// --- Main Application ---
const ArchitectDashboard = () => {
  const sparklineData1 = [{ v: 2.1 }, { v: 2.2 }, { v: 2.3 }, { v: 2.2 }, { v: 2.4 }, { v: 2.6 }];
  const sparklineData2 = [{ v: 4000 }, { v: 3800 }, { v: 3600 }, { v: 3500 }, { v: 3300 }, { v: 3150 }];

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      
      {/* Background container for the main app UI */}
      <div className="fixed inset-0 pointer-events-none z-[-1] flex items-center justify-center p-4">
        <div className="w-full h-full bg-white/40 backdrop-blur-3xl rounded-[2rem] border border-white/60 shadow-2xl overflow-hidden" />
      </div>

      {/* A. Global Navigation & User Header */}
      <header className="h-[72px] flex items-center justify-between px-6 z-30 border-b border-slate-200/50 mx-4 mt-4 bg-white/50 backdrop-blur-xl rounded-t-[2rem]">
        <div className="flex items-center gap-3 w-64">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-primary to-purple-soft flex items-center justify-center text-white shadow-md">
            <Target size={20} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[19px] font-heading text-slate-900 tracking-tight">RevenueArchitect AI</span>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-slate-200/60 shadow-sm">
          {['Dashboard', 'Audit', 'Optimization', 'Insights', 'Team', 'Settings'].map((item, idx) => (
            <button 
              key={item} 
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                idx === 0 
                  ? 'bg-white shadow-sm text-teal-primary border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5 w-64 justify-end">
          <div className="hidden lg:flex items-center gap-2 inset-shadow rounded-full px-4 py-2 w-48 transition-all focus-within:ring-2 ring-teal-primary/20">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search..." className="bg-transparent outline-none border-none text-sm w-full placeholder:text-slate-400 text-slate-800" />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative text-slate-400 hover:text-slate-700 transition-colors">
              <Bell size={22} />
              <span className="absolute 0 right-0 w-2.5 h-2.5 border-2 border-white bg-crimson-leak rounded-full" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <img src="https://i.pravatar.cc/150?u=sarah" alt="Sarah Johnson" className="w-10 h-10 rounded-full border-2 border-white shadow-sm group-hover:border-teal-primary/20 transition-all" />
              <div className="hidden sm:block text-left">
                <div className="text-sm font-bold text-slate-800 leading-none mb-1">Sarah Johnson</div>
                <div className="text-[11px] text-slate-500 font-semibold">Head of Growth <ChevronDown size={12} className="inline ml-0.5 relative top-[-1px]"/></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative z-10 mx-4 mb-4 bg-white/40 backdrop-blur-xl rounded-b-[2rem] border-x border-b border-white/60">
        
        {/* E. Left Navigation Bar */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col border-r border-slate-200/50 p-6 pt-8 gap-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">Main Menu</div>
          {[
            { icon: HomeIcon, label: "Home", active: true },
            { icon: Filter, label: "Funnel Audit" },
            { icon: LayoutTemplate, label: "Page Performance" },
            { icon: Activity, label: "Customer Journeys" },
            { icon: Settings, label: "Settings" }
          ].map((item, i) => (
            <button key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative font-semibold text-sm ${
              item.active 
                ? 'bg-white shadow-sm border border-slate-200 text-teal-primary' 
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
            }`}>
              <item.icon size={18} strokeWidth={item.active ? 2.5 : 2} />
              {item.label}
              {item.active && <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-teal-primary rounded-r-full" />}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden">
          
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-[1300px] mx-auto space-y-6">
            
            {/* B. The Audit Entry Bar (Hero section with gradient) */}
            <motion.div variants={staggerItem} className="w-full relative z-20 mb-8 p-8 rounded-[2rem] bg-gradient-to-r from-[#F0FDF4] via-[#F0F9FF] to-[#FAF5FF] border border-white shadow-sm">
              <h1 className="text-3xl font-heading text-slate-900 mb-6 flex items-center gap-2">
                Convert Traffic into Revenue: <span className="text-slate-500 font-medium">Analyze www.lumosapparel.com</span>
              </h1>
              
              <div className="glass-panel p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 bg-white/90">
                <div className="flex-1 w-full inset-shadow rounded-xl px-5 py-3.5 flex items-center gap-3">
                  <Search size={20} className="text-slate-400" />
                  <input 
                    type="text" 
                    defaultValue="lumosapparel.com" 
                    className="bg-transparent border-none outline-none w-full text-slate-800 font-semibold text-lg placeholder:text-slate-400"
                  />
                </div>
                <button className="emerald-action px-8 py-3.5 rounded-xl font-heading text-[17px] flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center">
                  <Zap size={20} fill="currentColor" />
                  Start Conversion Audit
                </button>
              </div>
            </motion.div>

            {/* C. The Main Analytics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (8 cols on XL) */}
              <div className="col-span-1 xl:col-span-8 space-y-6">
                
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Store Conversion Rate */}
                  <GlassCard>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Store Conversion</span>
                      <div className="px-2 py-0.5 rounded-md bg-emerald-success/10 text-emerald-success text-[11px] font-bold flex items-center gap-1">
                        <TrendingUp size={12} strokeWidth={3}/> +0.9%
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-3 mt-1">
                      <CountUp to={2.6} decimals={1} suffix="%" />
                    </div>
                    <div className="h-[45px] w-full mt-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData1}>
                          <Area type="monotone" dataKey="v" stroke="#10B981" fill="url(#emeraldFill)" strokeWidth={2.5} />
                          <defs>
                            <linearGradient id="emeraldFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  {/* Revenue Leak Score */}
                  <GlassCard>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Revenue Leak Score</span>
                      <BarChart3 size={18} className="text-teal-primary" />
                    </div>
                    <div className="flex items-baseline gap-1 mb-2 mt-1">
                      <div className="text-4xl font-bold text-slate-900"><CountUp to={82}/></div>
                      <div className="text-xl font-bold text-slate-400">/100</div>
                    </div>
                    <div className="text-[13px] font-bold text-teal-primary mb-4 flex items-center gap-1">
                       <Target size={14}/> High Opportunity
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2.5 mt-auto overflow-hidden inset-shadow">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: '82%' }} transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="h-full bg-teal-primary rounded-full"
                      />
                    </div>
                  </GlassCard>

                  {/* Wasted Ad Spend */}
                  <GlassCard>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Wasted Ad Spend</span>
                      <div className="px-2 py-0.5 rounded-md bg-crimson-leak/10 text-crimson-leak text-[11px] font-bold flex items-center gap-1">
                        <TrendingDown size={12} strokeWidth={3}/> -12%
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-crimson-leak mb-3 mt-1">
                      <CountUp to={3150} prefix="$" duration={2.5} />
                    </div>
                    <div className="h-[45px] w-full mt-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData2}>
                          <Area type="monotone" dataKey="v" stroke="#A855F7" fill="url(#purpleFill)" strokeWidth={2.5} />
                          <defs>
                            <linearGradient id="purpleFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#A855F7" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>

                {/* The Live Conversion Funnel (The Flux Stream) */}
                <GlassCard className="pb-8">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h2 className="font-heading text-xl text-slate-900">Live Conversion Funnel & Stream Analysis</h2>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-600 bg-white shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                      <TrendingUp size={16} className="text-teal-primary" /> Last 30 Days <ChevronDown size={14}/>
                    </button>
                  </div>
                  <FluxStreamVisualizer />
                </GlassCard>

              </div>

              {/* D. Top Fixes & Opportunities (Right 4 Cols on XL) */}
              <div className="col-span-1 xl:col-span-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading text-xl text-slate-900">Top Fixes</h3>
                  <button className="text-sm font-bold text-teal-primary hover:text-teal-700">View All</button>
                </div>
                
                {[
                  { title: "Optimize Mobile Checkout Speed", priority: "High", val: "+$12,400/mo", action: "Implement Now", icon: Zap },
                  { title: "Fix Cart Abandonment Sequence", priority: "High", val: "+$9,100/mo", action: "Setup Now", icon: RefreshCcw },
                  { title: "Improve Product Page CTR", priority: "Medium", val: "+$5,800/mo", action: "Analyze", outline: true, icon: MousePointerClick }
                ].map((fix, idx) => (
                  <GlassCard key={idx} delay={0.2 + (idx * 0.1)} className="p-5 flex flex-col gap-4 group hover:border-teal-primary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl mt-0.5 ${fix.priority === 'High' ? 'bg-crimson-leak/10 text-crimson-leak' : 'bg-orange-500/10 text-orange-500'}`}>
                        <fix.icon size={18} strokeWidth={2.5}/>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight mb-1">{fix.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${fix.priority === 'High' ? 'bg-crimson-leak/10 text-crimson-leak' : 'bg-orange-100 text-orange-600'}`}>
                            {fix.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Value Reclamation</span>
                        <span className="text-emerald-success font-bold font-mono text-lg tracking-tight">{fix.val}</span>
                      </div>
                      <button className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                        ${fix.outline ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-700 hover:border-blue-300'}`}>
                        {fix.action}
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>

            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const { setAuth } = useStore();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session);
    });

    return () => subscription.unsubscribe();
  }, [setAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/*" element={<ArchitectDashboard />} />
      </Routes>
    </Router>
  );
}
