export type AssociationFormData = {
  id: string;
  name: string;
  cnpj: string;
  community: string;
  headquarters_address: string;
  headquarters_number: string;
  headquarters_complement: string;
  headquarters_neighborhood: string;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
  phone: string;
  logo_path: string;
  logo_url: string | null;
  signature_path: string;
  signature_url: string | null;
  president_name: string;
  president_role: string;
  is_active: boolean;
};

export type AssociationRow = {
  id: string;
  name: string;
  cnpj: string;
  community: string;
  headquarters_address: string;
  headquarters_number: string | null;
  headquarters_complement: string | null;
  headquarters_neighborhood: string | null;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
  phone: string | null;
  logo_path: string | null;
  signature_path: string | null;
  president_name: string;
  president_role: string | null;
  is_active: boolean;
};

export type AssociationUpdateInput = {
  id: string;
  name: string;
  cnpj: string;
  headquarters_address: string;
  headquarters_number: string;
  headquarters_complement: string;
  headquarters_neighborhood: string;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_zipcode: string;
  phone: string;
  logo_path: string;
  signature_path: string;
  president_name: string;
  president_role: string;
  is_active: boolean;
};
export type CurrentAssociationAccess = {
  allowed: boolean;
  reason: string | null;
  role: string | null;
  community: string | null;
};

export type CurrentProfileAssociationRow = {
  id: string;
  role: string | null;
  comunity: string | null;
};
