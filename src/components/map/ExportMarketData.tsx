import { useState } from 'react';
import { ArrowDownTrayIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { CountyMarketMetrics } from '@/services/county-data-aggregator';
import { MarketMetrics } from '@/types/market-data';
import { calculateSellerMotivation } from '@/utils/outreach-scripts';
import { MARKET_CONSTANTS } from '@/config/market-constants';
import { GREY_TSUNAMI_CATEGORIES } from '@/utils/grey-tsunami-business-types';

interface Props {
  countyData?: Map<string, CountyMarketMetrics>;
  metroData?: MarketMetrics[];
  viewMode: 'metro' | 'county';
}

// Get sector category for an industry
function getIndustrySector(industry: string): string {
  const category = GREY_TSUNAMI_CATEGORIES.find(cat =>
    cat.businesses.some(biz => biz.toLowerCase() === industry.toLowerCase())
  );
  
  if (category) {
    return `${category.category} (${category.tier})`;
  }
  
  // Fallback to generic categories
  if (industry.toLowerCase().includes('service')) return 'Services';
  if (industry.toLowerCase().includes('manufacturing')) return 'Manufacturing';
  if (industry.toLowerCase().includes('retail')) return 'Retail Trade';
  if (industry.toLowerCase().includes('construction')) return 'Construction';
  return 'General Business';
}

// Generate industry-specific outreach notes
function getIndustryOutreachNote(county: CountyMarketMetrics, motivation: { level: string; factors: string[] }): string {
  const topIndustry = county.industryFocus.topGreyTsunamiIndustries[0];
  
  if (!topIndustry) {
    return motivation.level === 'high' 
      ? 'Hot lead - High concentration of boomer-owned businesses'
      : 'General SMB outreach opportunity';
  }
  
  // Industry-specific recommendations
  const industryNotes: { [key: string]: { high: string; medium: string; low: string } } = {
    'HVAC Services': {
      high: 'Priority: HVAC owners nearing retirement. Emphasize operational continuity & service contracts',
      medium: 'Target established HVAC firms. Discuss growth potential through consolidation',
      low: 'Long-term opportunity for HVAC roll-up strategy'
    },
    'Plumbing Services': {
      high: 'Urgent: Plumbing businesses with aging owners. Highlight apprentice retention',
      medium: 'Plumbing consolidation opportunity. Focus on recurring revenue streams',
      low: 'Build relationships with plumbing contractors for future opportunities'
    },
    'Auto Repair': {
      high: 'Time-sensitive: Auto shops facing EV transition. Offer tech upgrade support',
      medium: 'Auto repair consolidation play. Emphasize fleet management contracts',
      low: 'Monitor auto repair sector for distressed opportunities'
    },
    'Landscaping': {
      high: 'Seasonal timing critical. Target landscapers planning winter exit',
      medium: 'Landscaping roll-up potential. Focus on commercial contracts',
      low: 'Develop relationships during off-season'
    },
    'Manufacturing': {
      high: 'Manufacturing succession urgency. Emphasize workforce retention plans',
      medium: 'Small manufacturers seeking growth capital or exit',
      low: 'Industrial consolidation opportunities in planning phase'
    },
    'Construction': {
      high: 'Construction owners with backlog seeking exit. Quick close capability key',
      medium: 'Specialty contractors open to partnership discussions',
      low: 'Track construction firms for market cycle opportunities'
    },
    'Food Service': {
      high: 'Restaurant owners burnt out post-COVID. Offer management transition',
      medium: 'Food service consolidation with proven concepts',
      low: 'Monitor QSR franchisees for portfolio deals'
    }
  };
  
  // Find matching industry notes
  for (const [industry, notes] of Object.entries(industryNotes)) {
    if (topIndustry.toLowerCase().includes(industry.toLowerCase())) {
      return notes[motivation.level as keyof typeof notes] || notes.medium;
    }
  }
  
  // Default notes by motivation level
  if (motivation.level === 'high') {
    return `Hot lead in ${topIndustry} - ${motivation.factors[0]}`;
  } else if (motivation.level === 'medium') {
    return `${topIndustry} consolidation opportunity - worth nurturing`;
  } else {
    return `Long-term ${topIndustry} acquisition pipeline`;
  }
}

export default function ExportMarketData({ countyData, metroData, viewMode }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      let csv = '';
      let data: any[] = [];

      if (viewMode === 'county' && countyData) {
        // County export headers
        csv = 'FIPS Code,County Name,State,Market Type,Opportunity Score,Population,Total Businesses,Est. Boomer Owned,Avg Business Size,Median Age,Median Income,Annual Payroll,Business Density (per 1K pop)\n';
        
        // Convert county data
        data = Array.from(countyData.values()).map(county => [
          county.fipsCode,
          `"${county.countyName}"`,
          county.stateAbbr,
          county.marketClassification,
          county.opportunityScore,
          county.demographics.population,
          county.businessMetrics.totalBusinesses,
          county.businessMetrics.boomerOwnedEstimate,
          county.businessMetrics.avgBusinessSize,
          county.demographics.medianAge,
          county.demographics.medianIncome,
          county.businessMetrics.annualPayroll,
          ((county.businessMetrics.totalBusinesses / county.demographics.population) * 1000).toFixed(2)
        ]);
      } else if (viewMode === 'metro' && metroData) {
        // Metro export headers
        csv = 'City,State,Opportunity Score,Boomer Business Owners,Avg Owner Age,Retirement Risk Score,Avg Multiple,Median Revenue,Yearly Transactions,Competition Level,Population Growth,Business Growth,GDP Growth\n';
        
        // Convert metro data
        data = metroData.map(metro => [
          `"${metro.city}"`,
          metro.stateCode,
          metro.opportunityScore,
          metro.demographics.boomerBusinessOwners,
          metro.demographics.avgOwnerAge,
          metro.demographics.retirementRiskScore,
          `"${metro.market.avgMultiple}"`,
          `"${metro.market.medianRevenue}"`,
          metro.market.yearlyTransactions,
          metro.market.competitionLevel,
          `"${metro.growth.populationGrowth}"`,
          `"${metro.growth.businessGrowth}"`,
          `"${metro.growth.gdpGrowth}"`
        ]);
      }

      // Add data rows
      data.forEach(row => {
        csv += row.join(',') + '\n';
      });

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${viewMode}-market-analysis-${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    
    try {
      let jsonData: any = {
        exportDate: new Date().toISOString(),
        viewMode: viewMode,
        dataSource: {
          census: 'US Census Bureau (CBP, ACS)',
          economic: 'FRED, BLS',
          lastUpdated: new Date().toISOString()
        },
        data: []
      };

      if (viewMode === 'county' && countyData) {
        jsonData.data = Array.from(countyData.values()).map(county => ({
          ...county,
          calculatedMetrics: {
            businessDensityPer1000: ((county.businessMetrics.totalBusinesses / county.demographics.population) * 1000).toFixed(2),
            estimatedBoomerPercentage: ((county.businessMetrics.boomerOwnedEstimate / county.businessMetrics.totalBusinesses) * 100).toFixed(1)
          }
        }));
      } else if (viewMode === 'metro' && metroData) {
        jsonData.data = metroData;
      }

      // Create blob and download
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${viewMode}-market-analysis-${timestamp}.json`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportContactListStarter = () => {
    setIsExporting(true);
    
    try {
      if (viewMode === 'county' && countyData) {
        // Create enhanced CSV for outreach
        let csv = 'County,State,Opportunity Score,Boomer Businesses (Est.),Top Sector,Top Industries,Seller Motivation,Confidence,Population,Business Density,Outreach Strategy\n';
        
        const sortedCounties = Array.from(countyData.values())
          .sort((a, b) => b.opportunityScore - a.opportunityScore);
        
        // Track top 5 counties for summary
        const top5Counties = sortedCounties.slice(0, 5);
        
        sortedCounties.forEach(county => {
          const motivation = calculateSellerMotivation(county);
          const businessDensity = ((county.businessMetrics.totalBusinesses / county.demographics.population) * 1000).toFixed(2);
          const topIndustries = county.industryFocus.topGreyTsunamiIndustries.slice(0, 3).join('; ');
          const topSector = county.industryFocus.topGreyTsunamiIndustries[0] 
            ? getIndustrySector(county.industryFocus.topGreyTsunamiIndustries[0])
            : 'General Business';
          const outreachStrategy = getIndustryOutreachNote(county, motivation);
          
          csv += [
            `"${county.countyName}"`,
            county.stateAbbr,
            county.opportunityScore,
            county.businessMetrics.boomerOwnedEstimate,
            `"${topSector}"`,
            `"${topIndustries}"`,
            motivation.level.toUpperCase(),
            county.boomerLikelihood?.confidence || 'medium',
            county.demographics.population.toLocaleString(),
            businessDensity,
            `"${outreachStrategy}"`
          ].join(',') + '\n';
        });
        
        // Add data freshness and top 5 summary
        const currentDate = new Date();
        const dataDate = new Date(MARKET_CONSTANTS.boomerOwnership.lastUpdated);
        
        csv += '\n\n=== TOP 5 OPPORTUNITY COUNTIES ===\n';
        csv += 'Rank,County,State,Score,Est. Boomer Businesses,Top Sector,Primary Industry\n';
        top5Counties.forEach((county, idx) => {
          const topSector = county.industryFocus.topGreyTsunamiIndustries[0] 
            ? getIndustrySector(county.industryFocus.topGreyTsunamiIndustries[0])
            : 'General Business';
          csv += `${idx + 1},${county.countyName},${county.stateAbbr},${county.opportunityScore},${county.businessMetrics.boomerOwnedEstimate.toLocaleString()},"${topSector}","${county.industryFocus.topGreyTsunamiIndustries[0]}"\n`;
        });
        
        csv += '\n\n=== SUMMARY STATISTICS ===\n';
        csv += `Total Counties Analyzed,${sortedCounties.length}\n`;
        csv += `High Motivation Counties,${sortedCounties.filter(c => calculateSellerMotivation(c).level === 'high').length}\n`;
        csv += `Medium Motivation Counties,${sortedCounties.filter(c => calculateSellerMotivation(c).level === 'medium').length}\n`;
        csv += `Total Est. Boomer Businesses,${sortedCounties.reduce((sum, c) => sum + c.businessMetrics.boomerOwnedEstimate, 0).toLocaleString()}\n`;
        csv += `Average Opportunity Score,${(sortedCounties.reduce((sum, c) => sum + c.opportunityScore, 0) / sortedCounties.length).toFixed(1)}\n`;
        
        csv += `\n=== DATA SOURCES & FRESHNESS ===\n`;
        csv += `Census ABS Data,Updated ${dataDate.toLocaleDateString()} (${Math.floor((currentDate.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24))} days ago)\n`;
        csv += `Boomer Ownership Baseline,${(MARKET_CONSTANTS.boomerOwnership.national * 100).toFixed(0)}% (National Average)\n`;
        csv += `Regional Adjustments,"Midwest: ${(MARKET_CONSTANTS.boomerOwnership.regional.midwest * 100).toFixed(0)}%, South: ${(MARKET_CONSTANTS.boomerOwnership.regional.south * 100).toFixed(0)}%, Northeast: ${(MARKET_CONSTANTS.boomerOwnership.regional.northeast * 100).toFixed(0)}%, West: ${(MARKET_CONSTANTS.boomerOwnership.regional.west * 100).toFixed(0)}%"\n`;
        csv += `County Business Patterns,2022 (Latest Available)\n`;
        csv += `American Community Survey,2022 5-Year Estimates\n`;
        
        csv += `\n=== OUTREACH BEST PRACTICES ===\n`;
        csv += `1. HIGH Motivation Counties: Immediate outreach with retirement/succession focus\n`;
        csv += `2. Industry Alignment: Match your expertise to county's top industries\n`;
        csv += `3. Tertiary Markets: Less competition, more relationship-driven sales\n`;
        csv += `4. Timing: Q4/Q1 optimal for retirement planning discussions\n`;
        csv += `5. Multi-Channel: Combine direct mail, LinkedIn, and industry associations\n`;
        
        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `contact-list-starter-${timestamp}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export contact list. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getDataCount = () => {
    if (viewMode === 'county' && countyData) {
      return countyData.size;
    } else if (viewMode === 'metro' && metroData) {
      return metroData.length;
    }
    return 0;
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-400">
        Export {getDataCount()} {viewMode === 'county' ? 'counties' : 'metros'}:
      </span>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={exportToCSV}
          disabled={isExporting || getDataCount() === 0}
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
            isExporting || getDataCount() === 0
              ? 'bg-[#374151] text-gray-600 cursor-not-allowed'
              : 'bg-[#374151] text-white hover:bg-[#4B5563] border border-[#4B5563]'
          }`}
          title="Export as CSV for Excel"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          CSV
        </button>
        
        <button
          onClick={exportToJSON}
          disabled={isExporting || getDataCount() === 0}
          className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
            isExporting || getDataCount() === 0
              ? 'bg-[#374151] text-gray-600 cursor-not-allowed'
              : 'bg-[#374151] text-white hover:bg-[#4B5563] border border-[#4B5563]'
          }`}
          title="Export as JSON for developers"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          JSON
        </button>
        
        {viewMode === 'county' && (
          <button
            onClick={exportContactListStarter}
            disabled={isExporting || getDataCount() === 0}
            className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-md transition-colors ${
              isExporting || getDataCount() === 0
                ? 'bg-[#374151] text-gray-600 cursor-not-allowed'
                : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
            }`}
            title="Export contact list for outreach"
            aria-label="Export Contact List Starter for county-level acquisition targets with industry-specific outreach strategies"
          >
            <PhoneIcon className="h-4 w-4" />
            Contact List
          </button>
        )}
      </div>
    </div>
  );
}