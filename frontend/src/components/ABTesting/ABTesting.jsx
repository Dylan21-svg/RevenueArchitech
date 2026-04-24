import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, Plus, Play, Pause, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Clock, BarChart3, RefreshCw, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend 
} from 'recharts';
import useStore from '../../store/useStore';
import { format } from 'date-fns';

// ============================================================================
// TEST STATUS BADGE
// ============================================================================

const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-700', icon: Clock },
    running: { color: 'bg-blue-100 text-blue-700', icon: Play },
    paused: { color: 'bg-yellow-100 text-yellow-700', icon: Pause },
    completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.color}`}>
      <Icon className="w-4 h-4" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ============================================================================
// TEST CARD COMPONENT
// ============================================================================

const TestCard = ({ test, onSelect, onUpdateStatus }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    await onUpdateStatus(test.id, newStatus);
    setIsUpdating(false);
  };

  // Calculate winner if test is completed
  const winner = test.results?.variant_a_conversions > test.results?.variant_b_conversions 
    ? 'A' 
    : test.results?.variant_b_conversions > test.results?.variant_a_conversions 
      ? 'B' 
      : null;

  const lift = test.results 
    ? ((test.results.variant_b_conversions - test.results.variant_a_conversions) / test.results.variant_a_conversions * 100).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{test.name}</h3>
          <p className="text-sm text-gray-500">
            Created {format(new Date(test.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <StatusBadge status={test.status} />
      </div>

      {/* Test Variants */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-lg ${test.winner === 'A' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
          <p className="text-sm font-medium text-gray-600">Variant A (Control)</p>
          <p className="text-2xl font-bold mt-1">
            {test.results?.variant_a_conversions || 0}
          </p>
          <p className="text-sm text-gray-500">conversions</p>
        </div>
        <div className={`p-4 rounded-lg ${test.winner === 'B' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
          <p className="text-sm font-medium text-gray-600">Variant B (Treatment)</p>
          <p className="text-2xl font-bold mt-1">
            {test.results?.variant_b_conversions || 0}
          </p>
          <p className="text-sm text-gray-500">conversions</p>
        </div>
      </div>

      {/* Results Summary */}
      {test.status === 'completed' && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Winner</p>
              <p className="font-semibold">{winner || 'No significant difference'}</p>
            </div>
            {lift && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Conversion Lift</p>
                <p className={`font-semibold ${lift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {lift > 0 ? '+' : ''}{lift}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSelect(test)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          View Details
        </button>
        
        {test.status === 'draft' && (
          <button
            onClick={() => handleStatusChange('running')}
            disabled={isUpdating}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Start test"
          >
            <Play className="w-5 h-5" />
          </button>
        )}
        
        {test.status === 'running' && (
          <button
            onClick={() => handleStatusChange('paused')}
            disabled={isUpdating}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Pause test"
          >
            <Pause className="w-5 h-5" />
          </button>
        )}
        
        {test.status === 'paused' && (
          <button
            onClick={() => handleStatusChange('running')}
            disabled={isUpdating}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Resume test"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// CREATE TEST MODAL
// ============================================================================

const CreateTestModal = ({ isOpen, onClose, onCreate, themes, storeId }) => {
  const [formData, setFormData] = useState({
    name: '',
    theme_id: '',
    variant_theme_id: '',
    original_audit_id: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onCreate({
        ...formData,
        store_id: storeId,
      });
      setFormData({ name: '', theme_id: '', variant_theme_id: '', original_audit_id: '' });
      setStep(1);
      onClose();
    } catch (error) {
      console.error('Failed to create test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4">Create A/B Test</h2>

          {/* Progress Steps */}
          <div className="flex items-center mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div className={`h-full bg-blue-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Hero CTA Optimization Test"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Next: Select Variants
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Control Theme (Variant A)</label>
                  <select
                    value={formData.theme_id}
                    onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select theme...</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Treatment Theme (Variant B)</label>
                  <select
                    value={formData.variant_theme_id}
                    onChange={(e) => setFormData({ ...formData, variant_theme_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select theme...</option>
                    {themes.filter(t => t.id !== formData.theme_id).map((theme) => (
                      <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.theme_id || !formData.variant_theme_id}
                    className={`flex-1 py-2 rounded-lg font-medium ${
                      isLoading || !formData.theme_id || !formData.variant_theme_id
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? 'Creating...' : 'Create Test'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// TEST DETAIL VIEW
// ============================================================================

const TestDetail = ({ test, onBack }) => {
  // Sample data for charts
  const dailyData = [
    { day: 'Day 1', variant_a: 120, variant_b: 135 },
    { day: 'Day 2', variant_a: 145, variant_b: 160 },
    { day: 'Day 3', variant_a: 130, variant_b: 175 },
    { day: 'Day 4', variant_a: 155, variant_b: 190 },
    { day: 'Day 5', variant_a: 170, variant_b: 210 },
    { day: 'Day 6', variant_a: 165, variant_b: 195 },
    { day: 'Day 7', variant_a: 180, variant_b: 225 },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        ← Back to Tests
      </button>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{test.name}</h2>
            <p className="text-gray-600">
              Created {format(new Date(test.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
          <StatusBadge status={test.status} />
        </div>
      </div>

      {/* Results Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Daily Conversions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="variant_a" name="Control (A)" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="variant_b" name="Treatment (B)" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Total Visitors</p>
          <p className="text-3xl font-bold">{test.results?.total_visitors || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Total Conversions</p>
          <p className="text-3xl font-bold">
            {(test.results?.variant_a_conversions || 0) + (test.results?.variant_b_conversions || 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-600">Conversion Rate</p>
          <p className="text-3xl font-bold">
            {test.results?.conversion_rate 
              ? `${test.results.conversion_rate}%`
              : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN A/B TESTING COMPONENT
// ============================================================================

const ABTesting = () => {
  const { 
    currentStore, 
    themes, 
    abTests, 
    fetchABTests, 
    createABTest, 
    setCurrentABTest 
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    if (currentStore) {
      fetchABTests(currentStore.id);
    }
  }, [currentStore]);

  const handleCreateTest = async (testData) => {
    await createABTest(testData);
  };

  const handleSelectTest = (test) => {
    setSelectedTest(test);
    setCurrentABTest(test);
  };

  const handleUpdateStatus = async (testId, status) => {
    // Would call API to update status
    console.log('Update test status:', testId, status);
  };

  if (selectedTest) {
    return (
      <TestDetail 
        test={selectedTest} 
        onBack={() => setSelectedTest(null)} 
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">A/B Testing</h1>
          <p className="text-gray-600">Compare fix performance with controlled experiments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!currentStore || themes.length < 2}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            !currentStore || themes.length < 2
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="w-5 h-5" />
          New Test
        </button>
      </div>

      {/* What is A/B Testing? */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-green-800">What is A/B Testing?</h2>
            <p className="text-sm text-green-700 mt-1 mb-4">
              A/B Testing lets you compare two versions of your store to see which one sells more. 
              Make changes with confidence - let data decide what works.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800">🎯 Why use it?</p>
                <p className="text-xs text-green-700 mt-1">
                  Small changes can lead to big revenue increases. Test headlines, buttons, images, 
                  and layouts to find what converts best.
                </p>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800">📊 How it works:</p>
                <p className="text-xs text-green-700 mt-1">
                  Half your visitors see Version A, half see Version B. Track which version 
                  gets more sales, then use the winner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Notice */}
      {(!currentStore || themes.length < 2) && (
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-800">
            {!currentStore 
              ? 'Please select a store to create A/B tests.'
              : themes.length < 2 
                ? 'You need at least 2 themes to create an A/B test.'
                : ''}
          </p>
        </div>
      )}

      {/* Empty State */}
      {currentStore && abTests.length === 0 && (
        <div className="text-center py-12">
          <FlaskConical className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No A/B tests yet</h3>
          <p className="text-gray-500 mb-4">Create your first test to compare fix performance</p>
        </div>
      )}

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {abTests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            onSelect={handleSelectTest}
            onUpdateStatus={handleUpdateStatus}
          />
        ))}
      </div>

      {/* Create Test Modal */}
      <CreateTestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateTest}
        themes={themes}
        storeId={currentStore?.id}
      />
    </div>
  );
};

export default ABTesting;