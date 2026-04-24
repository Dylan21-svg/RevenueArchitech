import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, ShoppingCart,
  Users, ArrowUpRight, ArrowDownRight, Calendar, Download,
  PieChart, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell,
  Legend, ComposedChart
} from 'recharts';
import useStore from '../../store/useStore';
import { format, subDays, subMonths } from 'date-fns';

// ============================================================================
// METRIC CARD
// ============================================================================

const MetricCard = ({ title, value, change, changeLabel, icon: Icon, format: formatFn }) => {
  const isPositive = change >= 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl border border-gray-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{formatFn ? formatFn(value) : value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(change)}% {changeLabel || 'vs last period'}
            </div>
          )}
        </div>
        {Icon && <Icon className="w-8 h-8 text-gray-400" />}
      </div>
    </motion.div>
  );
};

// ============================================================================
// DATE RANGE PICKER
// ============================================================================

const DateRangePicker = ({ selected, onChange }) => {
  const ranges = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Year', value: '1y' },
  ];

  return (
    <div className="flex gap-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === range.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// REVENUE TREND CHART
// ============================================================================

const RevenueTrendChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.3}
            name="Revenue"
          />
          <Area 
            type="monotone" 
            dataKey="adSpend" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
            fillOpacity={0.3}
            name="Ad Spend"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// ROI BREAKDOWN
// ============================================================================

