/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageCircle,
  Share2,
  Globe,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  getDoc,
  collection
} from 'firebase/firestore';

// Mock Data
const initialPosts = [
  { id: 'post1', thumbnail: 'https://picsum.photos/seed/post1/400/400', title: 'Summer Collection Launch', date: '2024-04-10', status: 'Active', mockData: { comments: 1000, dmsSent: 300, whatsappVisits: 200 } },
  { id: 'post2', thumbnail: 'https://picsum.photos/seed/post2/400/400', title: 'Customer Spotlight: Farmer John', date: '2024-04-11', status: 'Active', mockData: { comments: 800, dmsSent: 250, whatsappVisits: 150 } },
  { id: 'post3', thumbnail: 'https://picsum.photos/seed/post3/400/400', title: 'New Irrigation Tips', date: '2024-04-12', status: 'Completed', mockData: { comments: 500, dmsSent: 150, whatsappVisits: 100 } },
  { id: 'post4', thumbnail: 'https://picsum.photos/seed/post4/400/400', title: 'Organic Fertilizer Guide', date: '2024-04-13', status: 'Active', mockData: { comments: 400, dmsSent: 120, whatsappVisits: 80 } },
  { id: 'post5', thumbnail: 'https://picsum.photos/seed/post5/400/400', title: 'Harvest Festival Teaser', date: '2024-04-14', status: 'Draft', mockData: { comments: 300, dmsSent: 100, whatsappVisits: 70 } },
  { id: 'post6', thumbnail: 'https://picsum.photos/seed/post6/400/400', title: 'Sustainable Farming Q&A', date: '2024-04-15', status: 'Active', mockData: { comments: 220, dmsSent: 81, whatsappVisits: 92 } },
];

const initialFunnelData = [
  { id: 'comments', label: 'Instagram Comments', value: 3220, icon: MessageCircle },
  { id: 'dmsSent', label: 'DMs Sent', value: 1001, icon: Share2 },
  { id: 'whatsappVisits', label: 'WhatsApp Bot Visits', value: 692, icon: Globe },
];

