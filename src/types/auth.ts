export type AuthMode = "login" | "register";

export type LoginFormData = {
  identifier: string;
  password: string;
};

export type RegisterFormData = {
  fullname: string;
  cpf: string;
  birth: string;
  address_1: string;
  address_2: string;
  zipcode: string;
  comunity: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};
