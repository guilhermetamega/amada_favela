export type ServiceOrderCategory = {
  id: string;
  slug: string;
  label: string;
  position: number;
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
  address_2: string | null;
  status: "open" | "resolved";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
};

export type GroupedServiceOrder = {
  address_1: string;
  normalized_issue_key: string;
  category_label: string;
  display_issue: string;
  requests_count: number;
  last_created_at: string;
  items: ServiceOrder[];
};

export type CreateServiceOrderInput = {
  category_slug: string;
  custom_issue?: string;
};
