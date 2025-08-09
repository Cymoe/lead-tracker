import { CurrencyDollarIcon, CameraIcon } from '@heroicons/react/24/outline';
import { FaInstagram } from 'react-icons/fa';

export default function HighTicketLegend() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Top Priority</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600 dark:text-gray-400">Secondary</span>
        </div>
        <div className="flex items-center gap-1">
          <CurrencyDollarIcon className="h-3 w-3 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Project Value</span>
        </div>
        <div className="flex items-center gap-1">
          <CameraIcon className="h-3 w-3 text-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">High Visual Impact</span>
        </div>
        <div className="flex items-center gap-1">
          <FaInstagram className="h-3 w-3 text-pink-500" />
          <span className="text-gray-600 dark:text-gray-400">Instagram Worthy</span>
        </div>
      </div>
    </div>
  );
}