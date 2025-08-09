import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, KeyIcon, LinkIcon, SunIcon, MoonIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';
import ServiceTypeNormalizationButton from '@/components/ServiceTypeNormalizationButton';
import { deleteAllLeads } from '@/lib/api';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { googleScriptUrl, openaiApiKey, setGoogleScriptUrl, setOpenAIApiKey, resetAllLeads } = useLeadStore();
  const { darkMode, toggleDarkMode } = useTheme();
  const [scriptUrl, setScriptUrl] = useState(googleScriptUrl);
  const [apiKey, setApiKey] = useState(openaiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Sync state when modal opens
  React.useEffect(() => {
    if (open) {
      setScriptUrl(googleScriptUrl);
      setApiKey(openaiApiKey || '');
    }
  }, [open, googleScriptUrl, openaiApiKey]);

  const handleSaveScriptUrl = () => {
    if (!scriptUrl.trim()) {
      toast.error('Please enter a valid Google Apps Script URL');
      return;
    }
    setGoogleScriptUrl(scriptUrl);
    toast.success('Google Apps Script URL updated!');
  };

  const handleSaveApiKey = () => {
    console.log('Saving API key:', apiKey);
    
    if (apiKey && !apiKey.startsWith('sk-')) {
      toast.error('Invalid API key format. OpenAI keys start with "sk-"');
      return;
    }
    
    // Directly save to localStorage too
    if (typeof window !== 'undefined') {
      localStorage.setItem('openaiApiKey', apiKey);
    }
    
    setOpenAIApiKey(apiKey);
    toast.success(apiKey ? 'OpenAI API key updated!' : 'OpenAI API key removed');
    setShowApiKey(false);
  };

  const handleDeleteAllLeads = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteAllLeads();
      
      if (result.success) {
        // Reset the store state
        resetAllLeads();
        toast.success(result.message);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        toast.error(result.message || 'Failed to delete leads');
      }
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete leads');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
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
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        ⚙️ Settings
                      </Dialog.Title>

                      <div className="mt-6 space-y-6">
                        <div>
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <LinkIcon className="h-5 w-5 mr-2" />
                            Google Apps Script URL
                          </label>
                          <input
                            type="text"
                            value={scriptUrl}
                            onChange={(e) => setScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={handleSaveScriptUrl}
                            className="mt-2 btn btn-primary"
                          >
                            Update URL
                          </button>
                        </div>

                        <div className="border-t pt-6">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <KeyIcon className="h-5 w-5 mr-2" />
                            OpenAI API Key
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              value={apiKey}
                              onChange={(e) => {
                                console.log('Input changed:', e.target.value);
                                setApiKey(e.target.value);
                              }}
                              placeholder="sk-..."
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showApiKey ? '🙈' : '👁️'}
                            </button>
                          </div>
                          <button
                            onClick={handleSaveApiKey}
                            className="mt-2 btn btn-primary"
                          >
                            Update API Key
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            Get your API key from{' '}
                            <a
                              href="https://platform.openai.com/api-keys"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              OpenAI Platform
                            </a>
                          </p>
                        </div>

                        <div className="border-t pt-6">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            {darkMode ? <MoonIcon className="h-5 w-5 mr-2" /> : <SunIcon className="h-5 w-5 mr-2" />}
                            Appearance
                          </label>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {darkMode ? 'Dark mode' : 'Light mode'}
                            </span>
                            <button
                              onClick={toggleDarkMode}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                darkMode ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                              role="switch"
                              aria-checked={darkMode}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  darkMode ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Toggle between light and dark themes
                          </p>
                        </div>

                        <div className="border-t pt-6">
                          <ServiceTypeNormalizationButton />
                        </div>

                        <div className="border-t pt-6">
                          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                            <TrashIcon className="h-5 w-5 mr-2 text-red-600" />
                            Danger Zone
                          </label>
                          <p className="text-sm text-gray-600 mb-3">
                            Permanently delete all your leads. This action cannot be undone.
                          </p>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete All Leads
                          </button>
                        </div>

                        <div className="border-t pt-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                          <p className="text-sm text-gray-600">
                            Lead Tracker Pro v2.0 - Built with React/Next.js
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Multi-tenant ready architecture
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={() => {
                      handleSaveScriptUrl();
                      handleSaveApiKey();
                      onClose();
                    }}
                  >
                    Save All Settings
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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

      {/* Delete Confirmation Dialog */}
      <Transition.Root show={showDeleteConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteConfirm(false)}>
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
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Delete all leads
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete all your leads? This action cannot be undone. All of your lead data will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleDeleteAllLeads}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete all'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
    </>
  );
}