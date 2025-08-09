import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EyeIcon, EyeSlashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ColumnGroup {
  name: string;
  columns: Array<{
    key: string;
    label: string;
  }>;
}

interface GroupedColumnDropdownProps {
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isCompact?: boolean;
}

const columnGroups: ColumnGroup[] = [
  {
    name: 'Basic Info',
    columns: [
      { key: 'company', label: 'Company' },
      { key: 'type', label: 'Service Type' },
      { key: 'city', label: 'City' },
    ]
  },
  {
    name: 'Contact',
    columns: [
      { key: 'handle', label: 'Handle' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'links', label: 'Links' },
    ]
  },
  {
    name: 'Lead Quality',
    columns: [
      { key: 'source', label: 'Source' },
      { key: 'rating', label: 'Rating' },
      { key: 'score', label: 'Score' },
      { key: 'ads', label: 'Running Ads' },
      { key: 'adPlatforms', label: 'Ad Platforms' },
    ]
  },
  {
    name: 'Other',
    columns: [
      { key: 'close', label: 'Export Status' },
      { key: 'actions', label: 'Actions' },
    ]
  },
];

const presets = [
  {
    name: 'Default',
    description: 'Standard lead view',
    columns: ['company', 'type', 'city', 'phone', 'email', 'links', 'source', 'ads', 'score', 'actions']
  },
  {
    name: 'Minimal',
    description: 'Just the essentials',
    columns: ['company', 'type', 'city', 'ads', 'actions']
  },
  {
    name: 'Contact Focus',
    description: 'Contact information',
    columns: ['company', 'handle', 'phone', 'email', 'links', 'actions']
  },
  {
    name: 'Everything',
    description: 'Show all columns',
    columns: Object.keys(columnGroups.flatMap(g => g.columns).reduce((acc, col) => ({ ...acc, [col.key]: true }), {}))
  }
];

export default function GroupedColumnDropdown({ visibleColumns, setVisibleColumns, isCompact = false }: GroupedColumnDropdownProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const applyPreset = (preset: typeof presets[0]) => {
    const newColumns = Object.keys(visibleColumns).reduce((acc, key) => {
      acc[key] = preset.columns.includes(key);
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleColumns(newColumns);
  };

  const toggleAllInGroup = (group: ColumnGroup, checked: boolean) => {
    const updates = group.columns.reduce((acc, col) => {
      acc[col.key] = checked;
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleColumns(prev => ({ ...prev, ...updates }));
  };

  const visibleCount = Object.values(visibleColumns).filter(v => v).length;
  const totalCount = Object.keys(visibleColumns).length;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className={`inline-flex items-center border border-gray-200 dark:border-gray-600 font-medium rounded text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none transition-all duration-300 ${
          isCompact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
        }`}>
          <EyeIcon className="h-3.5 w-3.5" />
          {!isCompact && (
            <>
              <span className="ml-1">Columns</span>
              <span className="ml-1 text-gray-400">({visibleCount}/{totalCount})</span>
            </>
          )}
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-[90] max-h-[80vh] overflow-hidden flex flex-col" style={{ zIndex: 90 }}>
          {/* Presets */}
          {(
            <div className="p-3 border-b border-gray-100 dark:border-gray-600">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Presets</div>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="text-left px-3 py-2 text-xs rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{preset.name}</div>
                    <div className="text-gray-500">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column Groups */}
          <div className="overflow-y-auto flex-1">
            {columnGroups.map((group) => {
              const isExpanded = expandedGroups[group.name] !== false; // Default to expanded
              // Only show columns that actually exist in visibleColumns
              const groupColumns = group.columns.filter(col => visibleColumns.hasOwnProperty(col.key));
              
              // Skip this group if it has no valid columns
              if (groupColumns.length === 0) return null;
              
              const checkedCount = groupColumns.filter(col => visibleColumns[col.key]).length;
              const isPartiallyChecked = checkedCount > 0 && checkedCount < groupColumns.length;
              const isFullyChecked = checkedCount === groupColumns.length;

              return (
                <div key={group.name} className="border-b border-gray-100 last:border-0">
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-50">
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="flex items-center gap-1 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-3 w-3 text-gray-500" />
                      )}
                      <span className="text-xs font-medium text-gray-700">{group.name}</span>
                      <span className="text-xs text-gray-400 ml-1">({checkedCount}/{groupColumns.length})</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={isFullyChecked}
                      ref={input => {
                        if (input) {
                          input.indeterminate = isPartiallyChecked;
                        }
                      }}
                      onChange={(e) => toggleAllInGroup(group, e.target.checked)}
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {isExpanded && (
                    <div className="pb-2">
                      {group.columns
                        .filter(col => visibleColumns.hasOwnProperty(col.key))
                        .map((column) => (
                        <Menu.Item key={column.key}>
                          {({ active }) => (
                            <button
                              onClick={() => toggleColumn(column.key)}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } group flex items-center justify-between px-6 py-1.5 text-xs w-full`}
                            >
                              <span className={visibleColumns[column.key] ? 'text-gray-900' : 'text-gray-500'}>
                                {column.label}
                              </span>
                              {visibleColumns[column.key] ? (
                                <EyeIcon className="h-3.5 w-3.5 text-gray-400" />
                              ) : (
                                <EyeSlashIcon className="h-3.5 w-3.5 text-gray-400" />
                              )}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}