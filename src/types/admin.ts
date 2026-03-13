export type UserRole = "user" | "employee" | "president" | "admin";

export type ManageableUser = {
  id: string;
  fullname: string;
  email: string;
  phone: string | null;
  address_1: string;
  address_2: string | null;
  comunity: string | null;
  role: UserRole;
  created_at: string;
};
