import { useLeadStore } from '@/lib/store';
import { Bars3Icon, Bars2Icon } from '@heroicons/react/24/outline';

interface ViewDensityToggleProps {
  compact?: boolean;
}

export default function ViewDensityToggle({ compact = false }: ViewDensityToggleProps = {}) {
  const { viewDensity, setViewDensity } = useLeadStore();

  return (
    <div className={`flex items-center bg-white rounded border border-gray-200 transition-all duration-300 ${compact ? 'p-0' : 'p-0'}`}>
      <button
        onClick={() => setViewDensity('expanded')}
        className={`flex items-center rounded-l font-medium transition-all duration-300 ${
          compact
            ? `${viewDensity === 'expanded' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} p-1`
            : `${viewDensity === 'expanded' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} gap-1 px-1.5 py-0.5 text-xs`
        }`}
        title="Expanded View"
      >
        <Bars3Icon className={`transition-all duration-300 ${compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"}`} />
      </button>
      <button
        onClick={() => setViewDensity('compact')}
        className={`flex items-center rounded-r font-medium transition-all duration-300 ${
          compact
            ? `${viewDensity === 'compact' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} p-1`
            : `${viewDensity === 'compact' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'} gap-1 px-1.5 py-0.5 text-xs`
        }`}
        title="Compact View"
      >
        <Bars2Icon className={`transition-all duration-300 ${compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"}`} />
      </button>
    </div>
  );
}