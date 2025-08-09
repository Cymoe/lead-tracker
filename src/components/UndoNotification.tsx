import { Fragment, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import { ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { canUndoOperation, getLastImportOperation } from '@/lib/import-operations-api';
import toast from 'react-hot-toast';

export default function UndoNotification() {
  const { lastImportOperation, undoLastImport, undoInProgress, setLastImportOperation } = useLeadStore();
  const [show, setShow] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);

  // Check for last import operation on mount
  useEffect(() => {
    const checkLastOperation = async () => {
      try {
        const operation = await getLastImportOperation();
        if (operation && canUndoOperation(operation)) {
          setLastImportOperation(operation);
        }
      } catch (error) {
        console.error('Failed to fetch last import operation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLastOperation();
  }, [setLastImportOperation]);

  useEffect(() => {
    if (lastImportOperation && canUndoOperation(lastImportOperation)) {
      setShow(true);
      
      // Calculate time remaining
      const createdAt = new Date(lastImportOperation.created_at);
      const now = new Date();
      const secondsPassed = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      const remaining = Math.max(0, 300 - secondsPassed);
      setTimeRemaining(remaining);

      // Start countdown
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setShow(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setShow(false);
    }
  }, [lastImportOperation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUndo = async () => {
    if (undoInProgress) return;
    
    const toastId = toast.loading('Undoing import...');
    
    try {
      const result = await undoLastImport();
      
      if (result.success) {
        toast.success(
          `Successfully reverted ${result.deletedCount} lead${result.deletedCount !== 1 ? 's' : ''}`,
          { id: toastId }
        );
        setShow(false);
      } else {
        toast.error('Failed to undo import', { id: toastId });
      }
    } catch (error) {
      toast.error('An error occurred while undoing', { id: toastId });
    }
  };

  if (!lastImportOperation) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <Transition
          show={show}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ArrowUturnLeftIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Import Complete
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Added {lastImportOperation.lead_count} lead{lastImportOperation.lead_count !== 1 ? 's' : ''} from {lastImportOperation.source}
                  </p>
                  <div className="mt-3 flex space-x-3">
                    {undoInProgress ? (
                      <>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Undoing...
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button
                          type="button"
                          onClick={() => setShow(false)}
                          className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 focus:outline-none"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleUndo}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none"
                        >
                          Undo ({formatTime(timeRemaining)})
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button
                          type="button"
                          onClick={() => setShow(false)}
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                    onClick={() => setShow(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}