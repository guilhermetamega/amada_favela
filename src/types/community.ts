export type CommunityAddressItem = {
  value: string;
  label: string;
  type: "street" | "block" | "village" | "lane" | "others";
};

export type CommunityData = {
  key: string;
  label: string;
  active: boolean;
  zipcodes: string[];
  addressItems: CommunityAddressItem[];
};
