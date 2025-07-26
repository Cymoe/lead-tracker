import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { updateLead, deleteLeads } from '@/lib/api';
import { Lead } from '@/types';
import { findDuplicates, mergeLeads, DuplicateGroup } from '@/utils/duplicate-detection';
import toast from 'react-hot-toast';

interface DuplicateDetectionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DuplicateDetectionModal({ open, onClose }: DuplicateDetectionModalProps) {
  const { leads, updateLead: updateLeadInStore, deleteLead } = useLeadStore();
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [masterLeads, setMasterLeads] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && duplicateGroups.length === 0) {
      scanForDuplicates();
    }
  }, [open]);

  const scanForDuplicates = async () => {
    setIsScanning(true);
    
    // Simulate scanning delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const groups = findDuplicates(leads);
    setDuplicateGroups(groups);
    
    // Set default master leads
    const defaultMasters: Record<string, string> = {};
    groups.forEach(group => {
      if (group.suggestedMaster) {
        defaultMasters[group.id] = group.suggestedMaster.id;
      }
    });
    setMasterLeads(defaultMasters);
    
    setIsScanning(false);
  };

  const toggleGroupSelection = (groupId: string) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(groupId)) {
      newSelection.delete(groupId);
    } else {
      newSelection.add(groupId);
    }
    setSelectedGroups(newSelection);
  };

  const toggleAllGroups = () => {
    if (selectedGroups.size === duplicateGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(duplicateGroups.map(g => g.id)));
    }
  };

  const handleMergeSelected = async () => {
    if (selectedGroups.size === 0) {
      toast.error('Please select groups to merge');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const groupId of Array.from(selectedGroups)) {
        const group = duplicateGroups.find(g => g.id === groupId);
        if (!group) continue;

        const masterId = masterLeads[groupId];
        if (!masterId) continue;

        try {
          // Merge the leads
          const mergedData = mergeLeads(group.leads, masterId);
          
          // Update the master lead with merged data
          const updatedLead = await updateLead(masterId, mergedData);
          updateLeadInStore(updatedLead);
          
          // Delete the duplicate leads (except master)
          const duplicateIds = group.leads
            .filter(lead => lead.id !== masterId)
            .map(lead => lead.id);
          
          if (duplicateIds.length > 0) {
            await deleteLeads(duplicateIds);
            duplicateIds.forEach(id => deleteLead(id));
          }
          
          successCount++;
        } catch (error) {
          console.error(`Failed to merge group ${groupId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Merged ${successCount} duplicate group${successCount !== 1 ? 's' : ''}`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to merge ${errorCount} group${errorCount !== 1 ? 's' : ''}`);
      }

      // Refresh duplicates list
      await scanForDuplicates();
      setSelectedGroups(new Set());
    } catch (error) {
      toast.error('An error occurred during merge');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMatchTypeLabel = (matchType: string): string => {
    switch (matchType) {
      case 'phone': return 'Same Phone Number';
      case 'instagram': return 'Same Instagram Handle';
      case 'company': return 'Same Company Name';
      case 'fuzzy': return 'Similar Company Name';
      default: return 'Match';
    }
  };

  const getMatchTypeColor = (matchType: string): string => {
    switch (matchType) {
      case 'phone': return 'text-red-600 bg-red-50';
      case 'instagram': return 'text-purple-600 bg-purple-50';
      case 'company': return 'text-blue-600 bg-blue-50';
      case 'fuzzy': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.leads.length - 1, 0);

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
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
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Duplicate Detection
                      </Dialog.Title>

                      {isScanning ? (
                        <div className="mt-4 text-center py-8">
                          <div className="inline-flex items-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg">Scanning for duplicates...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          {duplicateGroups.length === 0 ? (
                            <div className="text-center py-8">
                              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                              <p className="mt-2 text-lg font-medium text-gray-900">No duplicates found!</p>
                              <p className="mt-1 text-sm text-gray-500">Your lead database is clean.</p>
                            </div>
                          ) : (
                            <>
                              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                <div className="flex">
                                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                  <div className="ml-3">
                                    <p className="text-sm text-yellow-800">
                                      Found <span className="font-semibold">{duplicateGroups.length}</span> duplicate groups
                                      containing <span className="font-semibold">{totalDuplicates}</span> duplicate leads.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-4 flex justify-between items-center">
                                <button
                                  onClick={toggleAllGroups}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {selectedGroups.size === duplicateGroups.length ? 'Deselect all' : 'Select all'}
                                </button>
                                <button
                                  onClick={scanForDuplicates}
                                  className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Rescan
                                </button>
                              </div>

                              <div className="space-y-4 max-h-96 overflow-y-auto">
                                {duplicateGroups.map((group) => (
                                  <div
                                    key={group.id}
                                    className={`border rounded-lg p-4 ${
                                      selectedGroups.has(group.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start">
                                      <input
                                        type="checkbox"
                                        checked={selectedGroups.has(group.id)}
                                        onChange={() => toggleGroupSelection(group.id)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                      />
                                      <div className="ml-3 flex-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(group.matchType)}`}>
                                              {getMatchTypeLabel(group.matchType)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                              {group.leads.length} leads • {Math.round(group.confidence * 100)}% confidence
                                            </span>
                                          </div>
                                        </div>

                                        <div className="mt-2 space-y-2">
                                          {group.leads.map((lead) => (
                                            <label
                                              key={lead.id}
                                              className="flex items-center space-x-3 text-sm"
                                            >
                                              <input
                                                type="radio"
                                                name={`master-${group.id}`}
                                                value={lead.id}
                                                checked={masterLeads[group.id] === lead.id}
                                                onChange={(e) => setMasterLeads({ ...masterLeads, [group.id]: e.target.value })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                              />
                                              <div className="flex-1">
                                                <span className="font-medium">{lead.company_name}</span>
                                                {lead.phone && <span className="text-gray-500 ml-2">{lead.phone}</span>}
                                                {lead.city && <span className="text-gray-500 ml-2">{lead.city}</span>}
                                                {masterLeads[group.id] === lead.id && (
                                                  <span className="ml-2 text-xs text-blue-600">(Keep this one)</span>
                                                )}
                                              </div>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {duplicateGroups.length > 0 && !isScanning && (
                    <button
                      type="button"
                      onClick={handleMergeSelected}
                      disabled={selectedGroups.size === 0 || isProcessing}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Merging...' : `Merge ${selectedGroups.size} Selected`}
                    </button>
                  )}
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
  );
}