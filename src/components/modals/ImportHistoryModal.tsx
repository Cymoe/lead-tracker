import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { ImportOperation } from '@/types';
import { getImportHistory, canUndoOperation, revertImportOperation } from '@/lib/import-operations-api';
import { useLeadStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface ImportHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportHistoryModal({ open, onClose }: ImportHistoryModalProps) {
  const [operations, setOperations] = useState<ImportOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);
  const { setLeads, leads } = useLeadStore();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await getImportHistory();
      setOperations(history);
    } catch (error) {
      console.error('Failed to load import history:', error);
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (operation: ImportOperation) => {
    if (!canUndoOperation(operation)) {
      toast.error('This operation can no longer be undone (5 minute limit exceeded)');
      return;
    }

    setReverting(operation.id);
    
    try {
      const result = await revertImportOperation(operation.id);
      
      if (result.success) {
        // Update local state
        const updatedLeads = leads.filter(lead => lead.import_operation_id !== operation.id);
        setLeads(updatedLeads);
        
        toast.success(`Successfully removed ${result.deletedCount} leads!`);
        
        // Reload history
        await loadHistory();
      } else {
        toast.error('Failed to revert operation');
      }
    } catch (error) {
      console.error('Error reverting operation:', error);
      toast.error('Error reverting operation');
    } finally {
      setReverting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationIcon = (type: ImportOperation['operation_type']) => {
    switch (type) {
      case 'bulk_import':
        return '📋';
      case 'csv_import':
        return '📄';
      case 'google_maps_import':
        return '📍';
      case 'manual_add':
        return '✏️';
      default:
        return '📥';
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <div className="bg-white dark:bg-gray-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <ClockIcon className="h-5 w-5" />
                        Import History
                      </Dialog.Title>

                      <div className="mt-4">
                        {loading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          </div>
                        ) : operations.length === 0 ? (
                          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No import history found
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {operations.map((operation) => {
                              const canUndo = canUndoOperation(operation) && !operation.reverted_at;
                              
                              return (
                                <div
                                  key={operation.id}
                                  className={`p-4 rounded-lg border ${
                                    operation.reverted_at
                                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{getOperationIcon(operation.operation_type)}</span>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {operation.source} Import
                                        </h4>
                                        {operation.reverted_at && (
                                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                            Reverted
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <p>{operation.lead_count} leads imported</p>
                                        {operation.metadata.city && (
                                          <p>City: {operation.metadata.city}</p>
                                        )}
                                        {operation.metadata.service_type && (
                                          <p>Service: {operation.metadata.service_type}</p>
                                        )}
                                        <p className="text-xs mt-1">{formatDate(operation.created_at)}</p>
                                      </div>
                                    </div>
                                    
                                    {canUndo && (
                                      <button
                                        onClick={() => handleRevert(operation)}
                                        disabled={reverting === operation.id}
                                        className="ml-4 inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {reverting === operation.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                            Reverting...
                                          </>
                                        ) : (
                                          <>
                                            <ArrowUturnLeftIcon className="h-4 w-4" />
                                            Undo
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}