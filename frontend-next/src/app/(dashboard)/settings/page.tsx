'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Globe, ChevronRight, Save } from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as any } });

const sections = [
  { id: 'profile',        label: 'Profile',           icon: User },
  { id: 'notifications',  label: 'Notifications',     icon: Bell },
  { id: 'security',       label: 'Security',           icon: Shield },
  { id: 'integrations',   label: 'Integrations',       icon: Globe },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [active, setActive] = useState('profile');
  const [saved, setSaved]   = useState(false);
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState(user?.email ?? '');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-6">
        <h2 className="text-2xl font-bold font-display text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences.</p>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="flex gap-6">
        {/* Side nav */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active === id
                    ? 'bg-[#10374E] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <span className="flex items-center gap-2.5"><Icon size={15} />{label}</span>
                <ChevronRight size={13} className="opacity-50" />
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-6">
          {active === 'profile' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-slate-900">Profile Information</h3>
              <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-[#10374E] flex items-center justify-center text-2xl font-bold text-[#53F6FF]">
                  {(user?.email?.[0] ?? 'U').toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{user?.email}</p>
                  <p className="text-sm text-slate-500">Growth Plan</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Full Name',     value: name,  setter: setName,  placeholder: 'Your name' },
                  { label: 'Email Address', value: email, setter: setEmail, placeholder: 'your@email.com' },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input
                      type="text" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#53F6FF]/40 focus:border-[#53F6FF] transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    saved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#10374E] text-white hover:bg-[#0d2e42]'
                  )}
                >
                  <Save size={14} /> {saved ? 'Saved!' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-slate-900">Notification Preferences</h3>
              {[
                { label: 'Audit completed',       desc: 'Notify when an audit finishes' },
                { label: 'Critical issues found', desc: 'Alert on high-severity findings' },
                { label: 'Weekly digest',         desc: 'Summary of performance trends' },
                { label: 'Billing alerts',        desc: 'Usage limits and payment events' },
              ].map((n) => (
                <label key={n.label} className="flex items-center justify-between py-3 border-b border-slate-100 cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{n.label}</p>
                    <p className="text-xs text-slate-500">{n.desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-[#10374E] transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              ))}
            </div>
          )}

          {active === 'security' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-slate-900">Security</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                Password management is handled by Supabase Auth. Use the link below to reset your password.
              </div>
              <button className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Send password reset email
              </button>
            </div>
          )}

          {active === 'integrations' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-slate-900">Integrations</h3>
              {[
                { name: 'Shopify',  desc: 'Connect your Shopify store via OAuth', connected: false },
                { name: 'Slack',    desc: 'Receive audit alerts in Slack',          connected: false },
                { name: 'Zapier',   desc: 'Automate workflows with 5,000+ apps',    connected: false },
              ].map((int) => (
                <div key={int.name} className="flex items-center justify-between py-4 border-b border-slate-100">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{int.name}</p>
                    <p className="text-xs text-slate-500">{int.desc}</p>
                  </div>
                  <button className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    int.connected
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-[#10374E] text-white hover:bg-[#0d2e42]'
                  )}>
                    {int.connected ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
