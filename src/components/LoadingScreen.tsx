import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
      
      {/* Animated background lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-8">
        {/* Logo area */}
        <div className="mb-12">
          <div className="inline-block">
            <div className="w-16 h-16 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="mb-8">
          <h2 className="text-white/90 text-sm font-light tracking-widest uppercase mb-2">
            Loading
          </h2>
          <p className="text-white/40 text-xs font-light">
            Preparing your workspace
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="h-px bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-white/40 to-white/20 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress percentage */}
          <div className="mt-4 text-white/30 text-xs font-mono">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}