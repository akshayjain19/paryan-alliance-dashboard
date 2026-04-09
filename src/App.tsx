/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Package, 
  BarChart3, 
  LifeBuoy, 
  LogOut, 
  Bell, 
  Settings, 
  Search,
  MoreVertical,
  ChevronDown,
  CheckCircle2,
  Upload,
  Radio,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Globe,
  MessageSquare,
  CreditCard,
  LogIn,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Firebase imports
import { db } from './firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  increment,
  getDoc
} from 'firebase/firestore';

// Mock Data
const trendData = [
  { name: 'Mon', value: 30 },
  { name: 'Tue', value: 45 },
  { name: 'Wed', value: 35 },
  { name: 'Thu', value: 55 },
  { name: 'Fri', value: 40 },
  { name: 'Sat', value: 65 },
  { name: 'Sun', value: 50 },
];

const cropData = [
  { name: 'Rice', value: 45, color: '#2e7d32' },
  { name: 'Wheat', value: 30, color: '#fed0c1' },
  { name: 'Maize', value: 25, color: '#6e5100' },
];

const recentActivity = [
  { id: 1, code: 'AGRI-4492-RT', farmer: 'Rajinder Singh', interest: 'Rice', discount: '₹ 500.00', status: 'Redeemed' },
  { id: 2, code: 'AGRI-8821-XW', farmer: 'Amit Sharma', interest: 'Wheat', discount: '₹ 750.00', status: 'Active' },
  { id: 3, code: 'AGRI-1032-QZ', farmer: 'Gurpreet Kaur', interest: 'Rice', discount: '₹ 300.00', status: 'Expired' },
];

