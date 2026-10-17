export type AdType = 'rewarded' | 'interstitial' | 'banner';
export type RewardType = 'coins' | 'extraLife' | 'doublePoints' | 'unlockItem' | 'skipLevel';
export interface AdReward { type: RewardType; amount: number; description: string }
export const AD_PLACEMENTS = {
  AFTER_RACE: 'after_race', SHOP_BONUS: 'shop_bonus', DAILY_BONUS: 'daily_bonus',
  HINT_UNLOCK: 'hint_unlock', EXTRA_COINS: 'extra_coins', CONTINUE_RACE: 'continue_race',
  EXTRA_FUEL: 'extra_fuel',
} as const;
export type AdPlacement = typeof AD_PLACEMENTS[keyof typeof AD_PLACEMENTS];
export const canShowAd = (_placement: AdPlacement) => false;
export const getAdReward = (_placement: AdPlacement): AdReward =>
  ({ type: 'coins', amount: 0, description: 'Video rewards are unavailable in the browser.' });
export const getRemainingAdsToday = () => 0;
export const getAdCooldownRemaining = () => 0;
export const formatAdCooldown = () => 'Unavailable in browser';
export const isAdMobAvailable = () => false;
export async function initializeAds(): Promise<void> {}
export async function showRewardedAd(_placement: AdPlacement): Promise<AdReward | null> { return null; }
export async function loadAd(_type: AdType = 'rewarded'): Promise<boolean> { return false; }
export function cleanupAds(): void {}
export function useRewardedAd(placement: AdPlacement) {
  return { reward: getAdReward(placement), canShow: false, remaining: 0,
    showAd: () => showRewardedAd(placement), isLoading: false };
}
export async function showBannerAd(_position: 'top' | 'bottom' = 'bottom'): Promise<boolean> { return false; }
export async function hideBannerAd(): Promise<void> {}
export async function removeBannerAd(): Promise<void> {}
export function BannerAdPlaceholder(_props: { position?: 'top' | 'bottom' }) { return null; }
