export interface OnboardingCTA {
  labelKey: string;
  action: 'route' | 'emit' | 'openModal';
  to?: string;
  params?: Record<string, any>;
  eventName?: string;
  variant?: 'primary' | 'secondary';
  guarded?: boolean;
}

export interface OnboardingStep {
  id: number;
  titleKey: string;
  subtitleKey?: string;
  bodyKey?: string;
  bulletsKeys?: string[];
  ctas?: OnboardingCTA[];
  icon?: 'vision' | 'nostr' | 'mint' | 'deposit' | 'pay' | 'creator' | 'safety';
}