const initialFunnelData = [
  { id: 'views', label: 'Views', value: 125000, icon: Eye },
  { id: 'likes', label: 'Likes', value: 18400, icon: Heart },
  { id: 'comments', label: 'Comments', value: 4200, icon: MessageCircle },
  { id: 'shares', label: 'Shares', value: 2100, icon: Share2 },
  { id: 'saves', label: 'Saves', value: 3800, icon: Bookmark },
  { id: 'visits', label: 'Visits on Site', value: 8600, icon: Globe },
  { id: 'enquiries', label: 'Enquiries', value: 1240, icon: MessageSquare },
  { id: 'payments', label: 'Final Payment', value: 186, icon: CreditCard },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [funnelMetrics, setFunnelMetrics] = useState(initialFunnelData);
  const [isSimulating, setIsSimulating] = useState(false);

  // Firestore Real-time Listener
  useEffect(() => {
    const funnelDocRef = doc(db, 'funnel', 'current');
    
    // Initialize doc if it doesn't exist
    const initDoc = async () => {
      try {
        const docSnap = await getDoc(funnelDocRef);
        if (!docSnap.exists()) {
          await setDoc(funnelDocRef, {
            views: 125000,
            likes: 18400,
            comments: 4200,
            shares: 2100,
            saves: 3800,
            visits: 8600,
            enquiries: 1240,
            payments: 186,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error: any) {
        // If it's a permission error, it might be because the user is not an admin
        // and the doc already exists (but they can't see it yet) or they just can't create it.
        // We can ignore this for non-admins as the admin will have initialized it.
        if (error.code !== 'permission-denied') {
          console.error("Init Doc Error:", error);
        }
      }
    };
    initDoc();

    const unsubscribe = onSnapshot(funnelDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFunnelMetrics(prev => prev.map(item => ({
          ...item,
          value: data[item.id] ?? item.value
        })));
      }
    }, (error) => {
      handleFirestoreError(error, 'get', 'funnel/current');
    });

    return () => unsubscribe();
  }, []);

  const simulateConversion = async () => {
    setIsSimulating(true);
    const path = 'funnel/current';
    try {
      const funnelDocRef = doc(db, 'funnel', 'current');
      // Randomly increment one of the metrics
      const metrics = ['views', 'likes', 'comments', 'shares', 'saves', 'visits', 'enquiries', 'payments'];
      const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
      
      await updateDoc(funnelDocRef, {
        [randomMetric]: increment(Math.floor(Math.random() * 10) + 1),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', path);
    } finally {
      setTimeout(() => setIsSimulating(false), 500);
    }
  };

  function handleFirestoreError(error: any, operationType: string, path: string | null) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-low flex flex-col p-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
               <div className="w-3 h-3 bg-primary rounded-full" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">The Digital Agronomist</h1>
            <p className="text-xs text-gray-500">Full-Funnel Tracking</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {[
            { name: 'Overview', icon: LayoutDashboard },
            { name: 'Coupons', icon: Ticket },
            { name: 'Inventory', icon: Package },
            { name: 'Reports', icon: BarChart3 },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.name 
                  ? 'bg-[#e0f2e9] text-primary font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-2 pt-6 border-t border-outline-variant/15">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
            <LifeBuoy size={20} />
            Support
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-surface">
        {/* Top Nav */}
        <header className="glass-nav sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h2 className="text-primary font-bold text-xl">Paryan Alliance Portal</h2>
            <nav className="flex gap-6">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-1">Dashboard</a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">Inventory</a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">Customers</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Settings size={20} />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
              <img 
                src="https://picsum.photos/seed/farmer/100/100" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <div className="p-8 flex flex-col gap-8">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, Dilbagh</h1>
            <button 
              onClick={simulateConversion}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                isSimulating 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <Zap size={16} className={isSimulating ? 'animate-pulse' : ''} />
              {isSimulating ? 'Simulating...' : 'Simulate Real-time Event'}
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard 
              title="Coupons Redeemed Today" 
              value="42" 
              badge="+12%" 
              badgeColor="bg-green-100 text-green-700"
              icon={<Ticket className="text-primary" />}
            />
            <MetricCard 
              title="WhatsApp Leads Generated" 
              value="158" 
              badge="New" 
              badgeColor="bg-orange-100 text-orange-700"
              icon={<Radio className="text-orange-600" />}
            />
            <MetricCard 
              title="Pending Redemptions" 
              value="07" 
              badge="High Priority" 
              badgeColor="bg-yellow-100 text-yellow-700"
              icon={<BarChart3 className="text-yellow-600" />}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Redemption Trends (Last 7 Days)</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg text-sm font-medium">
                  This Week <ChevronDown size={16} />
                </button>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff4fc" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0d631b" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0d631b', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Crop Interests & Actions */}
            <div className="flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow flex-1">
                <h3 className="font-bold text-lg mb-4">Crop Interests</h3>
                <div className="h-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cropData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {cropData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">1.2k</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {cropData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Funnel Metrics Section */}
          <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-xl">Conversion Funnel</h3>
                <p className="text-gray-500 text-sm">Tracking user journey from initial view to final payment</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-surface-container-low rounded-lg text-sm font-bold text-primary">Last 30 Days</button>
                 <button className="px-4 py-2 hover:bg-surface-container-low rounded-lg text-sm font-bold text-gray-500 transition-colors">Export Data</button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {funnelMetrics.map((item, index) => {
                const prevValue = index > 0 ? funnelMetrics[index - 1].value : item.value;
                const conversion = index > 0 ? ((item.value / prevValue) * 100).toFixed(1) : '100';
                const totalConversion = ((item.value / funnelMetrics[0].value) * 100).toFixed(2);
                const maxWidth = 100 - (index * 5); // Visual funnel effect

                return (
                  <div key={item.label} className="relative group">
                    <div className="flex items-center gap-6 py-3">
                      {/* Icon & Label */}
                      <div className="w-48 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <item.icon size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>

                      {/* Funnel Bar */}
                      <div className="flex-1 h-12 bg-surface-container-low rounded-lg overflow-hidden relative">
                        <motion.div 
                          initial={false}
                          animate={{ width: `${maxWidth}%` }}
                          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                          className="h-full signature-gradient opacity-90 relative"
                        >
                          <div className="absolute inset-y-0 right-4 flex items-center">
                             <motion.span 
                               key={item.value}
                               initial={{ scale: 1.2, color: '#fff' }}
                               animate={{ scale: 1, color: '#fff' }}
                               className="text-white font-bold text-sm"
                             >
                               {item.value.toLocaleString()}
                             </motion.span>
                          </div>
                        </motion.div>
                      </div>

                      {/* Metrics */}
                      <div className="w-48 flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Conv.</span>
                          <span className={`text-sm font-bold ${index === 0 ? 'text-gray-400' : 'text-primary'}`}>
                            {index === 0 ? '-' : `${conversion}%`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Of Total</span>
                          <span className="text-xs font-medium text-gray-500">{totalConversion}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connector line for visual funnel flow */}
                    {index < funnelMetrics.length - 1 && (
                      <div className="absolute left-[216px] bottom-[-4px] w-[2px] h-2 bg-outline-variant/20 z-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: Actions & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Dealer Actions */}
             <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow flex flex-col gap-4">
                <h3 className="font-bold text-lg">Dealer Actions</h3>
                <ActionButton 
                  label="Manually Validate Coupon" 
                  icon={<CheckCircle2 size={20} />} 
                  variant="primary"
                />
                <ActionButton 
                  label="Export Redemption Report" 
                  icon={<Upload size={20} />} 
                  variant="secondary"
                />
                <ActionButton 
                  label="Send Broadcast Message" 
                  icon={<Bell size={20} />} 
                  variant="secondary"
                />
             </div>

             {/* Recent Activity Table */}
             <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Recent Coupon Activity</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search farmer or code..." 
                      className="pl-10 pr-4 py-2 bg-surface-container-low rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-outline-variant/15">
                        <th className="pb-4 font-semibold">Coupon Code</th>
                        <th className="pb-4 font-semibold">Farmer Name</th>
                        <th className="pb-4 font-semibold">Crop Interest</th>
                        <th className="pb-4 font-semibold">Discount</th>
                        <th className="pb-4 font-semibold">Status</th>
                        <th className="pb-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {recentActivity.map((row) => (
                        <tr key={row.id} className="group hover:bg-surface-container-low transition-colors">
                          <td className="py-4 font-bold text-tertiary text-sm">{row.code}</td>
                          <td className="py-4 text-sm">{row.farmer}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                              row.interest === 'Rice' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                            }`}>
                              {row.interest}
                            </span>
                          </td>
                          <td className="py-4 text-sm font-bold">{row.discount}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                row.status === 'Redeemed' ? 'bg-green-500' : 
                                row.status === 'Active' ? 'bg-blue-500' : 'bg-gray-400'
                              }`} />
                              <span className="text-xs font-medium">{row.status}</span>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <button className="p-1 text-gray-400 hover:text-primary transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="w-full mt-6 py-3 text-primary font-bold text-sm hover:bg-primary/5 rounded-lg transition-colors">
                  View All Activity
                </button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, badge, badgeColor, icon }: { 
  title: string; 
  value: string; 
  badge: string; 
  badgeColor: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <h4 className="text-3xl font-bold mt-1">{value}</h4>
      </div>
    </motion.div>
  );
}

function ActionButton({ label, icon, variant }: { 
  label: string; 
  icon: React.ReactNode; 
  variant: 'primary' | 'secondary' 
}) {
  return (
    <button className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold text-sm transition-all ${
      variant === 'primary' 
        ? 'signature-gradient text-white shadow-lg shadow-primary/20' 
        : 'bg-surface-container-low text-gray-700 hover:bg-surface-container-highest'
    }`}>
      {icon}
      {label}
    </button>
  );
}
