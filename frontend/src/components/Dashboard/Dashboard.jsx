import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  XCircle, DollarSign, ShoppingCart, Users, Zap, ArrowUpRight,
  BookOpen
} from 'lucide-react';
import useStore from '../../store/useStore';
import { useThemeStore } from '../../store/useTheme';
import { format } from 'date-fns';

// ============================================================================
// SCORE CARDS
// ============================================================================

const ScoreCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const { isDark } = useThemeStore();
  
  const colorClasses = {
    blue: isDark 
      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
      : 'bg-blue-50 border-blue-200 text-blue-600',
    green: isDark 
      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
      : 'bg-green-50 border-green-200 text-green-600',
    red: isDark 
      ? 'bg-crimson-500/20 border-crimson-500/30 text-crimson-400' 
      : 'bg-red-50 border-red-200 text-red-600',
    yellow: isDark 
      ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
      : 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: isDark 
      ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' 
      : 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`p-6 rounded-2xl border backdrop-blur-md transition-all ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-70">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-sm mt-1 opacity-60">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-80" />}
      </div>
      {trend && (
        <div className={`flex items-center mt-3 text-sm ${trend > 0 ? (isDark ? 'text-emerald-400' : 'text-green-600') : (isDark ? 'text-crimson-400' : 'text-red-600')}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// AUDIT SCORE VISUALIZATION
// ============================================================================

const AuditScoreGauge = ({ score, label }) => {
  const getColor = (s) => {
    if (s >= 80) return '#10b981'; // green
    if (s >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const percentage = Math.min(100, Math.max(0, score));
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64" cy="64" r="56"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <circle
            cx="64" cy="64" r="56"
            fill="none"
            stroke={getColor(score)}
            strokeWidth="12"
            strokeDasharray={`${(percentage / 100) * 352} 352`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
};

// ============================================================================
// THUMB ZONE VISUALIZATION
// ============================================================================

// ============================================================================
// REVENUE LEAK SCORE GAUGE
// ============================================================================

const LeakScoreGauge = ({ score, categoryScores }) => {
  const { isDark } = useThemeStore();
  
  const getColor = (s) => {
    if (s <= 30) return '#10b981'; // Low leak (good)
    if (s <= 60) return '#f59e0b'; // Medium leak
    return '#ef4444'; // High leak (bad)
  };

  const percentage = Math.min(100, Math.max(0, score));
  
  return (
    <div className={`p-8 rounded-3xl border backdrop-blur-xl flex flex-col items-center justify-center ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'
    }`}>
      <h3 className={`text-lg font-bold mb-6 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Revenue Leak Score
      </h3>
      
      <div className="relative w-48 h-48 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96" cy="96" r="88"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            strokeWidth="12"
          />
          <motion.circle
            initial={{ strokeDasharray: "0 553" }}
            animate={{ strokeDasharray: `${(percentage / 100) * 553} 553` }}
            transition={{ duration: 2, ease: "easeOut" }}
            cx="96" cy="96" r="88"
            fill="none"
            stroke={getColor(score)}
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-6xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {Math.round(score)}
          </motion.span>
          <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Leakage
          </span>
        </div>
      </div>

      <div className="w-full space-y-4">
        {Object.entries(categoryScores || {}).map(([category, s], idx) => (
          <div key={category} className="space-y-1">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{category}</span>
              <span className={isDark ? 'text-white' : 'text-slate-900'}>{Math.round(s * 100)}% Health</span>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${s * 100}%` }}
                transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                className={`h-full rounded-full ${
                  s > 0.7 ? 'bg-emerald-500' : s > 0.4 ? 'bg-amber-500' : 'bg-crimson-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// REVENUE IMPACT METRICS
// ============================================================================

const RevenueImpactCard = ({ wastedAdSpend, revenueDrop, bounceRate }) => {
  const formatCurrency = (val) => `$${val.toLocaleString()}`;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Revenue Impact Analysis</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <DollarSign className="w-8 h-8 mx-auto text-red-600 mb-2" />
          <p className="text-2xl font-bold text-red-600">{formatCurrency(wastedAdSpend)}</p>
          <p className="text-sm text-red-600">Wasted Ad Spend</p>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <TrendingDown className="w-8 h-8 mx-auto text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(revenueDrop)}</p>
          <p className="text-sm text-orange-600">Revenue Drop</p>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <Users className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{Math.round(bounceRate * 100)}%</p>
          <p className="text-sm text-yellow-600">Bounce Rate</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FRICTION ANALYSIS
// ============================================================================

// ============================================================================
// PERFORMANCE METRICS SNAPSHOT
// ============================================================================

const PerformanceSnapshot = ({ loadTime, bounceRate, wastedSpend }) => {
  const { isDark } = useThemeStore();
  
  return (
    <div className={`p-8 rounded-3xl border backdrop-blur-xl ${
      isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-lg'
    }`}>
      <h3 className={`text-lg font-bold mb-8 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Performance Signals
      </h3>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Zap className={`w-7 h-7 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Load Speed</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{loadTime?.toFixed(2)}s</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <ArrowUpRight className={`w-7 h-7 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bounce Velocity</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.round(bounceRate)}%</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-crimson-500/10' : 'bg-crimson-50'}`}>
            <DollarSign className={`w-7 h-7 ${isDark ? 'text-crimson-400' : 'text-crimson-600'}`} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Wasted Ad Spend</p>
            <p className={`text-2xl font-black text-crimson-500`}>${Math.round(wastedSpend)}/day</p>
          </div>
        </div>
      </div>

      <div className={`mt-10 p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="font-bold text-blue-500">Analysis:</span> Your store is losing potential customers primarily due to high friction in the early stage of the funnel.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// SIMPLIFIED PROBLEMS FOUND SECTION
// ============================================================================

const ProblemsFound = ({ audit }) => {
  const { isDark } = useThemeStore();
  
  if (!audit) return null;

  // Extract fixes from the new pipeline report
  const report = audit.report || {};
  const topFixes = report.top_fixes || [];

  if (topFixes.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`border rounded-2xl p-6 backdrop-blur-md ${
          isDark 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-green-50 border-green-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDark ? 'bg-emerald-500/20' : 'bg-green-100'
            }`}
          >
            <CheckCircle className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-green-600'}`} />
          </motion.div>
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-green-800'}`}>
              Great news! No major problems found.
            </h3>
            <p className={`text-sm ${isDark ? 'text-emerald-300/70' : 'text-green-700'}`}>
              Your store is performing well. Keep monitoring with regular audits.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          High-Priority Fixes
        </h3>
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            isDark 
              ? 'bg-crimson-500/20 text-crimson-400 border border-crimson-500/30' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          {topFixes.length} Actionable Issues
        </motion.span>
      </div>

      {topFixes.map((fix, index) => (
        <motion.div 
          key={fix.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.01 }}
          className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
            isDark 
              ? 'bg-white/5 border-white/20' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-start gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}
            >
              <Zap className={`w-5 h-5 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`font-semibold text-lg ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {fix.title}
                </h4>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${
                  fix.deployment_mode === 'auto-fix' 
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {fix.deployment_mode}
                </span>
              </div>
              
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {fix.suggested_fix}
              </p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Confidence
                  </p>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {Math.round(fix.confidence * 100)}% Match
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-600/60' : 'text-emerald-600/60'}`}>
                    Estimated Lift
                  </p>
                  <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    +{Math.round(fix.expected_metric_improvement * 100)}% CVR
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <button className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  fix.deployment_mode === 'auto-fix'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                  {fix.deployment_mode === 'auto-fix' ? 'Execute Fix' : 'View Implementation'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const Dashboard = () => {
  const { 
    currentStore, 
    currentAudit, 
    auditHistory, 
    revenueAnalytics,
    runAudit, 
    fetchAuditHistory,
    fetchRevenueAnalytics 
  } = useStore();
  
  const { isDark } = useThemeStore();

  const [urlInput, setUrlInput] = useState('');
  const [adSpend, setAdSpend] = useState(1000);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (currentStore) {
      fetchAuditHistory(currentStore.id);
      fetchRevenueAnalytics(currentStore.id);
    }
  }, [currentStore]);

  const handleRunAudit = async () => {
    if (!urlInput) return;
    setIsRunningAudit(true);
    try {
      await runAudit(urlInput, adSpend);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Sample data for charts (would come from API in production)
  const revenueData = [
    { month: 'Jan', revenue: 4000, adSpend: 2400 },
    { month: 'Feb', revenue: 3000, adSpend: 1398 },
    { month: 'Mar', revenue: 2000, adSpend: 9800 },
    { month: 'Apr', revenue: 2780, adSpend: 3908 },
    { month: 'May', revenue: 1890, adSpend: 4800 },
    { month: 'Jun', revenue: 2390, adSpend: 3800 },
  ];

  const conversionData = [
    { name: 'Direct', value: 400 },
    { name: 'Organic', value: 300 },
    { name: 'Paid', value: 300 },
    { name: 'Social', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className={`p-6 space-y-6 min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-midnight-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={`text-3xl font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Dashboard
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
            {currentStore ? `Connected Store: ${currentStore.shop_domain}` : 'No store connected'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-white/10' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Help
          </motion.button>
          <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      </motion.div>

      {/* Help Banner */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border rounded-2xl p-4 backdrop-blur-md ${
              isDark 
                ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </motion.div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                    New to RevenueArchitect?
                  </p>
                  <p className={`text-sm ${isDark ? 'text-blue-300/70' : 'text-blue-600'}`}>
                    Learn how to connect your store and fix problems to increase sales.
                  </p>
                </div>
              </div>
              <motion.a 
                whileHover={{ scale: 1.05 }}
                href="#/help" 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Open Help Center
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Audit Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className={`p-6 rounded-2xl border backdrop-blur-md transition-all ${
          isDark 
            ? 'bg-white/5 border-white/20' 
            : 'bg-white border-gray-200'
        }`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Run New Audit
        </h2>
        <div className="flex gap-4 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Enter store URL (e.g., https://mystore.myshopify.com)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            placeholder="Daily Ad Spend"
            value={adSpend}
            onChange={(e) => setAdSpend(Number(e.target.value))}
            className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleRunAudit}
            disabled={isRunningAudit || !urlInput}
            className={`px-6 py-2 rounded-lg font-medium ${
              isRunningAudit || !urlInput
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunningAudit ? 'Running...' : 'Run Audit'}
          </button>
        </div>
      </motion.div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard 
          title="Total Audits" 
          value={auditHistory.length} 
          subtitle="All time"
          icon={Zap}
          color="blue"
        />
        <ScoreCard 
          title="Avg. Bounce Rate" 
          value={currentAudit ? `${Math.round(currentAudit.bounce_rate * 100)}%` : 'N/A'}
          trend={-5}
          icon={Users}
          color="yellow"
        />
        <ScoreCard 
          title="Wasted Ad Spend" 
          value={currentAudit ? `$${Math.round(currentAudit.wasted_ad_spend)}` : 'N/A'}
          subtitle="This month"
          icon={DollarSign}
          color="red"
        />
        <ScoreCard 
          title="Revenue Impact" 
          value={currentAudit ? `$${Math.round(currentAudit.revenue_drop)}` : 'N/A'}
          subtitle="Estimated loss"
          icon={TrendingDown}
          color="purple"
        />
      </div>

      {/* Simplified Problems Found Section */}
      {currentAudit && <ProblemsFound audit={currentAudit} />}

      {/* Current Audit Results */}
      {currentAudit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <LeakScoreGauge 
            score={currentAudit.report?.leak_score || currentAudit.leak_score || 0} 
            categoryScores={currentAudit.report?.category_scores} 
          />
          <PerformanceSnapshot 
            loadTime={currentAudit.report?.category_scores?.load_time || currentAudit.load_time}
            bounceRate={currentAudit.bounce_rate}
            wastedSpend={currentAudit.report?.estimated_impact?.wasted_daily_spend || currentAudit.wasted_ad_spend}
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Ad Spend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="adSpend" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Sources */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Conversion Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit History Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Audits</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium">URL</th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Bounce Rate</th>
                <th className="text-left py-3 px-4 font-medium">Wasted Spend</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {auditHistory.slice(0, 5).map((audit) => (
                <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{audit.url}</td>
                  <td className="py-3 px-4">{format(new Date(audit.created_at), 'MMM d, yyyy')}</td>
                  <td className="py-3 px-4">{Math.round(audit.bounce_rate * 100)}%</td>
                  <td className="py-3 px-4">${Math.round(audit.wasted_ad_spend)}</td>
                  <td className="py-3 px-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;