import { useEffect } from 'react';
import { useAds } from '@/hooks/use-ads';
import { BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

interface AdBannerProps {
  position?: BannerAdPosition;
  className?: string;
}

export function AdBanner({ position = BannerAdPosition.BOTTOM_CENTER, className }: AdBannerProps) {
  const { isInitialized, showBannerAd, removeBannerAd, error } = useAds();

  useEffect(() => {
    if (isInitialized) {
      showBannerAd(position);
    }

    // Cleanup: remove banner when component unmounts
    return () => {
      if (isInitialized) {
        removeBannerAd();
      }
    };
  }, [isInitialized, position, showBannerAd, removeBannerAd]);

  // For web environment, show a placeholder
  if (!Capacitor.isNativePlatform()) {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded p-4 text-center text-sm text-gray-600 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Advertisement</span>
        </div>
        <p className="mt-1 text-xs">Banner ad would appear here on mobile</p>
      </div>
    );
  }

  // On native platforms, the ad is rendered natively, so we don't need to return anything
  // unless there's an error
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded p-2 text-center text-xs text-red-600 ${className}`}>
        Ad Error: {error}
      </div>
    );
  }

  return null;
}