import { Lead } from '@/types';

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <StatCard label="Total Leads" value={stats.total} color="blue" />
      <StatCard label="Instagram Finds" value={stats.instagram} color="purple" />
      <StatCard label="FB Ad Library" value={stats.adLibrary} color="indigo" />
      <StatCard label="Phone Numbers" value={stats.withPhone} color="green" />
      <StatCard label="A++ Leads" value={stats.hotLeads} color="red" />
      <StatCard label="Ready to Call" value={stats.readyToCall} color="yellow" />
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
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}