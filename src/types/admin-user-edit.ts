import type { UserRole } from "@/lib/permissions";

export type AdminUserEditMode = "basic" | "sensitive";

export type AdminVerificationMethod =
  | "document_with_photo"
  | "existing_registration_confirmation"
  | "in_person_confirmation";

export type AdminUserBasicEditData = {
  fullname: string;
  phone: string;
  address1: string;
  addressNumber: string;
  address2: string;
  zipcode: string;
};

export type AdminUserSensitiveEditData = {
  email: string;
  cpf?: string;
  birth: string;
  role: Exclude<UserRole, "admin">;
  community: string;
};

export type AdminUserUpdatePayload = {
  targetUserId: string;
  mode: AdminUserEditMode;

  data: AdminUserBasicEditData | AdminUserSensitiveEditData;

  verificationMethod: AdminVerificationMethod;

  reason: string;
};

export type AdminCommunityOption = {
  key: string;
  label: string;
};

export type AdminUserUpdateResponse = {
  success: boolean;
  message: string;

  updated: {
    id: string;
    fullname: string;
    role: UserRole;
    community: string;
    changed_fields: string[];
  };
};
