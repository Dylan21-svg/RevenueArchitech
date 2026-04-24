import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, ChevronRight, Play, BarChart3, Store, 
  FlaskConical, AlertTriangle, CheckCircle, ArrowRight,
  Zap, Target, TrendingUp, Shield, Clock, DollarSign
} from 'lucide-react';

const Help = () => {
  const sections = [
    {
      id: 'what-is',
      title: 'What is RevenueArchitect?',
      icon: BookOpen,
      content: `RevenueArchitect is your Shopify store's diagnostic tool that identifies problems 
        hurting your sales and provides clear steps to fix them. Think of it as a doctor for your 
        online store - it runs a thorough check-up and tells you exactly what's wrong and what to do next.`
    },
    {
      id: 'problems',
      title: 'Understanding Your Audit Results',
      icon: AlertTriangle,
      content: `When you run an audit, we check your store for issues that cost you money. 
        Each problem is explained in simple terms with a clear "What to Do Next" action.`,
      subsections: [
        {
          title: '🔴 Critical Issues',
          description: 'These are urgent problems that are actively losing you sales right now. Fix these first!'
        },
        {
          title: '🟡 Warnings',
          description: 'These issues hurt your conversion but can be fixed over time.'
        },
        {
          title: '🟢 Good',
          description: 'Your store is doing well in this area. Keep it up!'
        }
      ]
    },
    {
      id: 'connect-store',
      title: 'Connecting Your Store',
      icon: Store,
      content: `Connecting your Shopify store takes less than 2 minutes:`,
      steps: [
        'Go to the Stores page',
        'Click "Add Store"',
        'Enter your store domain (e.g., yourstore.myshopify.com)',
        'Authorize the connection via Shopify',
        'Start running audits!'
      ]
    },
    {
      id: 'run-audit',
      title: 'How to Run an Audit',
      icon: Zap,
      content: `Running an audit is simple:`,
      steps: [
        'Make sure you have a store connected',
        'Go to Dashboard',
        'Enter your store URL',
        'Enter your daily ad spend (optional - helps calculate potential losses)',
        'Click "Run Audit" and wait for results'
      ]
    },
    {
      id: 'ab-testing',
      title: 'A/B Testing Explained',
      icon: FlaskConical,
      content: `A/B Testing lets you compare two versions of your store to see which one sells better.`,
      subsections: [
        {
          title: 'Why it matters:',
          description: 'Small changes can lead to big revenue increases. A/B testing takes the guesswork out of what works.'
        },
        {
          title: 'How to use:',
          description: 'Create a test, define what you want to change (headline, button color, images), and let the test run. The winner gets implemented automatically.'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics Explained',
      icon: BarChart3,
      content: `Analytics shows you how your store is performing over time.`,
      subsections: [
        {
          title: 'What you can track:',
          description: 'Revenue trends, conversion rates, traffic sources, and revenue vs ad spend.'
        },
        {
          title: 'Why it matters:',
          description: 'Data helps you make informed decisions. See what\'s working and what\'s not.'
        }
      ]
    },
    {
      id: 'next-steps',
      title: 'Your Action Plan',
      icon: Target,
      content: `After each audit, follow this simple process:`,
      steps: [
        'Review the problems found (they\'re ranked by urgency)',
        'Click "Fix This" on each issue for step-by-step instructions',
        'Apply the fixes to your Shopify store',
        'Run another audit to see your improvement',
        'Repeat until your score is green!'
      ]
    },
    {
      id: 'pricing',
      title: 'What is this worth?',
      icon: DollarSign,
      content: `Every problem we find has a dollar amount attached. If your store has a 70% bounce rate 
        and you spend $100/day on ads, you're potentially wasting $70 daily on visitors who leave immediately. 
        Fix the problems = keep more of your ad budget.`,
      highlight: 'The tool pays for itself by identifying money-leaks you can fix.'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">RevenueArchitect Help Center</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Everything you need to know about diagnosing and fixing your Shopify store to increase sales.
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
      >
        <a href="#connect-store" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">Connect Store</p>
            <p className="text-sm text-gray-500">Get started in 2 min</p>
          </div>
        </a>
        <a href="#run-audit" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium">Run First Audit</p>
            <p className="text-sm text-gray-500">Find problems</p>
          </div>
        </a>
        <a href="#next-steps" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium">Action Plan</p>
            <p className="text-sm text-gray-500">What to do next</p>
          </div>
        </a>
      </motion.div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 leading-relaxed mb-4">
                {section.content}
              </p>

              {/* Subsections */}
              {section.subsections && (
                <div className="space-y-3 mt-4">
                  {section.subsections.map((sub, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{sub.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{sub.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Steps */}
              {section.steps && (
                <div className="mt-4 space-y-2">
                  {section.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-medium text-blue-600">{i + 1}</span>
                      </div>
                      <p className="text-gray-600">{step}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Highlight Box */}
              {section.highlight && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <p className="text-blue-800 font-medium">{section.highlight}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center p-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white"
      >
        <h3 className="text-xl font-bold mb-2">Ready to increase your revenue?</h3>
        <p className="opacity-90 mb-4">Connect your store and run your first audit in under 2 minutes.</p>
        <a 
          href="#/stores" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </div>
  );
};

export default Help;