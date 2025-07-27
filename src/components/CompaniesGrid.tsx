'use client';

import { useState, useEffect } from 'react';
import { Lead } from '@/types';
import CompanyCard from '@/components/CompanyCard';

interface CompaniesGridProps {
  leads: Lead[];
}

interface CompanyData {
  name: string;
  leads: Lead[];
  runningAds: boolean;
  latestLead: Lead;
  totalLeads: number;
  sources: Set<string>;
}

export default function CompaniesGrid({ leads }: CompaniesGridProps) {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Group leads by company name
    const companyMap = new Map<string, Lead[]>();
    
    leads.forEach(lead => {
      const companyName = lead.company_name.toLowerCase();
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, []);
      }
      companyMap.get(companyName)!.push(lead);
    });

    // Create company data objects
    const companyDataArray: CompanyData[] = [];
    
    companyMap.forEach((companyLeads, companyName) => {
      const sources = new Set(companyLeads.map(lead => lead.lead_source || 'Unknown'));
      const runningAds = companyLeads.some(lead => lead.running_ads);
      const latestLead = companyLeads.reduce((latest, current) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      );

      companyDataArray.push({
        name: companyLeads[0].company_name, // Use original case
        leads: companyLeads,
        runningAds,
        latestLead,
        totalLeads: companyLeads.length,
        sources
      });
    });

    // Sort by most recent lead
    companyDataArray.sort((a, b) => 
      new Date(b.latestLead.created_at).getTime() - new Date(a.latestLead.created_at).getTime()
    );

    setCompanies(companyDataArray);
  }, [leads]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company, index) => (
            <CompanyCard key={`${company.name}-${index}`} company={company} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No companies found</p>
          </div>
        )}
      </div>
    </div>
  );
} 