const ROIBreakdown = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">ROI Breakdown</h3>
      <div className="space-y-4">
        {data?.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.roi > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">{item.category}</span>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${item.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.roi > 0 ? '+' : ''}{item.roi}%
              </p>
              <p className="text-sm text-gray-500">${item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CONVERSION FUNNEL
// ============================================================================

const ConversionFunnel = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="stage" type="category" width={100} />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-5 gap-2 text-center text-sm">
        {data.map((item, index) => (
          <div key={index}>
            <p className="font-semibold">{item.conversionRate}%</p>
            <p className="text-gray-500">→</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// ATTRIBUTION MODEL
// ============================================================================

const AttributionChart = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Attribution by Channel</h3>
      <div className="grid grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="conversions"
              nameKey="channel"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm">{item.channel}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{item.conversions}</span>
                <span className="text-gray-500 text-sm ml-2">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FIX IMPACT ANALYSIS
// ============================================================================

const FixImpactAnalysis = ({ fixes }) => {
  const impactData = fixes?.map(fix => ({
    name: fix.fix_type || 'Unknown',
    revenue: fix.estimated_impact?.revenue || 0,
    conversions: fix.estimated_impact?.conversions || 0,
    roi: fix.estimated_impact?.roi || 0,
  })) || [];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Fix Impact Analysis</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={impactData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
          <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#82ca9d" name="ROI (%)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// MAIN ANALYTICS COMPONENT
// ============================================================================

const Analytics = () => {
  const { 
    currentStore, 
    revenueAnalytics, 
    roiAnalytics, 
    conversionMetrics, 
    attributionData,
    fetchRevenueAnalytics, 
    fetchROIAnalytics, 
    fetchConversionMetrics,
    fetchAttributionData 
  } = useStore();

  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    if (currentStore) {
      const dateRangeParams = {
        '7d': { start: subDays(new Date(), 7).toISOString(), end: new Date().toISOString() },
        '30d': { start: subDays(new Date(), 30).toISOString(), end: new Date().toISOString() },
        '90d': { start: subDays(new Date(), 90).toISOString(), end: new Date().toISOString() },
        '1y': { start: subMonths(new Date(), 12).toISOString(), end: new Date().toISOString() },
      };
      
      fetchRevenueAnalytics(currentStore.id, dateRangeParams[dateRange]);
      fetchROIAnalytics(currentStore.id);
      fetchConversionMetrics(currentStore.id);
      fetchAttributionData(currentStore.id);
    }
  }, [currentStore, dateRange]);

  // Sample data (would come from API)
  const sampleRevenueData = [
    { date: 'Week 1', revenue: 12500, adSpend: 4500 },
    { date: 'Week 2', revenue: 15200, adSpend: 4800 },
    { date: 'Week 3', revenue: 14800, adSpend: 5200 },
    { date: 'Week 4', revenue: 18500, adSpend: 4900 },
  ];

  const sampleROIBreakdown = [
    { category: 'Thumb Zone Fixes', roi: 45, value: 8500 },
    { category: 'Hero Optimization', roi: 32, value: 6200 },
    { category: 'Load Time Improvements', roi: 28, value: 4100 },
    { category: 'CTA Enhancements', roi: 18, value: 2800 },
  ];

  const sampleFunnelData = [
    { stage: 'Visitors', count: 10000, conversionRate: 100 },
    { stage: 'Product Views', count: 4500, conversionRate: 45 },
    { stage: 'Add to Cart', count: 1800, conversionRate: 40 },
    { stage: 'Checkout', count: 900, conversionRate: 50 },
    { stage: 'Purchase', count: 450, conversionRate: 50 },
  ];

  const sampleAttributionData = [
    { channel: 'Direct', conversions: 180, percentage: 35 },
    { channel: 'Organic Search', conversions: 145, percentage: 28 },
    { channel: 'Paid Ads', conversions: 120, percentage: 23 },
    { channel: 'Social', conversions: 55, percentage: 10 },
    { channel: 'Email', conversions: 20, percentage: 4 },
  ];

  if (!currentStore) {
    return (
      <div className="p-6 text-center">
        <PieChart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No store selected</h3>
        <p className="text-gray-500">Select a store to view analytics</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-600">Revenue attribution and ROI tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker selected={dateRange} onChange={setDateRange} />
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* What is Analytics? */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-purple-800">What is Analytics?</h2>
            <p className="text-sm text-purple-700 mt-1 mb-4">
              Analytics shows you how your store is performing over time. Track revenue, see which 
              fixes are working, and understand where your sales come from.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-800">📈 What you can track:</p>
                <p className="text-xs text-purple-700 mt-1">
                  Revenue trends, conversion rates, traffic sources, and revenue vs ad spend. 
                  See the big picture of your store's health.
                </p>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-800">🎯 Why it matters:</p>
                <p className="text-xs text-purple-700 mt-1">
                  Data helps you make informed decisions. See what's working and what's not. 
                  Prove the ROI of your optimization efforts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Revenue" 
          value={revenueAnalytics?.total_revenue || 61000}
          change={12.5}
          icon={DollarSign}
          format={(v) => `$${v.toLocaleString()}`}
        />
        <MetricCard 
          title="ROI" 
          value={roiAnalytics?.overall_roi || 34}
          change={8.2}
          icon={Percent}
          format={(v) => `${v}%`}
        />
        <MetricCard 
          title="Conversions" 
          value={conversionMetrics?.total_conversions || 450}
          change={15.3}
          icon={ShoppingCart}
        />
        <MetricCard 
          title="Conversion Rate" 
          value={conversionMetrics?.conversion_rate || 4.5}
          change={2.1}
          icon={Users}
          format={(v) => `${v}%`}
        />
      </div>

      {/* Revenue Trend */}
      <RevenueTrendChart data={sampleRevenueData} />

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ROIBreakdown data={sampleROIBreakdown} />
        <AttributionChart data={sampleAttributionData} />
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConversionFunnel data={sampleFunnelData} />
        <FixImpactAnalysis fixes={[]} />
      </div>

      {/* Detailed Tables */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium">Channel</th>
                <th className="text-right py-3 px-4 font-medium">Revenue</th>
                <th className="text-right py-3 px-4 font-medium">Conversions</th>
                <th className="text-right py-3 px-4 font-medium">ROAS</th>
                <th className="text-right py-3 px-4 font-medium">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {sampleAttributionData.map((channel, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{channel.channel}</td>
                  <td className="py-3 px-4 text-right">${(channel.conversions * 125).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{channel.conversions}</td>
                  <td className="py-3 px-4 text-right">{(Math.random() * 3 + 2).toFixed(2)}x</td>
                  <td className="py-3 px-4 text-right">{channel.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;