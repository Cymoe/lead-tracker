import { useState } from 'react';
import { useLeadStore } from '@/lib/store';
import { 
  CloudArrowUpIcon, 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon,
  EllipsisVerticalIcon 
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface SimpleHeaderProps {
  onBulkImport: () => void;
  onCSVImport: () => void;
  onGoogleSheetsExport: () => void;
  onCSVExport: () => void;
  onCloseCRMExport: () => void;
}

export default function SimpleHeader({
  onBulkImport,
  onCSVImport,
  onGoogleSheetsExport,
  onCSVExport,
  onCloseCRMExport,
}: SimpleHeaderProps) {
  const { selectedLeads, leads } = useLeadStore();

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Lead Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          {leads.length} total leads{selectedLeads.length > 0 && ` • ${selectedLeads.length} selected`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Import Button */}
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Import
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onBulkImport}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
                    >
                      <CloudArrowUpIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 flex-shrink-0" />
                      <span className="truncate">From URL</span>
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onCSVImport}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
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
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onGoogleSheetsExport}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
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
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
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
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full text-left`}
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