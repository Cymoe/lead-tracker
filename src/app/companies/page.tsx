'use client';

import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import CompaniesGrid from '@/components/CompaniesGrid';
import { Lead } from '@/types';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SettingsModal from '@/components/modals/SettingsModal';

import AddLeadModal from '@/components/modals/AddLeadModal';
import BulkEditModal from '@/components/modals/BulkEditModal';
import GoogleSheetsSyncModal from '@/components/modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from '@/components/modals/DuplicateDetectionModal';
import AdPlatformModal from '@/components/modals/AdPlatformModal';

export default function CompaniesPage() {
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
  
  const [stats, setStats] = useState({
    totalCompanies: 0,
    companiesWithAds: 0,
    newThisWeek: 0,
    totalLeads: 0
  });

  useEffect(() => {
    // Calculate statistics
    const uniqueCompanies = new Set(leads.map(lead => lead.company_name.toLowerCase()));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newCompanies = leads.filter(lead => 
      new Date(lead.created_at) > oneWeekAgo
    );
    const uniqueNewCompanies = new Set(newCompanies.map(lead => lead.company_name.toLowerCase()));
    
    // Count companies running ads
    const companiesWithAds = leads.filter(lead => lead.running_ads).length;
    
    setStats({
      totalCompanies: uniqueCompanies.size,
      companiesWithAds: companiesWithAds,
      newThisWeek: uniqueNewCompanies.size,
      totalLeads: leads.length
    });
  }, [leads]);
  
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
        onAnalytics={() => {}} // No longer needed, handled by routing
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
              <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
              <p className="mt-2 text-gray-600">Monitor and manage your tracked companies</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-sm font-medium">Companies Tracked</p>
                <p className="text-3xl font-bold mt-1">{stats.totalCompanies}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-sm font-medium">Running Ads</p>
                <p className="text-3xl font-bold mt-1">{stats.companiesWithAds}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-sm font-medium">New This Week</p>
                <p className="text-3xl font-bold mt-1">{stats.newThisWeek}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white/80 text-sm font-medium">Total Leads</p>
                <p className="text-3xl font-bold mt-1">{stats.totalLeads}</p>
              </div>
            </div>

            {/* Companies Grid */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">All Companies</h2>
                <button 
                  onClick={() => setShowAddLead(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Lead
                </button>
              </div>
              <CompaniesGrid leads={leads} />
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