import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Zap, AlertTriangle, TrendingUp, Sun, Moon, ArrowRight,
  ChevronDown, Check, X, Shield, Activity, DollarSign, BarChart3, Target, Crosshair
} from 'lucide-react';
import { useThemeStore } from '../../store/useTheme';

const Landing = ({ onGetStarted }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const [revenueInput, setRevenueInput] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    { q: 'How does Ghost Recon find my rivals?', a: 'It uses AI to analyze market positioning and auto-discovers competitors based on your niche and traffic.' },
    { q: 'Is the Theme Mirror safe?', a: 'Yes, it operates in a sandboxed environment and does not alter your live theme until you explicitly publish changes.' },
    { q: 'How do you calculate $W_?', a: 'We measure wasted ad spend by correlating your bounce rates on paid traffic with known conversion bottlenecks.' },
    { q: 'What is the Certainty Gap?', a: 'The gap between what users expect to see based on your ads, and what your landing page actually delivers.' }
  ];

  const glassCardClasses = `rounded-[1.5rem] transition-all duration-300 ${
    isDark 
      ? 'bg-white/10 backdrop-blur-md border border-white/20' 
      : 'bg-white border border-slate-200 shadow-xl shadow-slate-200/50'
  }`;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${
      isDark ? 'bg-[#111827] text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background Gradient Mesh */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,_#1E3A8A_0%,_transparent_70%)] opacity-40 blur-3xl" />
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-slate-800 dark:bg-white rounded-md">
            <Zap className="w-5 h-5 text-white dark:text-[#111827]" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">REVENUEARCHITECT</span>
        </div>
        
        <div className={`hidden md:flex items-center gap-1 p-1 rounded-full ${
          isDark ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'bg-white border border-slate-200 shadow-sm'
        }`}>
          {['Forensic Audit', '4 Pillars', 'Battle Map', 'Chrome Extension', 'Demo'].map(link => (
            <a key={link} href="#" className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isDark ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
            }`}>
              {link}
            </a>
          ))}
          <button onClick={onGetStarted} className="ml-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-emerald-500/30">
            Start Audit
          </button>
        </div>

        <button onClick={toggleTheme} className={`p-2 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}>
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </nav>

      {/* Main Layout */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Hero Section */}
          <section className="text-center pt-8 md:pt-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              <Zap className="w-4 h-4" />
              Build For Your Shopify Store
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black font-heading leading-tight mb-6 tracking-tight">
              Audit Your Shopify Store <br/> for Commercial Negligence
            </h1>
            
            <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>
              We identify infrastructure failures and market disconnects costing you revenue.
            </p>
            
            <div className={`mx-auto flex items-center p-2 rounded-full max-w-md ${
              isDark ? 'bg-white/10 border border-white/20' : 'bg-white shadow-lg border border-slate-200'
            }`}>
              <input 
                type="text" 
                placeholder="Get my revenue forecast $" 
                className="flex-1 bg-transparent border-none outline-none px-4 text-sm md:text-base placeholder:text-slate-400"
                value={revenueInput}
                onChange={(e) => setRevenueInput(e.target.value)}
              />
              <button onClick={onGetStarted} className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                Get audit <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Hero Visuals */}
            <div className="mt-20 relative h-[300px] md:h-[400px] w-full flex items-center justify-center">
              {/* Decorative nodes */}
              <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity }} className={`absolute top-10 left-1/4 p-3 rounded-xl shadow-lg ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Activity className="w-5 h-5 text-blue-500"/></div>
              </motion.div>
              <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity }} className={`absolute bottom-20 right-1/4 p-3 rounded-xl shadow-lg ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white'}`}>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500"/></div>
              </motion.div>

              {/* Central Periscope/Magnifier */}
              <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-[12px] md:border-[16px] flex items-center justify-center shadow-2xl ${
                isDark ? 'border-slate-300 bg-sapphire-900/40 backdrop-blur-md shadow-emerald-500/20' : 'border-blue-600 bg-blue-50 shadow-blue-500/30'
              }`}>
                <div className={`w-[120%] h-[15px] absolute bottom-[-40px] -left-10 rotate-45 rounded-full ${
                  isDark ? 'bg-gradient-to-r from-slate-400 to-slate-200' : 'bg-blue-600'
                }`} />
                <Search className={`w-20 h-20 md:w-24 md:h-24 ${isDark ? 'text-white/50' : 'text-blue-500/50'}`} />
              </div>
            </div>
          </section>

          {/* 4 Pillars Section */}
          <section>
            <div className="text-center mb-8">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>4 Pillars</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Shield, title: 'Certainty Gap', category: 'Cognitive', desc: 'Audit Time to Value (TTV) against the "5-Second Rule".' },
                { icon: Target, title: 'Competitive Offset', category: 'Market', desc: 'Discover real time flaws and fixate duties against auto-discovered rivals.' },
                { icon: Crosshair, title: 'Narrative Disconnect', category: 'Marketing', desc: 'Analyze landing page copy alignment against ad-copy trends.' },
                { icon: Activity, title: 'Micro-Friction', category: 'Infrastructure', desc: 'Measure Mobile "Interactive Readiness". Calculate revenue drop per 100ms over 2.5s.' }
              ].map((pillar) => (
                <div key={pillar.title} className={`${glassCardClasses} p-5 flex flex-col items-center text-center`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
                    isDark ? 'bg-crimson-400/20 text-crimson-400' : 'bg-red-50 text-red-500'
                  }`}>
                    <pillar.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pillar.category}</span>
                  <h3 className="font-bold mb-2">{pillar.title}</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pillar.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Built to Help Grid (Bento) */}
          <section>
            <div className="text-center mb-8">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>SanePts</span>
              <h2 className="text-2xl md:text-3xl font-bold font-heading mt-2">Built to Help Grid</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Monthly Leakage */}
              <div className={`${glassCardClasses} p-6 col-span-1 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className={`w-5 h-5 ${isDark ? 'text-[#EF4444]' : 'text-red-500'}`} />
                    <span className="font-bold">Total Monthly Leakage</span>
                  </div>
                  <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fixing red numbers like</p>
                  <div className={`text-4xl md:text-5xl font-black mb-4 ${isDark ? 'text-[#EF4444] drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-red-600'}`}>
                    -$14,582.40
                  </div>
                </div>
                <div>
                  <div className="font-bold mb-1">Total Trend</div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>The sum of your infrastructural flaws.</p>
                </div>
              </div>

              {/* Middle Column */}
              <div className="col-span-1 flex flex-col gap-6">
                <div className={`${glassCardClasses} p-6 flex-1`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold">Ghost Recon Engine</span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Zero-input competitor intelligence gathering.</p>
                </div>
                <div className={`${glassCardClasses} p-6 flex-1`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold">Reclaimed Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-500 mb-2">$5,200 Recovered</div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Verify lift after applying Power Moves.</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-1 flex flex-col gap-6">
                <div className={`${glassCardClasses} p-6 flex-1`}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="font-bold">Wasted Ad-Spend</span>
                  </div>
                  <div className="text-2xl font-bold mb-2">$Was = $XXX/day</div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quantified loss due to copy disconnects.</p>
                </div>
                <div className={`${glassCardClasses} p-6 flex-1`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold">Revenue Signal Network</span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>SMS/Whatsapp alerts for market defense.</p>
                </div>
              </div>

              {/* Full Width Bottom (One-Click Fix Bridge) */}
              <div className={`${glassCardClasses} p-6 col-span-1 md:col-span-3 flex flex-col md:flex-row items-center justify-between`}>
                <div className="mb-6 md:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-lg">One-Click Fix Bridge</span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Instantly create Theme Mirrors and inject cures.</p>
                </div>
                <button onClick={onGetStarted} className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-[#111827] shadow-[inset_0_0_20px_rgba(255,255,255,0.5),0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}>
                  Fix All Leaks
                  <span className="block text-xs font-normal opacity-80 mt-1">(Install Chrome Extension)</span>
                </button>
              </div>
            </div>
          </section>

          {/* Pricing Tiers (Horizontal) */}
          <section>
            <div className="text-center mb-8">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pricing Tiers</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'The Auditor', price: '$99', desc: 'Ongoing audits + Competitor tracking', features: ['Ongoing audits', 'Competitor tracking', 'Competitor & tracking'], btn: 'Get start now' },
                { name: 'The Architect', price: '$299', desc: 'One-click implementation + SMS Signals', features: ['All of Auditor features', 'AI Power Moves', 'Features + Power Moves'], btn: 'Get Architect now', highlight: true },
                { name: 'Enterprise', price: 'Performance-based', desc: 'Custom audit depth and strategy. Call for % fee of recovered revenue.', features: ['Specialized checklist', 'Custom auditing strategy', 'Call for % fee of recovered', 'Specialized checklist'], btn: 'Get start now' },
              ].map(plan => (
                <div key={plan.name} className={`${
                  plan.highlight 
                    ? isDark 
                      ? 'bg-black text-white border border-white/10 shadow-[0_15px_40px_rgba(6,78,59,0.5)] rounded-[1.5rem]' 
                      : 'bg-slate-900 text-white shadow-xl rounded-[1.5rem]'
                    : glassCardClasses
                } p-8 flex flex-col relative`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-black mb-2">{plan.price}<span className="text-lg font-normal text-slate-500">/mo</span></div>
                  <p className={`text-sm mb-6 ${plan.highlight ? 'text-slate-400' : isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>{plan.desc}</p>
                  
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm font-medium">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-3 rounded-full font-bold transition-all ${
                    plan.highlight 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                      : isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}>
                    {plan.btn}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Rival Matrix */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-heading">Rival Matrix</h2>
            </div>
            <div className={`${glassCardClasses} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={isDark ? 'bg-white/5' : 'bg-slate-50'}>
                    <tr>
                      <th className="p-4 text-left font-bold border-b border-white/10">My PDP <span className="font-normal opacity-70">(RevenueArchitect AI)</span></th>
                      <th className="p-4 text-center font-bold border-b border-white/10">Certainty Gap</th>
                      <th className="p-4 text-center font-bold border-b border-white/10">Price Delta</th>
                      <th className="p-4 text-center font-bold border-b border-white/10">Shipping Speed</th>
                      <th className="p-4 text-center font-bold border-b border-white/10">Mobile Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Aspirational Rival', c1: true, c2: false, c3: true, c4: true },
                      { name: 'Price Challenger', c1: true, c2: true, c3: true, c4: false },
                      { name: 'Ad-Spend Aggressor', c1: true, c2: true, c3: false, c4: true },
                    ].map((row, i) => (
                      <tr key={i} className={`border-b ${isDark ? 'border-white/10' : 'border-slate-100'} last:border-0`}>
                        <td className="p-4 flex items-center gap-3 font-medium">
                          <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700" />
                          {row.name}
                        </td>
                        <td className="p-4 text-center">{row.c1 ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />}</td>
                        <td className="p-4 text-center">{row.c2 ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />}</td>
                        <td className="p-4 text-center">{row.c3 ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />}</td>
                        <td className="p-4 text-center">{row.c4 ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Sidebar Elements) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Stepper Steps */}
          <div className="space-y-4">
            {[
              { num: '01', tag: 'Step 1', title: 'Scan & Sting:', desc: 'Input URLs and get the initial Forensic Audit.' },
              { num: '02', tag: '', title: 'Diagnose the Pillars:', desc: 'AI scores the 4 Commercial Pillars.' },
              { num: '03', tag: 'Step 3', title: 'Shadow-Dev Mirror:', desc: 'Install the extension and create a text theme mirror.' },
              { num: '04', tag: 'Step 4', title: 'Execute & Reclaim:', desc: 'Apply One-Click Power Moves and verify lift.' }
            ].map((step, i) => (
              <div key={i} className={`${glassCardClasses} p-6 flex gap-4 items-start`}>
                <div className={`text-4xl font-black ${isDark ? 'text-white/20' : 'text-slate-200'}`}>{step.num}</div>
                <div>
                  {step.tag && <div className="text-[10px] font-bold uppercase text-blue-500 bg-blue-500/10 inline-block px-2 py-0.5 rounded-full mb-1">{step.tag}</div>}
                  <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                  <p className={`text-xs ${isDark ? 'text-[#9CA3AF]' : 'text-slate-500'}`}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Calculator */}
          <div className={`${glassCardClasses} p-6`}>
            <div className="text-center mb-6">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Calculator</span>
              <h3 className="text-xl font-bold mt-1 leading-tight">How much can RevenueArchitect AI reclaim for your store?</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-sm font-medium">Daily Ad Spend</span>
                <div className="flex items-center">
                  <input type="text" defaultValue="3500" className="w-20 text-right bg-transparent outline-none font-bold mr-2" />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/mo</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-sm font-medium">Base CRO</span>
                <span className="text-sm font-bold text-emerald-500">0.6%</span>
              </div>
              <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-sm font-medium flex items-center gap-1">Est. Leakage % <div className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">?</div></span>
                <div className="flex items-center">
                  <input type="text" defaultValue="0" className="w-10 text-right bg-transparent outline-none font-bold mr-1" />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>%</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-sm font-medium">Reclaim Potential ($)</span>
                <button className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full text-sm font-bold">Reclaim</button>
              </div>
            </div>
          </div>

          {/* Sidebar Pricing Cards */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-center">Pricing Cards</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`${glassCardClasses} p-4`}>
                <h4 className="font-bold text-sm">The Auditor</h4>
                <div className="text-2xl font-black my-1">$99<span className="text-xs font-normal">/mo</span></div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-tight">Ongoing audits + Competitor tracking</p>
                <ul className="text-[10px] space-y-1 mb-4">
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500"/> Ongoing audits</li>
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500"/> Competitor tracking</li>
                </ul>
                <button className="w-full py-1.5 text-xs font-bold rounded-full bg-slate-100 dark:bg-white/10">Get start now</button>
              </div>
              <div className={`${glassCardClasses} p-4 ${isDark ? 'bg-black border-white/10 shadow-[0_10px_30px_rgba(6,78,59,0.5)]' : 'bg-slate-900 text-white'}`}>
                <h4 className="font-bold text-sm">The Architect</h4>
                <div className="text-2xl font-black my-1">$299<span className="text-xs font-normal">/mo</span></div>
                <p className="text-[10px] text-slate-400 mb-3 leading-tight">One-click implementation + SMS Signals</p>
                <ul className="text-[10px] space-y-1 mb-4">
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500"/> All Auditor features</li>
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500"/> AI Power Moves</li>
                </ul>
                <button className="w-full py-1.5 text-xs font-bold rounded-full bg-slate-800 dark:bg-emerald-500 dark:text-white">Get start now</button>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-center">FAQs</h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className={`${glassCardClasses} overflow-hidden`}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    className="w-full p-4 flex justify-between items-center text-left font-bold text-sm"
                  >
                    {faq.q}
                    <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="p-4 pt-0 text-sm text-slate-500 dark:text-slate-400">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Call-to-Action Sidebar */}
          <div className={`${glassCardClasses} p-8 text-center`}>
            <h3 className="text-xl font-bold mb-6">Call-to-Action</h3>
            <button onClick={onGetStarted} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full font-bold shadow-lg hover:opacity-90 transition-opacity">
              Scan My Store and Claim My Revenue
            </button>
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-800 dark:bg-white rounded flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white dark:text-[#111827]" />
                </div>
                <span className="font-bold text-sm tracking-widest uppercase">RevenueArchitect</span>
              </div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                $W_ Formula, Zero-input Engine, Shadow-Dev Bridge
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Landing;