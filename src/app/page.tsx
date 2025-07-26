'use client';

import { useEffect, useState } from 'react';
import { useLeadStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SimpleHeader from '@/components/SimpleHeader';
import StatsGrid from '@/components/StatsGrid';
import LeadTable from '@/components/LeadTable';
import SourceFilter from '@/components/SourceFilter';
import AddLeadModal from '@/components/modals/AddLeadModal';
import BulkImportModal from '@/components/modals/BulkImportModal';
import BulkEditModal from '@/components/modals/BulkEditModal';
import SettingsModal from '@/components/modals/SettingsModal';
import GoogleSheetsExportModal from '@/components/modals/GoogleSheetsExportModal';
import CloseCRMExportModal from '@/components/modals/CloseCRMExportModal';
import GoogleSheetsSyncModal from '@/components/modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from '@/components/modals/DuplicateDetectionModal';
import CSVImportModal from '@/components/modals/CSVImportModal';
import AnalyticsDashboardModal from '@/components/modals/AnalyticsDashboardModal';
import { fetchLeads } from '@/lib/api';
import { exportToGoogleSheets, exportToCSV } from '@/utils/export';

export default function HomePage() {
  const { setLeads, leads, selectedLeads, setSelectedLeads } = useLeadStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Modal states
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleSheetsExport, setShowGoogleSheetsExport] = useState(false);
  const [showCloseCRMExport, setShowCloseCRMExport] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user]);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadLeads();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      if (user) {
        loadLeads();
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const loadLeads = async () => {
    try {
      const data = await fetchLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };
  
  const handleGoogleSheetsExport = () => {
    const success = exportToGoogleSheets(leads);
    if (success) {
      setShowGoogleSheetsExport(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Sidebar
        onAddLead={() => setShowAddLead(true)}
        onGoogleSheetsSync={() => setShowGoogleSheetsSync(true)}
        onDuplicateDetection={() => setShowDuplicateDetection(true)}
        onAnalytics={() => setShowAnalytics(true)}
        onSettings={() => setShowSettings(true)}
        onBulkEdit={() => setShowBulkEdit(true)}
      />
      
      <div className="lg:pl-72">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <SimpleHeader 
              onBulkImport={() => setShowBulkImport(true)}
              onCSVImport={() => setShowCSVImport(true)}
              onGoogleSheetsExport={handleGoogleSheetsExport}
              onCSVExport={() => exportToCSV(leads)}
              onCloseCRMExport={() => setShowCloseCRMExport(true)}
            />
            <StatsGrid leads={leads} />
            <SourceFilter />
            <LeadTable />
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <BulkImportModal open={showBulkImport} onClose={() => setShowBulkImport(false)} />
      <BulkEditModal 
        open={showBulkEdit} 
        onClose={() => {
          setShowBulkEdit(false);
          setSelectedLeads([]);
        }} 
        selectedLeadIds={selectedLeads}
      />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <GoogleSheetsExportModal open={showGoogleSheetsExport} onClose={() => setShowGoogleSheetsExport(false)} />
      <CloseCRMExportModal open={showCloseCRMExport} onClose={() => setShowCloseCRMExport(false)} />
      <GoogleSheetsSyncModal open={showGoogleSheetsSync} onClose={() => setShowGoogleSheetsSync(false)} />
      <DuplicateDetectionModal open={showDuplicateDetection} onClose={() => setShowDuplicateDetection(false)} />
      <CSVImportModal open={showCSVImport} onClose={() => setShowCSVImport(false)} />
      <AnalyticsDashboardModal open={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </>
  );
}