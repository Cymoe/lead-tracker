'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompaniesPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to leads page
    router.push('/leads');
  }, [router]);
  
  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to leads...</p>
      </div>
    </div>
  );
}