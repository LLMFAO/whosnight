import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, RewardAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export class AdService {
  private static instance: AdService;
  private isInitialized = false;

  // Test Ad Unit IDs (replace with real ones in production)
  private readonly adUnitIds = {
    banner: 'ca-app-pub-3940256099942544/2934735716', // Test banner ad unit ID
    interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test interstitial ad unit ID
    rewarded: 'ca-app-pub-3940256099942544/1712485313', // Test rewarded ad unit ID
  };

  private constructor() {}

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized || !Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.initialize({
        testingDevices: ['YOUR_TESTING_DEVICE_ID'], // Add your testing device ID
        initializeForTesting: true, // Set to false in production
      });
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      throw error;
    }
  }

  public async showBannerAd(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Banner ad would show here (web environment)');
      return;
    }

    try {
      const options: BannerAdOptions = {
        adId: this.adUnitIds.banner,
        adSize: BannerAdSize.BANNER,
        position: position,
        margin: 0,
        isTesting: true, // Set to false in production
      };

      await AdMob.showBanner(options);
      console.log('Banner ad shown successfully');
    } catch (error) {
      console.error('Failed to show banner ad:', error);
      throw error;
    }
  }

  public async hideBannerAd(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.hideBanner();
      console.log('Banner ad hidden successfully');
    } catch (error) {
      console.error('Failed to hide banner ad:', error);
      throw error;
    }
  }

  public async showInterstitialAd(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Interstitial ad would show here (web environment)');
      return;
    }

    try {
      const options = {
        adId: this.adUnitIds.interstitial,
        isTesting: true, // Set to false in production
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      console.log('Interstitial ad shown successfully');
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      throw error;
    }
  }

  public async showRewardedAd(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Rewarded ad would show here (web environment)');
      return true; // Simulate reward in web environment
    }

    try {
      const options: RewardAdOptions = {
        adId: this.adUnitIds.rewarded,
        isTesting: true, // Set to false in production
      };

      await AdMob.prepareRewardVideoAd(options);
      const result = await AdMob.showRewardVideoAd();
      
      if (result && result.type) {
        console.log('User earned reward:', result);
        return true;
      } else {
        console.log('User did not complete rewarded ad');
        return false;
      }
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      throw error;
    }
  }

  public async resumeBannerAd(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.resumeBanner();
      console.log('Banner ad resumed successfully');
    } catch (error) {
      console.error('Failed to resume banner ad:', error);
    }
  }

  public async removeBannerAd(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await AdMob.removeBanner();
      console.log('Banner ad removed successfully');
    } catch (error) {
      console.error('Failed to remove banner ad:', error);
    }
  }
}

export const adService = AdService.getInstance();