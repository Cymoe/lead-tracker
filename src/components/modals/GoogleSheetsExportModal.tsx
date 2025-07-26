import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface GoogleSheetsExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GoogleSheetsExportModal({ open, onClose }: GoogleSheetsExportModalProps) {
  const instructions = `1. Open a new Google Sheet
2. Go to File > Import
3. Upload the downloaded file
4. Choose "Replace current sheet"
5. Select "Tab" as the separator
6. Click "Import data"`;

  const copyInstructions = () => {
    navigator.clipboard.writeText(instructions);
    toast.success('Instructions copied to clipboard!');
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Export Complete!
                      </Dialog.Title>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Your leads have been exported in a Google Sheets-compatible format. Follow these steps to import them:
                        </p>
                        
                        <div className="bg-gray-50 rounded-lg p-4 relative">
                          <button
                            onClick={copyInstructions}
                            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                            title="Copy instructions"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                          
                          <ol className="text-sm space-y-2 text-gray-700">
                            <li>1. Open a new Google Sheet</li>
                            <li>2. Go to <strong>File → Import</strong></li>
                            <li>3. Upload the downloaded file</li>
                            <li>4. Choose <strong>"Replace current sheet"</strong></li>
                            <li>5. Select <strong>"Tab"</strong> as the separator</li>
                            <li>6. Click <strong>"Import data"</strong></li>
                          </ol>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>💡 Pro tip:</strong> Save the Google Sheet URL in your bookmarks for easy access. In Phase 2, we'll add automatic sync!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={onClose}
                  >
                    Got it!
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