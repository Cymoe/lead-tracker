'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const AnalyticsContent = dynamicImport(
  () => import('./analytics-content'),
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}