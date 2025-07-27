import { useState } from 'react';
import { MarketFilter } from '@/types/market-data';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Props {
  filter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
}

export default function MarketFilters({ filter, onFilterChange }: Props) {
  const handleCompetitionChange = (level: 'Low' | 'Medium' | 'High') => {
    const current = filter.competitionLevel || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    
    onFilterChange({
      ...filter,
      competitionLevel: updated.length > 0 ? updated : undefined
    });
  };
  
  const handleScoreChange = (score: number) => {
    onFilterChange({
      ...filter,
      minOpportunityScore: score
    });
  };
  
  return (
    <div className="space-y-4">
          {/* Opportunity Score Filter */}
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Minimum Opportunity Score
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={filter.minOpportunityScore || 0}
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right text-white">
                {filter.minOpportunityScore || 0}+
              </span>
            </div>
          </div>
          
          {/* Competition Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Competition Level
            </label>
            <div className="space-y-2">
              {(['Low', 'Medium', 'High'] as const).map(level => (
                <label key={level} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.competitionLevel?.includes(level) || false}
                    onChange={() => handleCompetitionChange(level)}
                    className="h-4 w-4 text-[#3B82F6] focus:ring-[#3B82F6] border-[#374151] rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">{level}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Revenue Range */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Target Revenue Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ($K)"
                value={filter.minRevenue ? filter.minRevenue / 1000 : ''}
                onChange={(e) => onFilterChange({
                  ...filter,
                  minRevenue: e.target.value ? Number(e.target.value) * 1000 : undefined
                })}
                className="px-3 py-2 border border-[#374151] rounded-md text-sm bg-[#111827] text-white placeholder-gray-500"
              />
              <input
                type="number"
                placeholder="Max ($K)"
                value={filter.maxRevenue ? filter.maxRevenue / 1000 : ''}
                onChange={(e) => onFilterChange({
                  ...filter,
                  maxRevenue: e.target.value ? Number(e.target.value) * 1000 : undefined
                })}
                className="px-3 py-2 border border-[#374151] rounded-md text-sm bg-[#111827] text-white placeholder-gray-500"
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          <button
            onClick={() => onFilterChange({})}
            className="w-full px-4 py-2 text-sm text-gray-300 bg-[#374151] rounded-md hover:bg-[#4B5563] transition-colors"
          >
            Clear All Filters
          </button>
    </div>
  );
}