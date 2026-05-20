'use client';
import { Scan, Users, TrendingUp, Star } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

interface StatsBarProps {
  todayScans: number;
  activeCustomers: number;
  pointsIssuedToday: number;
  redemptionsThisWeek: number;
}

export default function StatsBar({
  todayScans,
  activeCustomers,
  pointsIssuedToday,
  redemptionsThisWeek,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Scans Today"
        value={todayScans}
        icon={<Scan size={20} />}
        accentColor="#0D9488"
      />
      <StatCard
        label="Active Customers"
        value={activeCustomers}
        icon={<Users size={20} />}
        accentColor="#7C3AED"
      />
      <StatCard
        label="Points Issued Today"
        value={pointsIssuedToday}
        icon={<TrendingUp size={20} />}
        accentColor="#F59E0B"
      />
      <StatCard
        label="Redeemed This Week"
        value={redemptionsThisWeek}
        icon={<Star size={20} />}
        accentColor="#5EEAD4"
      />
    </div>
  );
}
