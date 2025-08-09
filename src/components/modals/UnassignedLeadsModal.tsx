import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MapPinIcon, PhoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import { detectMetroArea } from '@/utils/metro-areas';
import { normalizeState } from '@/utils/state-utils';
import { getStateFromPhone, extractAreaCode, AREA_CODES } from '@/utils/area-codes';
import { getCityFromPhone, AREA_CODE_CITIES } from '@/utils/area-code-cities';

interface UnassignedLeadsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UnassignedLeadsModal({ open, onClose }: UnassignedLeadsModalProps) {
  const { leads } = useLeadStore();
  
  // Get unassigned leads with detailed reasons
  const unassignedLeads = leads.filter(lead => {
    let detectedState = normalizeState(lead.state);
    let detectedCity = lead.city || '';
    
    // Extract city from company name if not already set
    if (!detectedCity && lead.company_name) {
      // Common patterns: "Company - City" or "Company in City"
      const dashMatch = lead.company_name.match(/\s*-\s*([A-Za-z\s]+?)$/);
      const inMatch = lead.company_name.match(/\sin\s+([A-Za-z\s]+?)$/i);
      const potentialCity = dashMatch?.[1] || inMatch?.[1];
      
      if (potentialCity) {
        const trimmedCity = potentialCity.trim();
        // Check if this is a known city
        const detectedMetro = detectMetroArea(trimmedCity, '');
        if (detectedMetro) {
          detectedCity = trimmedCity;
          if (!detectedState) {
            detectedState = detectedMetro.state;
          }
        }
      }
    }
    
    if (!detectedState && detectedCity) {
      const detectedMetro = detectMetroArea(detectedCity, '');
      if (detectedMetro) detectedState = detectedMetro.state;
    }
    
    if (lead.phone) {
      if (!detectedState) {
        detectedState = getStateFromPhone(lead.phone) || '';
      }
      if (!detectedCity) {
        detectedCity = getCityFromPhone(lead.phone) || '';
      }
    }
    
    return !detectedCity && !detectedState;
  }).map(lead => {
    // Analyze why the lead is unassigned
    const reasons: string[] = [];
    const areaCode = extractAreaCode(lead.phone);
    
    if (!lead.city && !lead.state) {
      reasons.push('No location data provided');
    } else {
      if (lead.city && !lead.state) {
        const metro = detectMetroArea(lead.city, '');
        if (!metro) {
          reasons.push(`City "${lead.city}" not recognized in metro database`);
        }
      }
      if (lead.state && !normalizeState(lead.state)) {
        reasons.push(`State "${lead.state}" not recognized`);
      }
    }
    
    if (lead.phone) {
      if (!areaCode) {
        reasons.push('Phone number format not recognized');
      } else if (!AREA_CODES[areaCode]) {
        reasons.push(`Area code ${areaCode} not in database`);
      }
    } else {
      reasons.push('No phone number to detect location');
    }
    
    return { lead, reasons };
  });

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      Unassigned Leads ({unassignedLeads.length})
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        These leads could not be automatically assigned to any market. Review the reasons below and update their information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                  {unassignedLeads.map(({ lead, reasons }) => (
                    <div key={lead.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {lead.company_name}
                          </h4>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                            {lead.city && (
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                <span>City: {lead.city}</span>
                              </div>
                            )}
                            {lead.state && (
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                <span>State: {lead.state}</span>
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1">
                                <PhoneIcon className="h-3.5 w-3.5" />
                                <span>Phone: {lead.phone}</span>
                                {extractAreaCode(lead.phone) && (
                                  <span className="text-xs text-gray-400">
                                    (Area code: {extractAreaCode(lead.phone)})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                              Reasons for being unassigned:
                            </p>
                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                              {reasons.map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-yellow-500">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Trigger edit by clicking on the company cell which has onClick handler
                            const companyCell = document.querySelector(`[data-lead-id="${lead.id}"] td:nth-child(3)`) as HTMLTableCellElement;
                            if (companyCell) {
                              companyCell.click();
                              onClose();
                            }
                          }}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {unassignedLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      All leads have been successfully assigned to markets!
                    </div>
                  )}
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
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