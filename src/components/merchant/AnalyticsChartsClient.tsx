'use client';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type AnalyticsCharts from './AnalyticsCharts';

const AnalyticsChartsLazy = dynamic(() => import('./AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card h-48 animate-pulse bg-gray-50" />
      ))}
    </div>
  ),
});

export default function AnalyticsChartsClient(props: ComponentProps<typeof AnalyticsCharts>) {
  return <AnalyticsChartsLazy {...props} />;
}
