export type AssociationPlatformFeeItem = {
  id: string;
  name: string;
  community: string;
  monthly_fee: number | string | null;
  platform_fee_cents: number;
  is_active: boolean;
};
