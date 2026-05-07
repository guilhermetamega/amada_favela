export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type GarbageCollectionSchedule = {
  id: string;
  community: string;
  weekday: Weekday;
  pass_time: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type CreateGarbageCollectionScheduleInput = {
  weekday: Weekday;
  pass_time: string;
  notes?: string;
};

export type UpdateGarbageCollectionScheduleInput =
  CreateGarbageCollectionScheduleInput & {
    is_active: boolean;
  };

export type RegisterGarbagePushTokenInput = {
  fcm_token: string;
  platform?: "web" | "android" | "ios";
  user_agent?: string;
};

export type GarbagePushRegistrationState =
  | "unsupported"
  | "not_configured"
  | "default"
  | "denied"
  | "granted";
