'use client';

import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import SettingsModal from '@/components/modals/SettingsModal';
import AddLeadModal from '@/components/modals/AddLeadModal';
import BulkEditModal from '@/components/modals/BulkEditModal';
import GoogleSheetsSyncModal from '@/components/modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from '@/components/modals/DuplicateDetectionModal';
import AdPlatformModal from '@/components/modals/AdPlatformModal';

export default function AnalyticsPage() {
  const { leads, selectedLeads, setSelectedLeads } = useLeadStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });
  
  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  const [showAdPlatformCheck, setShowAdPlatformCheck] = useState(false);
  
  const handleToggleSidebar = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', newValue.toString());
  };
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Calculate analytics data
  const analytics = {
    totalLeads: leads.length,
    runningAds: leads.filter(l => l.running_ads).length,
    dataQuality: leads.length > 0 ? ((leads.filter(l => l.phone || l.instagram_url || l.website).length / leads.length) * 100).toFixed(1) : '0.0',
    leadSources: {
      'Instagram Manual': leads.filter(l => l.lead_source === 'Instagram Manual').length,
      'FB Ad Library': leads.filter(l => l.lead_source === 'FB Ad Library').length,
      'Google Maps': leads.filter(l => l.lead_source === 'Google Maps').length,
    },
    topCities: leads.reduce((acc, lead) => {
      const city = lead.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    topServices: leads.reduce((acc, lead) => {
      const service = lead.service_type || 'General';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    phoneNumbers: leads.filter(l => l.phone).length,
    instagramHandles: leads.filter(l => l.handle).length,
    websites: leads.filter(l => l.website).length,
    emails: leads.filter(l => l.email).length,
    exportedToClose: leads.filter(l => l.close_crm_id).length,
  };

  // Sort cities and services by count
  const sortedCities = Object.entries(analytics.topCities).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sortedServices = Object.entries(analytics.topServices).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Calculate week-over-week trend
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const leadsThisWeek = leads.filter(l => new Date(l.created_at) >= thisWeek).length;
  const trendPercentage = leads.length > 0 ? ((leadsThisWeek / leads.length) * 100).toFixed(0) : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Sidebar
        onAddLead={() => setShowAddLead(true)}
        onGoogleSheetsSync={() => setShowGoogleSheetsSync(true)}
        onDuplicateDetection={() => setShowDuplicateDetection(true)}
        onAnalytics={() => {}} // We're already on analytics page
        onSettings={() => setShowSettings(true)}
        onBulkEdit={() => setShowBulkEdit(true)}
        onAdPlatformCheck={() => setShowAdPlatformCheck(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <div className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        <main className="py-10 bg-gray-50 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-600 text-sm">Total Leads</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{analytics.totalLeads}</p>
                <div className="flex items-center mt-2 text-green-600 text-sm">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span>{trendPercentage}% this week</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-600 text-sm">Running Ads</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{analytics.runningAds}</p>
                <p className="text-gray-500 text-sm mt-2">{analytics.totalLeads > 0 ? ((analytics.runningAds / analytics.totalLeads) * 100).toFixed(0) : '0'}% of leads</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-600 text-sm">Data Quality</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{analytics.dataQuality}%</p>
                <p className="text-gray-500 text-sm mt-2">Average completeness</p>
              </div>
            </div>

            {/* Top Lists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Lead Sources */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Lead Sources</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.leadSources).map(([source, count]) => (
                    <div key={source} className="flex justify-between items-center">
                      <span className="text-gray-600">{source}</span>
                      <span className="text-gray-900 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Cities */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cities</h3>
                <div className="space-y-3">
                  {sortedCities.map(([city, count]) => (
                    <div key={city} className="flex justify-between items-center">
                      <span className="text-gray-600">{city}</span>
                      <span className="text-gray-900 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Services */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
                <div className="space-y-3">
                  {sortedServices.map(([service, count]) => (
                    <div key={service} className="flex justify-between items-center">
                      <span className="text-gray-600">{service}</span>
                      <span className="text-gray-900 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Completeness */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Completeness</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Phone Numbers</span>
                    <span className="text-gray-900 font-semibold">
                      {analytics.totalLeads > 0 ? ((analytics.phoneNumbers / analytics.totalLeads) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: analytics.totalLeads > 0 ? `${(analytics.phoneNumbers / analytics.totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Email Addresses</span>
                    <span className="text-gray-900 font-semibold">
                      {analytics.totalLeads > 0 ? ((analytics.emails / analytics.totalLeads) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: analytics.totalLeads > 0 ? `${(analytics.emails / analytics.totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Instagram Handles</span>
                    <span className="text-gray-900 font-semibold">
                      {analytics.totalLeads > 0 ? ((analytics.instagramHandles / analytics.totalLeads) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: analytics.totalLeads > 0 ? `${(analytics.instagramHandles / analytics.totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Websites</span>
                    <span className="text-gray-900 font-semibold">
                      {analytics.totalLeads > 0 ? ((analytics.websites / analytics.totalLeads) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: analytics.totalLeads > 0 ? `${(analytics.websites / analytics.totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Exported to Close CRM</span>
                    <span className="text-gray-900 font-semibold">
                      {analytics.exportedToClose} leads
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: analytics.totalLeads > 0 ? `${(analytics.exportedToClose / analytics.totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <BulkEditModal 
        open={showBulkEdit} 
        onClose={() => {
          setShowBulkEdit(false);
          setSelectedLeads([]);
        }} 
        selectedLeadIds={selectedLeads}
      />
      <GoogleSheetsSyncModal open={showGoogleSheetsSync} onClose={() => setShowGoogleSheetsSync(false)} />
      <DuplicateDetectionModal open={showDuplicateDetection} onClose={() => setShowDuplicateDetection(false)} />
      <AdPlatformModal 
        open={showAdPlatformCheck} 
        onClose={() => setShowAdPlatformCheck(false)} 
        selectedLeadIds={selectedLeads}
      />
    </>
  );
} 