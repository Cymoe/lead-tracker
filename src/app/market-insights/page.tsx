'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import LoadingScreen from '@/components/LoadingScreen';

const MarketInsightsContent = dynamicImport(
  () => import('./market-insights-content'),
  { 
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export default function MarketInsightsPage() {
  return <MarketInsightsContent />;
}