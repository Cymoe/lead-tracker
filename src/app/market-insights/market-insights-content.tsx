'use client';

import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useRouter } from 'next/navigation';
import MarketAnalysis from '@/components/MarketAnalysis';
import SettingsModal from '@/components/modals/SettingsModal';
import AddLeadModal from '@/components/modals/AddLeadModal';
import BulkEditModal from '@/components/modals/BulkEditModal';
import GoogleSheetsSyncModal from '@/components/modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from '@/components/modals/DuplicateDetectionModal';

export default function MarketInsightsContent() {
  const { leads, selectedLeads, setSelectedLeads } = useLeadStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Get sidebar state from context
  const { isSidebarCollapsed, setIsSidebarCollapsed, isViewsPanelOpen } = useLayout();
  
  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingScreen />;
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
        onAnalytics={() => router.push('/analytics')}
        onSettings={() => setShowSettings(true)}
        onBulkEdit={() => setShowBulkEdit(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <div className={`flex-1 ${
        isSidebarCollapsed 
          ? isViewsPanelOpen ? 'lg:pl-[384px]' : 'lg:pl-16'
          : isViewsPanelOpen ? 'lg:pl-[544px]' : 'lg:pl-56'
      }`}>
        <main className="py-10 bg-gray-50 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">
            <MarketAnalysis leads={leads} />
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
    </>
  );
}