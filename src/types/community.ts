export type CommunityAddressItem = {
  value: string;
  label: string;
  type: "street" | "block";
};

export type CommunityData = {
  key: string;
  label: string;
  active: boolean;
  zipcodes: string[];
  addressItems: CommunityAddressItem[];
};
