export type CommunityAddressItem = {
  value: string;
  label: string;
  address_number?: string;
  type: string;
};

export type CommunityData = {
  key: string;
  label: string;
  active: boolean;
  zipcodes: string[];
  addressItems: CommunityAddressItem[];
};
