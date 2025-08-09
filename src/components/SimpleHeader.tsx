import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  MapIcon
} from '@heroicons/react/24/outline';
import { FaFacebook } from 'react-icons/fa';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface SimpleHeaderProps {
  onBulkImport: () => void;
  onCSVImport: () => void;
  onGoogleMapsImport: () => void;
  onGoogleSheetsExport: () => void;
  onCSVExport: () => void;
  onCloseCRMExport: () => void;
  totalCount?: number;
  isViewsPanelOpen?: boolean;
}

export default function SimpleHeader({
  onBulkImport,
  onCSVImport,
  onGoogleMapsImport,
  onGoogleSheetsExport,
  onCSVExport,
  onCloseCRMExport,
  totalCount,
  isViewsPanelOpen = false,
}: SimpleHeaderProps) {
  const { selectedLeads, leads } = useLeadStore();

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-gray-900">Leads</h1>
        <span className="text-xs text-gray-400">
          {leads.length.toLocaleString()}{totalCount && totalCount > leads.length ? ` of ${totalCount.toLocaleString()}` : ''}{selectedLeads.length > 0 && ` · ${selectedLeads.length} selected`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Import Button */}
        <Menu as="div" className="relative inline-block text-left z-50">
          <Menu.Button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <DocumentArrowUpIcon className="h-3.5 w-3.5" />
            <span className="ml-1">Import</span>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-[99999] mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onGoogleMapsImport}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    >
                      <MapIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" />
                      <span className="truncate">Google Maps</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onBulkImport}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    >
                      <FaFacebook className="mr-3 h-5 w-5 text-[#1877F2] group-hover:text-[#1877F2]/80 flex-shrink-0" />
                      <span className="truncate">Import from FB Ad Library</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onCSVImport}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    >
                      <DocumentArrowUpIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" />
                      <span className="truncate">CSV File</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Export Button */}
        <Menu as="div" className="relative inline-block text-left z-50">
          <Menu.Button className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
            <span className="ml-1">Export</span>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-[99999] mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onGoogleSheetsExport}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    >
                      <DocumentArrowDownIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" />
                      <span className="truncate">Google Sheets</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onCSVExport}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    >
                      <DocumentArrowDownIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" />
                      <span className="truncate">CSV File</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onCloseCRMExport}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                      } group flex items-center px-4 py-2 text-sm w-full text-left transition-colors`}
                    >
                      <DocumentArrowDownIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" />
                      <span className="truncate">Close CRM</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
}