const mockCampaigns = [
  { id: 'camp1', name: 'Spring Harvest Drive', status: 'Running', spend: '$1,200', reach: '45k', conversion: '3.2%' },
  { id: 'camp2', name: 'Organic Awareness', status: 'Paused', spend: '$800', reach: '12k', conversion: '1.8%' },
  { id: 'camp3', name: 'Direct-to-Consumer', status: 'Completed', spend: '$2,500', reach: '88k', conversion: '4.5%' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState(initialFunnelData);
  const [aggregateMetrics, setAggregateMetrics] = useState(initialFunnelData);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Firestore Real-time Listener for selected post
  useEffect(() => {
    if (!selectedPostId) return;

    const postDocRef = doc(db, 'posts', selectedPostId);
    
    // Initialize doc if it doesn't exist
    const initDoc = async () => {
      try {
        const docSnap = await getDoc(postDocRef);
        if (!docSnap.exists()) {
          const post = initialPosts.find(p => p.id === selectedPostId);
          const mockData = post?.mockData || {
            comments: Math.floor(Math.random() * 500) + 100,
            dmsSent: Math.floor(Math.random() * 200) + 50,
            whatsappVisits: Math.floor(Math.random() * 100) + 20
          };
          
          await setDoc(postDocRef, {
            ...mockData,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error: any) {
        if (error.code !== 'permission-denied') {
          console.error("Init Doc Error:", error);
        }
      }
    };
    initDoc();

    const unsubscribe = onSnapshot(postDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFunnelMetrics(prev => prev.map(item => ({
          ...item,
          value: data[item.id] ?? 0
        })));
      }
    }, (error) => {
      handleFirestoreError(error, 'get', `posts/${selectedPostId}`);
    });

    return () => unsubscribe();
  }, [selectedPostId]);

  // Aggregate listener for all posts
  useEffect(() => {
    const postsCollectionRef = collection(db, 'posts');
    const unsubscribe = onSnapshot(postsCollectionRef, (snapshot) => {
      const totals = {
        comments: 0,
        dmsSent: 0,
        whatsappVisits: 0
      };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totals.comments += data.comments || 0;
        totals.dmsSent += data.dmsSent || 0;
        totals.whatsappVisits += data.whatsappVisits || 0;
      });
      setAggregateMetrics(prev => prev.map(item => ({
        ...item,
        value: totals[item.id as keyof typeof totals]
      })));
    }, (error) => {
      handleFirestoreError(error, 'list', 'posts');
    });
    return () => unsubscribe();
  }, []);

  const simulateConversion = async () => {
    if (!selectedPostId) return;
    setIsSimulating(true);
    const path = `posts/${selectedPostId}`;
    try {
      const postDocRef = doc(db, 'posts', selectedPostId);
      const metrics = ['comments', 'dmsSent', 'whatsappVisits'];
      const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
      
      await updateDoc(postDocRef, {
        [randomMetric]: increment(1),
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
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface-container-low flex flex-col p-6 gap-8 transition-transform duration-300 lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                 <div className="w-3 h-3 bg-primary rounded-full" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Funnel Tracker</h1>
              <p className="text-xs text-gray-500">Insta to WhatsApp</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {[
            { name: 'Overview', icon: LayoutDashboard },
            { name: 'Campaigns', icon: Zap },
            { name: 'Audience', icon: MessageCircle },
            { name: 'Settings', icon: Globe },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                setSelectedPostId(null);
                setIsMobileMenuOpen(false);
              }}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-surface">
        {/* Top Nav */}
        <header className="glass-nav sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-primary font-bold text-lg lg:text-xl truncate">Funnel Dashboard</h2>
            <nav className="hidden md:flex gap-6">
              <a href="#" className="text-primary font-medium border-b-2 border-primary pb-1">Post Tracking</a>
            </nav>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden border-2 border-primary/20">
              <img 
                src="https://picsum.photos/seed/farmer/100/100" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
          {activeTab === 'Overview' && (
            <>
              {!selectedPostId ? (
                <>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Aggregate Performance</h1>
                    <p className="text-gray-500">Combined metrics across all tracked Instagram posts</p>
                  </div>

                  {/* Aggregate Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                    {aggregateMetrics.map((metric) => (
                      <MetricCard 
                        key={metric.id}
                        title={`Total ${metric.label}`} 
                        value={metric.value.toLocaleString()} 
                        badge="Global" 
                        badgeColor="bg-blue-100 text-blue-700"
                        icon={<metric.icon className="text-primary" />}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <h2 className="text-xl font-bold tracking-tight">Recent Posts</h2>
                    <p className="text-gray-500 text-sm">Select a post to view its individual conversion funnel</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedPostId(post.id)}
                        className="bg-surface-container-lowest rounded-xl overflow-hidden ambient-shadow cursor-pointer group border border-outline-variant/10"
                      >
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={post.thumbnail} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                              post.status === 'Active' ? 'bg-green-500 text-white' :
                              post.status === 'Completed' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{post.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{post.date}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Welcome Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedPostId(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Post Analytics</h1>
                        <p className="text-sm text-gray-500">{initialPosts.find(p => p.id === selectedPostId)?.title}</p>
                      </div>
                    </div>
                    <button 
                      onClick={simulateConversion}
                      disabled={isSimulating}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all w-full sm:w-auto ${
                        isSimulating 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                      }`}
                    >
                      <Zap size={16} className={isSimulating ? 'animate-pulse' : ''} />
                      {isSimulating ? 'Simulating...' : 'Simulate Event'}
                    </button>
                  </div>

                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                    {funnelMetrics.map((metric) => (
                      <MetricCard 
                        key={metric.id}
                        title={metric.label} 
                        value={metric.value.toLocaleString()} 
                        badge="Real-time" 
                        badgeColor="bg-primary/10 text-primary"
                        icon={<metric.icon className="text-primary" />}
                      />
                    ))}
                  </div>


                  {/* Funnel Metrics Section */}
                  <div className="bg-surface-container-lowest rounded-xl p-4 lg:p-8 ambient-shadow overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="font-bold text-xl">Conversion Funnel</h3>
                        <p className="text-gray-500 text-sm">Tracking user journey from Instagram Comment to WhatsApp Bot</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 overflow-x-auto">
                      <div className="min-w-[600px]">
                        {funnelMetrics.map((item, index) => {
                          const prevValue = index > 0 ? funnelMetrics[index - 1].value : item.value;
                          const conversion = index > 0 ? (prevValue === 0 ? '0' : ((item.value / prevValue) * 100).toFixed(1)) : '100';
                          const totalConversion = funnelMetrics[0].value === 0 ? '0' : ((item.value / funnelMetrics[0].value) * 100).toFixed(2);
                          const maxWidth = 100 - (index * 10); // Visual funnel effect

                          return (
                            <div key={item.label} className="relative group">
                              <div className="flex items-center gap-6 py-3">
                                {/* Icon & Label */}
                                <div className="w-40 lg:w-48 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <item.icon size={16} />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 truncate">{item.label}</span>
                                </div>

                                {/* Funnel Bar */}
                                <div className="flex-1 h-12 bg-surface-container-low rounded-lg overflow-hidden relative">
                                  <motion.div 
                                    initial={false}
                                    animate={{ width: `${maxWidth}%` }}
                                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                    className="h-full bg-primary/20 opacity-90 relative"
                                  >
                                    <div className="absolute inset-y-0 right-4 flex items-center">
                                       <motion.span 
                                         key={item.value}
                                         initial={{ scale: 1.2, color: 'var(--primary)' }}
                                         animate={{ scale: 1, color: 'var(--primary)' }}
                                         className="font-bold text-sm"
                                       >
                                         {item.value.toLocaleString()}
                                       </motion.span>
                                    </div>
                                  </motion.div>
                                </div>

                                {/* Metrics */}
                                <div className="w-32 lg:w-48 flex flex-col items-end">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Conv.</span>
                                    <span className={`text-sm font-bold ${index === 0 ? 'text-gray-400' : 'text-primary'}`}>
                                      {index === 0 ? '-' : `${conversion}%`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Of Total</span>
                                    <span className="text-[10px] font-medium text-gray-500">{totalConversion}%</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Connector line for visual funnel flow */}
                              {index < funnelMetrics.length - 1 && (
                                <div className="absolute left-[184px] lg:left-[216px] bottom-[-4px] w-[2px] h-2 bg-outline-variant/20 z-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'Campaigns' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Active Campaigns</h1>
                <p className="text-gray-500">Manage your Instagram-to-WhatsApp marketing campaigns</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Campaign Name</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Spend</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Reach</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {mockCampaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 font-bold text-gray-900">{camp.name}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              camp.status === 'Running' ? 'bg-green-100 text-green-700' :
                              camp.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {camp.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-sm">{camp.spend}</td>
                          <td className="p-4 text-sm">{camp.reach}</td>
                          <td className="p-4 text-right font-bold text-primary">{camp.conversion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Audience' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Audience Insights</h1>
                <p className="text-gray-500">Understanding who is interacting with your funnel</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow">
                  <h3 className="font-bold text-lg mb-6">Top Locations</h3>
                  <div className="space-y-4">
                    {[
                      { city: 'Mumbai', percentage: 35 },
                      { city: 'Delhi', percentage: 28 },
                      { city: 'Bangalore', percentage: 22 },
                      { city: 'Pune', percentage: 15 },
                    ].map((item) => (
                      <div key={item.city} className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.city}</span>
                          <span className="text-gray-500">{item.percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow">
                  <h3 className="font-bold text-lg mb-6">Device Breakdown</h3>
                  <div className="flex items-center justify-center h-48">
                    <div className="flex gap-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-32 bg-primary/10 rounded-lg flex items-end overflow-hidden">
                          <div className="w-full bg-primary h-[85%]" />
                        </div>
                        <span className="text-xs font-bold">Mobile (85%)</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-32 bg-primary/10 rounded-lg flex items-end overflow-hidden">
                          <div className="w-full bg-primary h-[15%]" />
                        </div>
                        <span className="text-xs font-bold">Desktop (15%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-gray-500">Configure your funnel tracking and integrations</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl ambient-shadow divide-y divide-outline-variant/10">
                <div className="p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-lg">Meta API Integration</h3>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium text-green-800">Connected to @the_digital_agronomist</span>
                    </div>
                    <button className="text-xs font-bold text-green-700 hover:underline">Re-authenticate</button>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-lg">WhatsApp Bot Webhook</h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Webhook URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value="https://api.funneltracker.io/v1/webhook/wa_bot_123"
                        className="flex-1 bg-surface-container-low px-4 py-2 rounded-lg text-sm font-mono text-gray-600 focus:outline-none"
                      />
                      <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Copy</button>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <h3 className="font-bold text-lg">Data Management</h3>
                  <button 
                    onClick={async () => {
                      // Seed mock data for all posts
                      for (const post of initialPosts) {
                        const postDocRef = doc(db, 'posts', post.id);
                        await setDoc(postDocRef, {
                          ...post.mockData,
                          updatedAt: new Date().toISOString()
                        });
                      }
                      alert('Mock data seeded with requested totals (3,220 Comments, 1,001 DMs, 692 WhatsApp Visits)!');
                    }}
                    className="w-full py-3 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                  >
                    Seed Mock Data with Requested Totals
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, badge, badgeColor, icon }) => {
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

