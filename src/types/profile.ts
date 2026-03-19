import type { HomeRentItem } from "@/types/home_rent";
import type { LostAndFoundItem } from "@/types/lost_and_found";
import type { LostAnimalsItem } from "@/types/lost_animals";
import type { UserRole } from "@/lib/permissions";

export type ProfileUser = {
  id: string;
  fullname: string;
  cpf: string | null;
  birth: string | null;
  address_1: string | null;
  address_2: string | null;
  zipcode: string | null;
  comunity: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  picture_path: string | null;
  created_at: string | null;
};

export type UpdateProfileInput = {
  fullname: string;
  address_1: string;
  address_2: string;
  zipcode: string;
  phone: string;
};

export type PartnerHistoryItem = {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  status?: "active" | "expired" | "cancelled" | null;
};

export type MyListingsData = {
  lostAnimals: LostAnimalsItem[];
  lostAndFound: LostAndFoundItem[];
  homeRent: HomeRentItem[];
};

export type EditableListingType =
  | "lost_animals"
  | "lost_and_found"
  | "home_rent";

export type ProfileListingItem =
  | ({ listingType: "lost_animals" } & LostAnimalsItem)
  | ({ listingType: "lost_and_found" } & LostAndFoundItem)
  | ({ listingType: "home_rent" } & HomeRentItem);

export type UpdateLostAnimalInput = {
  name: string;
  description: string;
  type: "lost" | "found";
  phone: string;
};

export type UpdateLostAndFoundInput = {
  title: string;
  description: string;
  type: "lost" | "found";
  phone: string;
};

export type UpdateHomeRentInput = {
  title: string;
  description: string;
  type: "sell" | "rent";
  address: string;
  phone: string;
};
