import { Fragment, useState, useCallback, useEffect } from 'react';
import { Dialog, Transition, Combobox } from '@headlessui/react';
import { MagnifyingGlassIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { 
  UserGroupIcon, 
  FunnelIcon, 
  ArrowsUpDownIcon, 
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types';
import toast from 'react-hot-toast';

interface CommandItem {
  id: string;
  name: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'leads' | 'actions' | 'filters' | 'sort';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead?: () => void;
  onBulkEdit?: () => void;
  onExport?: () => void;
}

export default function CommandPalette({ 
  isOpen, 
  onClose,
  onAddLead,
  onBulkEdit,
  onExport
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { 
    leads, 
    selectedLeads,
    setSourceFilter,
    setCityFilter,
    setServiceTypeFilter,
    sortBy,
    setSortBy,
    setSortDirection
  } = useLeadStore();

  // Extract unique cities and service types
  const cities = Array.from(new Set(leads.map(l => l.city).filter((city): city is string => Boolean(city))));
  const serviceTypes = Array.from(new Set(leads.map(l => l.service_type).filter((type): type is string => Boolean(type))));

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      name: 'Go to Dashboard',
      icon: UserGroupIcon,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
      category: 'navigation',
      keywords: ['dashboard', 'home']
    },
    {
      id: 'nav-analytics',
      name: 'Go to Analytics',
      icon: UserGroupIcon,
      action: () => {
        router.push('/analytics');
        onClose();
      },
      category: 'navigation',
      keywords: ['analytics', 'stats', 'metrics']
    },
    
    // Lead Actions
    {
      id: 'add-lead',
      name: 'Add New Lead',
      icon: PlusIcon,
      action: () => {
        onAddLead?.();
        onClose();
      },
      category: 'actions',
      keywords: ['add', 'new', 'create', 'lead']
    },
    ...(selectedLeads.length > 0 ? [
      {
        id: 'bulk-edit',
        name: `Edit ${selectedLeads.length} Selected Leads`,
        icon: PencilSquareIcon,
        action: () => {
          onBulkEdit?.();
          onClose();
        },
        category: 'actions' as const,
        keywords: ['edit', 'bulk', 'selected', 'modify']
      },
      {
        id: 'delete-selected',
        name: `Delete ${selectedLeads.length} Selected Leads`,
        icon: TrashIcon,
        action: () => {
          if (confirm(`Delete ${selectedLeads.length} leads?`)) {
            // Handle delete
          }
          onClose();
        },
        category: 'actions' as const,
        keywords: ['delete', 'remove', 'selected']
      }
    ] : []),
    {
      id: 'export-leads',
      name: 'Export Leads',
      icon: DocumentArrowDownIcon,
      action: () => {
        onExport?.();
        onClose();
      },
      category: 'actions',
      keywords: ['export', 'download', 'csv', 'sheets']
    },
    
    // Filters
    {
      id: 'filter-clear',
      name: 'Clear All Filters',
      icon: FunnelIcon,
      action: () => {
        setSourceFilter({ instagram: true, adLibrary: true, googleMaps: true, csvImport: true });
        setCityFilter('all');
        setServiceTypeFilter('all');
        onClose();
      },
      category: 'filters',
      keywords: ['clear', 'reset', 'filters']
    },
    ...cities.map(city => ({
      id: `filter-city-${city}`,
      name: `Filter by City: ${city}`,
      icon: FunnelIcon,
      action: () => {
        setCityFilter(city);
        onClose();
      },
      category: 'filters' as const,
      keywords: ['filter', 'city', city.toLowerCase()]
    })),
    ...serviceTypes.map(type => ({
      id: `filter-type-${type}`,
      name: `Filter by Type: ${type}`,
      icon: FunnelIcon,
      action: () => {
        setServiceTypeFilter(type);
        onClose();
      },
      category: 'filters' as const,
      keywords: ['filter', 'type', 'service', type.toLowerCase()]
    })),
    
    // Sort
    {
      id: 'sort-company',
      name: 'Sort by Company Name',
      icon: ArrowsUpDownIcon,
      action: () => {
        setSortBy('company_name');
        onClose();
      },
      category: 'sort',
      keywords: ['sort', 'company', 'name']
    },
    {
      id: 'sort-date',
      name: 'Sort by Date Added',
      icon: ArrowsUpDownIcon,
      action: () => {
        setSortBy('created_at');
        onClose();
      },
      category: 'sort',
      keywords: ['sort', 'date', 'recent', 'newest']
    },
    {
      id: 'sort-rating',
      name: 'Sort by Rating',
      icon: ArrowsUpDownIcon,
      action: () => {
        setSortBy('rating');
        setSortDirection('desc');
        onClose();
      },
      category: 'sort',
      keywords: ['sort', 'rating', 'stars']
    }
  ];

  // Search through leads
  const leadResults: CommandItem[] = leads
    .filter(lead => {
      const searchTerm = query.toLowerCase();
      return (
        lead.company_name?.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.phone?.includes(searchTerm) ||
        lead.handle?.toLowerCase().includes(searchTerm)
      );
    })
    .slice(0, 5)
    .map(lead => ({
      id: `lead-${lead.id}`,
      name: lead.company_name || 'Unnamed Lead',
      description: `${lead.email || lead.phone || 'No contact info'}`,
      icon: UserGroupIcon,
      action: () => {
        // Could open edit modal or navigate to lead detail
        onClose();
      },
      category: 'leads' as const
    }));

  // Filter commands based on query
  const filteredCommands = query === ''
    ? commands
    : commands.filter((command) => {
        const searchTerm = query.toLowerCase();
        return (
          command.name.toLowerCase().includes(searchTerm) ||
          command.keywords?.some(k => k.includes(searchTerm))
        );
      });

  const allResults = [...leadResults, ...filteredCommands];

  // Group results by category
  const groupedResults = allResults.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryLabels = {
    leads: 'Leads',
    navigation: 'Navigation',
    actions: 'Actions',
    filters: 'Filters',
    sort: 'Sort'
  };

  useEffect(() => {
    setQuery('');
  }, [isOpen]);

  return (
    <Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <Combobox onChange={(item: CommandItem) => item.action()}>
                <div className="relative">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search leads, actions, or type a command..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="absolute right-4 top-3.5 flex items-center gap-1 text-xs text-gray-400">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">K</kbd>
                  </div>
                </div>

                {allResults.length > 0 && (
                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 divide-y divide-gray-100 overflow-y-auto"
                  >
                    {Object.entries(groupedResults).map(([category, items]) => (
                      <li key={category}>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </div>
                        <ul className="text-sm text-gray-700">
                          {items.map((item) => (
                            <Combobox.Option
                              key={item.id}
                              value={item}
                              className={({ active }) =>
                                `flex cursor-default select-none items-center px-4 py-2 ${
                                  active ? 'bg-blue-600 text-white' : ''
                                }`
                              }
                            >
                              {({ active }) => (
                                <>
                                  {item.icon && (
                                    <item.icon
                                      className={`h-4 w-4 flex-none ${
                                        active ? 'text-white' : 'text-gray-400'
                                      }`}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="ml-3 flex-auto truncate">{item.name}</span>
                                  {item.description && (
                                    <span
                                      className={`ml-3 flex-none text-xs ${
                                        active ? 'text-blue-200' : 'text-gray-500'
                                      }`}
                                    >
                                      {item.description}
                                    </span>
                                  )}
                                </>
                              )}
                            </Combobox.Option>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </Combobox.Options>
                )}

                {query !== '' && allResults.length === 0 && (
                  <div className="px-6 py-14 text-center sm:px-14">
                    <CommandLineIcon
                      className="mx-auto h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                    <p className="mt-4 text-sm text-gray-900">
                      No results found for &quot;{query}&quot;
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}