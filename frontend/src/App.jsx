import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { supabase } from './services/supabase';
import useStore from './store/useStore';

// Components
import Layout from './components/Layout/Layout';
import Landing from './components/Landing/Landing';
import Dashboard from './components/Dashboard/Dashboard';
import Stores from './components/Stores/Stores';
import ABTesting from './components/ABTesting/ABTesting';
import Analytics from './components/Analytics/Analytics';


// Main Application Entry Point
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
        <Route path="/" element={<Landing />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/ab-testing" element={<ABTesting />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
