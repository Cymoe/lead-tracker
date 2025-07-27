import { Lead } from '@/types';
import Link from 'next/link';
import { MapIcon } from '@heroicons/react/24/outline';

interface StatsGridProps {
  leads: Lead[];
}

export default function StatsGrid({ leads }: StatsGridProps) {
  const stats = {
    total: leads.length,
    instagram: leads.filter(l => l.lead_source === 'Instagram Manual').length,
    adLibrary: leads.filter(l => l.lead_source === 'FB Ad Library').length,
    withPhone: leads.filter(l => l.phone).length,
    hotLeads: leads.filter(l => l.score === 'A++').length,
    readyToCall: leads.filter(l => l.phone && !l.called).length,
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Market Analysis CTA - Prominent placement */}
      <Link href="/market-analysis" className="block">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-6 hover:from-red-100 hover:to-orange-100 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                🗺️ Market Analysis
                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">NEW</span>
              </h3>
              <p className="text-gray-600">
                Discover the hottest markets for SMB acquisition. Interactive map with 20+ cities analyzed.
              </p>
            </div>
            <div className="text-red-200 group-hover:text-red-300 transition-colors">
              <MapIcon className="h-20 w-20" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-gray-700">Hot Markets: 5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-gray-700">Warm Markets: 8</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Emerging: 7</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Regular Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Leads" value={stats.total} color="blue" />
        <StatCard label="Instagram Finds" value={stats.instagram} color="purple" />
        <StatCard label="FB Ad Library" value={stats.adLibrary} color="indigo" />
        <StatCard label="Phone Numbers" value={stats.withPhone} color="green" />
        <StatCard label="A++ Leads" value={stats.hotLeads} color="red" />
        <StatCard label="Ready to Call" value={stats.readyToCall} color="yellow" />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-90">{label}</div>
    </div>
  );
}