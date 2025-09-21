'use client';

import dynamic from 'next/dynamic';

// Dynamically import the home page with no SSR to prevent hydration issues
const HomePage = dynamic(() => import('@/components/HomePage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading WSTON Interface...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <HomePage />;
}