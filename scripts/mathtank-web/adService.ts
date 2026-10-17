// Website display ads belong to the parent landing page, never this game runtime.
import { GAME_CONFIG } from './gameConfig';

type AdType = 'home' | 'battle' | 'universe';
type RewardResult = { success: boolean; reward: number };

export interface AdStatus {
  canShow: boolean;
  cooldownRemaining: number;
  adsRemaining: number;
  isLoading: boolean;
  maxAdsPerDay: number;
}

export const getAdCooldownRemaining = (): number => 0;
export const canShowAd = (_adType: AdType = 'battle'): boolean => false;
export const getRemainingAdsToday = (_adType: AdType = 'battle'): number => 0;
export const initializeAds = async (): Promise<boolean> => false;
export const showRewardedAdForFuel = async (): Promise<RewardResult> => ({ success: false, reward: 0 });
export const showRewardedAdForCoins = async (): Promise<RewardResult> => ({ success: false, reward: 0 });
export const showRewardedAdForHint = async (): Promise<RewardResult> => ({ success: false, reward: 0 });
export const showBannerAd = async (): Promise<boolean> => false;
export const hideBannerAd = async (): Promise<void> => {};

const unavailableStatus = (): AdStatus => ({
  canShow: false,
  cooldownRemaining: 0,
  adsRemaining: 0,
  isLoading: false,
  maxAdsPerDay: 0,
});

export const getHomeAdStatus = (): AdStatus => unavailableStatus();
export const getBattleAdStatus = (): AdStatus => unavailableStatus();
export const getUniverseAdStatus = (): AdStatus => unavailableStatus();
export const getAdStatus = (_adType: 'home' | 'battle' = 'battle'): AdStatus => unavailableStatus();
export const areAdsAvailable = (): boolean => false;
export const getAdConfig = () => ({
  coinsReward: 3,
  fuelReward: 1,
  maxAdsPerDay: GAME_CONFIG.fuel.maxAdsPerDay,
  cooldownMinutes: GAME_CONFIG.fuel.adCooldownMinutes,
});
