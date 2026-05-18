'use client';
import { QrCode, Users, TrendingUp, Star } from 'lucide-react';
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
      <StatCard label="Scans Today"          value={todayScans}           icon={<QrCode size={20} />} />
      <StatCard label="Active Customers"     value={activeCustomers}      icon={<Users size={20} />} />
      <StatCard label="Points Issued Today"  value={pointsIssuedToday}    icon={<TrendingUp size={20} />} />
      <StatCard label="Redeemed This Week"   value={redemptionsThisWeek}  icon={<Star size={20} />} />
    </div>
  );
}
