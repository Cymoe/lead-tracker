import { useLeadStore } from '@/lib/store';
import { TableCellsIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';

interface ViewToggleProps {
  compact?: boolean;
}

export default function ViewToggle({ compact = false }: ViewToggleProps = {}) {
  const { viewMode, setViewMode } = useLeadStore();

  return (
    <div className={`flex items-center bg-white rounded border border-gray-200 transition-all duration-300 ${compact ? 'p-0' : 'p-0'}`}>
      <button
        onClick={() => setViewMode('table')}
        className={`flex items-center rounded-l font-medium transition-all duration-300 ${
          compact 
            ? `${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} p-1`
            : `${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} gap-1 px-1.5 py-0.5 text-xs`
        }`}
        title="Table View"
      >
        <TableCellsIcon className={`transition-all duration-300 ${compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"}`} />
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center rounded-r font-medium transition-all duration-300 ${
          compact 
            ? `${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} p-1`
            : `${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} gap-1 px-1.5 py-0.5 text-xs`
        }`}
        title="Grid View"
      >
        <RectangleGroupIcon className={`transition-all duration-300 ${compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"}`} />
      </button>
    </div>
  );
}