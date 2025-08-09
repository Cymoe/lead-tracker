import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface ActiveImport {
  id: string;
  apify_run_id: string;
  import_status: string;
  leads_imported: number;
  result_count: number;
  import_started_at: string;
  search_params: any;
}

export default function ActiveImports() {
  const [activeImports, setActiveImports] = useState<ActiveImport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveImports();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadActiveImports, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadActiveImports = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('apify_search_results')
      .select('id, apify_run_id, import_status, leads_imported, result_count, import_started_at, search_params')
      .eq('user_id', user.id)
      .in('import_status', ['pending', 'processing'])
      .order('import_started_at', { ascending: false });

    if (!error && data) {
      setActiveImports(data);
    }
    setLoading(false);
  };

  const checkImportStatus = async (searchResultId: string) => {
    try {
      const response = await fetch(`/api/apify-import-process?id=${searchResultId}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        toast.success(`Import completed! ${data.leadsImported} leads imported.`);
        loadActiveImports();
      } else if (data.status === 'failed') {
        toast.error(`Import failed: ${data.error}`);
        loadActiveImports();
      }
    } catch (error) {
      console.error('Error checking import status:', error);
    }
  };

  const completeImport = async (searchResultId: string) => {
    const toastId = toast.loading('Completing import...');
    
    try {
      const response = await fetch('/api/apify-import-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchResultId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast.success(`Successfully imported ${data.imported} leads!`, { id: toastId });
      loadActiveImports();
      
      // Refresh the main leads list
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed', { id: toastId });
    }
  };

  if (loading) return null;
  if (activeImports.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Active Imports ({activeImports.length})
        </h3>
        <div className="space-y-2">
          {activeImports.map((imp) => {
            const elapsedMinutes = Math.floor(
              (Date.now() - new Date(imp.import_started_at).getTime()) / 60000
            );
            
            return (
              <div key={imp.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {imp.search_params?.locationQuery || 'Unknown location'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {imp.import_status === 'pending' ? 'Ready to import' : 'Processing'} • 
                      {imp.result_count} leads • 
                      {elapsedMinutes > 0 ? ` ${elapsedMinutes}m ago` : ' Just now'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {imp.import_status === 'pending' && (
                      <button
                        onClick={() => completeImport(imp.id)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Import
                      </button>
                    )}
                    {imp.import_status === 'processing' && (
                      <button
                        onClick={() => checkImportStatus(imp.id)}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Check
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}