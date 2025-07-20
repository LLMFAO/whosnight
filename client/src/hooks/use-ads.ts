import { useEffect, useState } from 'react';
import { adService } from '@/services/ad-service';
import { BannerAdPosition } from '@capacitor-community/admob';

export function useAds() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAds = async () => {
      try {
        setIsLoading(true);
        await adService.initialize();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize ads');
        console.error('Ad initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAds();
  }, []);

  const showBannerAd = async (position?: BannerAdPosition) => {
    if (!isInitialized) {
      console.warn('Ads not initialized yet');
      return;
    }

    try {
      setError(null);
      await adService.showBannerAd(position);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show banner ad';
      setError(errorMessage);
      console.error('Banner ad error:', err);
    }
  };

  const hideBannerAd = async () => {
    if (!isInitialized) {
      return;
    }

    try {
      setError(null);
      await adService.hideBannerAd();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to hide banner ad';
      setError(errorMessage);
      console.error('Hide banner ad error:', err);
    }
  };

  const showInterstitialAd = async () => {
    if (!isInitialized) {
      console.warn('Ads not initialized yet');
      return;
    }

    try {
      setError(null);
      await adService.showInterstitialAd();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show interstitial ad';
      setError(errorMessage);
      console.error('Interstitial ad error:', err);
    }
  };

  const showRewardedAd = async (): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('Ads not initialized yet');
      return false;
    }

    try {
      setError(null);
      return await adService.showRewardedAd();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to show rewarded ad';
      setError(errorMessage);
      console.error('Rewarded ad error:', err);
      return false;
    }
  };

  const removeBannerAd = async () => {
    if (!isInitialized) {
      return;
    }

    try {
      setError(null);
      await adService.removeBannerAd();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove banner ad';
      setError(errorMessage);
      console.error('Remove banner ad error:', err);
    }
  };

  return {
    isInitialized,
    isLoading,
    error,
    showBannerAd,
    hideBannerAd,
    showInterstitialAd,
    showRewardedAd,
    removeBannerAd,
  };
}