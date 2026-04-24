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

const ThumbZoneVisualization = ({ thumbZoneResult }) => {
  if (!thumbZoneResult) return null;

  const { initial_viewport_score, post_scroll_score, best_state, best_score, recommendation } = thumbZoneResult;

  const states = [
    { name: 'Initial Viewport', score: initial_viewport_score?.overall_score * 100 || 0 },
    { name: 'Post Scroll', score: post_scroll_score?.overall_score * 100 || 0 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Thumb Zone Accessibility</h3>
      
      <div className="flex justify-around mb-6">
        {states.map((state) => (
          <AuditScoreGauge score={Math.round(state.score)} label={state.name} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Best State:</span> {best_state}
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Best Score:</span> {Math.round(best_score * 100)}
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">{recommendation}</p>
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

const FrictionAnalysis = ({ frictionWords, actionWords, microFriction }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Friction Analysis</h3>
      
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Micro-friction Score: {microFriction.toFixed(1)}%</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${microFriction > 5 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(100, microFriction * 10)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">Friction Words Found:</p>
          <div className="flex flex-wrap gap-2">
            {frictionWords.length > 0 ? (
              frictionWords.map((word) => (
                <span key={word} className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                  {word}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">None detected</span>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Action Words Found:</p>
          <div className="flex flex-wrap gap-2">
            {actionWords.length > 0 ? (
              actionWords.map((word) => (
                <span key={word} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                  {word}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">None detected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPETITOR COMPARISON
// ============================================================================

const CompetitorComparison = ({ competitorComparison, priceDelta, offerParity }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Competitor Insights</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Comparison:</span>
          <span>{competitorComparison}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Price Delta:</span>
          <span className={priceDelta > 0 ? 'text-green-600' : 'text-red-600'}>
            {priceDelta > 0 ? '+' : ''}{priceDelta}%
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Offer Parity:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            offerParity === 'Equal' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {offerParity}
          </span>
        </div>
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

  // Map technical results to simple language problems
  const problems = [];

  // Bounce rate problem
  if (audit.bounce_rate > 0.5) {
    problems.push({
      severity: 'critical',
      title: 'Visitors leave too quickly',
      description: `${Math.round(audit.bounce_rate * 100)}% of visitors leave without taking action. This means your page isn't grabbing attention or making people want to stay.`,
      impact: `You're losing approximately $${Math.round(audit.wasted_ad_spend)} daily in ad spend because visitors aren't converting.`,
      fix: 'Improve your headline, add better images, and make your value proposition clearer above the fold.'
    });
  }

  // Thumb zone problem
  if (audit.thumb_zone_result?.initial_viewport_score?.overall_score < 0.7) {
    problems.push({
      severity: 'critical',
      title: 'Important content is hard to reach',
      description: 'Your key information (prices, CTAs, product info) is hidden below the fold or requires too much scrolling on mobile.',
      impact: 'Mobile users (who are most buyers) can\'t see your main offer without extra effort.',
      fix: 'Move your most important content (headline, main CTA, key benefits) into the first screen view.'
    });
  }

  // Friction words problem
  if (audit.micro_friction > 5) {
    problems.push({
      severity: 'warning',
      title: 'Your copy has "stop" words',
      description: `Found ${audit.friction_words_found?.length || 0} words that make visitors hesitate (like "maybe", "条件", "需要").`,
      impact: 'These words create doubt and reduce conversion rates.',
      fix: 'Replace friction words with action-oriented language like "Get", "Start", "Join".'
    });
  }

  // Competitor comparison problem
  if (audit.competitor_comparison === 'underloaded') {
    problems.push({
      severity: 'warning',
      title: 'Your page has less info than competitors',
      description: 'Competitors show more trust signals, reviews, and offers than your page.',
      impact: 'Visitors may think your store is less trustworthy or established.',
      fix: 'Add more social proof, customer reviews, and trust badges to match competitor density.'
    });
  }

  // Offer parity problem
  if (audit.offer_parity !== 'Equal') {
    problems.push({
      severity: 'warning',
      title: 'Missing offers that competitors have',
      description: 'Your competitors are showing sales and discounts that you\'re not showing.',
      impact: 'Price-conscious visitors may choose competitors over you.',
      fix: 'Consider adding promotional offers, bundle deals, or limited-time discounts.'
    });
  }

  // Performance problem (mock check)
  if (audit.page_load_time > 3) {
    problems.push({
      severity: 'critical',
      title: 'Your page loads too slowly',
      description: `Your page takes ${audit.page_load_time?.toFixed(1) || '?'} seconds to load.`,
      impact: 'Slow pages cause visitors to leave before seeing your content.',
      fix: 'Optimize images, remove unnecessary apps, and consider a faster theme.'
    });
  }

  if (problems.length === 0) {
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
          Problems Found
        </h3>
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            isDark 
              ? 'bg-crimson-500/20 text-crimson-400 border border-crimson-500/30' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          {problems.filter(p => p.severity === 'critical').length} Critical
        </motion.span>
      </div>

      {problems.map((problem, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.01 }}
          className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
            problem.severity === 'critical' 
              ? isDark 
                ? 'bg-crimson-500/10 border-crimson-500/30' 
                : 'bg-red-50 border-red-200'
              : isDark 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                problem.severity === 'critical' 
                  ? isDark ? 'bg-crimson-500/20' : 'bg-red-200'
                  : isDark ? 'bg-amber-500/20' : 'bg-yellow-200'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${
                problem.severity === 'critical' 
                  ? isDark ? 'text-crimson-400' : 'text-red-700'
                  : isDark ? 'text-amber-400' : 'text-yellow-700'
              }`} />
            </motion.div>
            <div className="flex-1">
              <h4 className={`font-semibold text-lg ${
                problem.severity === 'critical' 
                  ? isDark ? 'text-crimson-400' : 'text-red-800'
                  : isDark ? 'text-amber-400' : 'text-yellow-800'
              }`}>
                {problem.title}
              </h4>
              <p className={`text-sm mt-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {problem.description}
              </p>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={`mt-4 p-4 rounded-xl ${
                  isDark ? 'bg-white/5' : 'bg-white/50'
                }`}
              >
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  💰 Impact: {problem.impact}
                </p>
              </motion.div>
              
              <div className="mt-4 flex items-center gap-2">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`flex-1 p-4 rounded-xl border ${
                    isDark 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <p className={`text-sm font-medium ${
                    isDark ? 'text-emerald-400' : 'text-blue-800'
                  }`}>
                    ✅ What to do next:
                  </p>
                  <p className={`text-sm mt-1 ${
                    isDark ? 'text-emerald-300/80' : 'text-blue-700'
                  }`}>
                    {problem.fix}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
                  <p className="text-sm text-blue-700 mt-1">{problem.fix}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThumbZoneVisualization thumbZoneResult={currentAudit.thumb_zone_result} />
          <RevenueImpactCard 
            wastedAdSpend={currentAudit.wasted_ad_spend}
            revenueDrop={currentAudit.revenue_drop}
            bounceRate={currentAudit.bounce_rate}
          />
        </div>
      )}

      {currentAudit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FrictionAnalysis 
            frictionWords={currentAudit.friction_words_found}
            actionWords={currentAudit.action_words_found}
            microFriction={currentAudit.micro_friction}
          />
          <CompetitorComparison 
            competitorComparison={currentAudit.competitor_comparison}
            priceDelta={currentAudit.price_delta}
            offerParity={currentAudit.offer_parity}
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