export type ServiceOrderStatus = "open" | "resolved";

export type ServiceOrderCategory = {
  id: string;
  slug: string;
  label: string;
  is_active: boolean;
  position: number;
  created_at: string;
};

export type ServiceOrder = {
  id: string;
  community: string;
  user_id: string;
  category_slug: string;
  category_label: string;
  custom_issue: string | null;
  normalized_issue_key: string;
  address_1: string;
  address_number: string | null;
  address_2: string | null;
  status: ServiceOrderStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
};

export type GroupedServiceOrder = {
  address_1: string;
  address_number: string | null;
  address_label: string;
  category_label: string;
  normalized_issue_key: string;
  display_issue: string;
  requests_count: number;
  last_created_at: string;
  items: ServiceOrder[];
};

export type CreateServiceOrderInput = {
  category_slug: string;
  custom_issue?: string;
};
