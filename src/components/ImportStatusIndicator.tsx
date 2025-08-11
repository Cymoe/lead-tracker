import { useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function ImportStatusIndicator() {
  const { activeImports, removeImportStatus, clearCompletedImports, updateImportStatus } = useLeadStore();

  // Check status of incomplete imports on mount (after page refresh)
  useEffect(() => {
    const checkIncompleteImports = async () => {
      const incompleteImports = activeImports.filter(
        imp => imp.status !== 'completed' && imp.status !== 'error'
      );

      // For incomplete imports after refresh, check if they should be marked as completed
      for (const imp of incompleteImports) {
        // Calculate time since import started
        const timeSinceStart = new Date().getTime() - new Date(imp.startedAt).getTime();
        
        // If it's been more than 2 minutes, mark as completed
        // Most imports complete within 30 seconds, so 2 minutes is a safe threshold
        if (timeSinceStart > 120000) {
          updateImportStatus(imp.id, {
            status: 'completed',
            message: imp.metadata?.searchQuery 
              ? `Import completed: ${imp.metadata.searchQuery}` 
              : 'Import completed',
            completedAt: new Date(),
            // Don't override result if it already exists
            ...(imp.result ? {} : { result: { imported: 0, skipped: 0, failed: 0 } })
          });
        }
        // If it's finalizing and been more than 30 seconds, mark as completed
        else if (imp.status === 'finalizing' && timeSinceStart > 30000) {
          updateImportStatus(imp.id, {
            status: 'completed',
            message: imp.metadata?.searchQuery 
              ? `Import completed: ${imp.metadata.searchQuery}` 
              : 'Import completed',
            completedAt: new Date(),
            // Don't override result if it already exists
            ...(imp.result ? {} : { result: { imported: 0, skipped: 0, failed: 0 } })
          });
        }
        // Otherwise, leave it showing as in progress
      }
    };

    // Only check if there are imports to check
    if (activeImports.length > 0) {
      checkIncompleteImports();
    }
  }, []); // Run only on mount

  // Auto-clear completed imports after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      activeImports.forEach(imp => {
        if ((imp.status === 'completed' || imp.status === 'error') && imp.completedAt) {
          const timeSinceComplete = now.getTime() - new Date(imp.completedAt).getTime();
          if (timeSinceComplete > 30000) { // 30 seconds
            removeImportStatus(imp.id);
          }
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(timer);
  }, [activeImports, removeImportStatus]);

  if (activeImports.length === 0) return null;

  // Check if there are any stuck imports (processing for more than 2 minutes)
  const hasStuckImports = activeImports.some(imp => {
    if (imp.status === 'processing' || imp.status === 'connecting') {
      const timeSinceStart = new Date().getTime() - new Date(imp.startedAt).getTime();
      return timeSinceStart > 120000; // 2 minutes
    }
    return false;
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {activeImports.map((importStatus) => (
        <div
          key={importStatus.id}
          className={`
            bg-gray-800 border rounded-lg shadow-lg p-4 
            ${importStatus.status === 'error' ? 'border-red-500' : 'border-blue-500'}
          `}
        >
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {importStatus.status === 'completed' ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : importStatus.status === 'error' ? (
                <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
              ) : (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {importStatus.message}
                  </p>
                  {importStatus.details && (
                    <p className="text-xs text-gray-400 mt-1">
                      {importStatus.details}
                    </p>
                  )}
                  
                  {/* Progress */}
                  {importStatus.progress && importStatus.status === 'processing' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Processing...</span>
                        <span>{importStatus.progress.current} / {importStatus.progress.total}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(importStatus.progress.current / importStatus.progress.total) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Result */}
                  {importStatus.result && importStatus.status === 'completed' && (
                    <div className="mt-2 text-xs text-gray-400">
                      {importStatus.result.imported > 0 ? (
                        <span className="text-green-400">{importStatus.result.imported} imported</span>
                      ) : (
                        <span className="text-yellow-400">No new leads imported</span>
                      )}
                      {importStatus.result.skipped > 0 && (
                        <span>, {importStatus.result.skipped} skipped (duplicates)</span>
                      )}
                      {importStatus.result.failed > 0 && (
                        <span className="text-red-400">, {importStatus.result.failed} failed</span>
                      )}
                      {/* Show total if all were skipped */}
                      {importStatus.result.imported === 0 && importStatus.result.skipped > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          All {importStatus.result.skipped} leads were already in your database
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeImportStatus(importStatus.id)}
                  className="flex-shrink-0 ml-3 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Clear all button for stuck imports */}
      {hasStuckImports && (
        <div className="bg-gray-800 border border-yellow-500 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-yellow-400">
              Some imports appear to be stuck
            </div>
            <button
              onClick={() => clearCompletedImports()}
              className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}