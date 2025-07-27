

import { MARKET_CONSTANTS } from '@/config/market-constants';

export default function CountyLegend() {
  return (
    <div className="absolute bottom-14 right-4 z-[1000] bg-[#1F2937] p-3 rounded-lg shadow-lg border border-[#374151]">
      <h4 className="text-sm font-semibold mb-2 text-white">Opportunity Score</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span className="text-xs font-medium text-gray-300">Hot Market (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-xs font-medium text-gray-300">Warm Market (70-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-xs font-medium text-gray-300">Good Market (60-69)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span className="text-xs font-medium text-gray-300">Moderate (50-59)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-xs font-medium text-gray-300">Cool Market (40-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
          <span className="text-xs font-medium text-gray-300">No Data (&lt;40)</span>
        </div>
      </div>
    </div>
  );
}