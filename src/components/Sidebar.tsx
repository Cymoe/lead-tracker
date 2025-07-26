import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  Bars3Icon,
  HomeIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadStore } from '@/lib/store';

interface SidebarProps {
  onAddLead: () => void;
  onGoogleSheetsSync: () => void;
  onDuplicateDetection: () => void;
  onAnalytics: () => void;
  onSettings: () => void;
  onBulkEdit: () => void;
}

export default function Sidebar({
  onAddLead,
  onGoogleSheetsSync,
  onDuplicateDetection,
  onAnalytics,
  onSettings,
  onBulkEdit,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { selectedLeads } = useLeadStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', icon: HomeIcon, current: true, onClick: () => {} },
    { name: 'Analytics', icon: ChartBarIcon, current: false, onClick: onAnalytics },
  ];

  const actions = [
    { name: 'Add Lead', icon: PlusIcon, onClick: onAddLead },
  ];

  const tools = [
    { name: 'Find Duplicates', icon: MagnifyingGlassCircleIcon, onClick: onDuplicateDetection },
    { name: 'Sync to Sheets', icon: ArrowsRightLeftIcon, onClick: onGoogleSheetsSync },
    ...(selectedLeads.length > 0 ? [
      { name: `Edit ${selectedLeads.length} Selected`, icon: PencilSquareIcon, onClick: onBulkEdit },
    ] : []),
  ];

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-xl font-bold text-gray-900">🎯 Lead Tracker Pro</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <button
                                onClick={() => handleItemClick(item.onClick)}
                                className={`${
                                  item.current
                                    ? 'bg-gray-50 text-blue-600'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full`}
                              >
                                <item.icon
                                  className={`${
                                    item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                                  } h-6 w-6 shrink-0`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                      
                      <li>
                        <div className="text-xs font-semibold leading-6 text-gray-400">Actions</div>
                        <ul role="list" className="-mx-2 mt-2 space-y-1">
                          {actions.map((item) => (
                            <li key={item.name}>
                              <button
                                onClick={() => handleItemClick(item.onClick)}
                                className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                              >
                                <item.icon
                                  className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>

                      <li>
                        <div className="text-xs font-semibold leading-6 text-gray-400">Tools</div>
                        <ul role="list" className="-mx-2 mt-2 space-y-1">
                          {tools.map((item) => (
                            <li key={item.name}>
                              <button
                                onClick={() => handleItemClick(item.onClick)}
                                className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                              >
                                <item.icon
                                  className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>

                      <li className="mt-auto">
                        <div className="border-t pt-4">
                          <button
                            onClick={() => handleItemClick(onSettings)}
                            className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                          >
                            <Cog6ToothIcon
                              className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            Settings
                          </button>
                          <button
                            onClick={signOut}
                            className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                          >
                            <ArrowRightOnRectangleIcon
                              className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                              aria-hidden="true"
                            />
                            Sign out
                          </button>
                          <div className="mt-2 px-2">
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900">🎯 Lead Tracker Pro</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={item.onClick}
                        className={`${
                          item.current
                            ? 'bg-gray-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full`}
                      >
                        <item.icon
                          className={`${
                            item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          } h-6 w-6 shrink-0`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">Actions</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {actions.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={item.onClick}
                        className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                      >
                        <item.icon
                          className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>

              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">Tools</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {tools.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={item.onClick}
                        className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                      >
                        <item.icon
                          className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="mt-auto">
                <div className="border-t pt-4">
                  <button
                    onClick={onSettings}
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                  >
                    <Cog6ToothIcon
                      className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    Settings
                  </button>
                  <button
                    onClick={signOut}
                    className="text-gray-700 hover:text-blue-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full"
                  >
                    <ArrowRightOnRectangleIcon
                      className="text-gray-400 group-hover:text-blue-600 h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    Sign out
                  </button>
                  <div className="mt-2 px-2">
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">🎯 Lead Tracker Pro</div>
      </div>
    </>
  );
}