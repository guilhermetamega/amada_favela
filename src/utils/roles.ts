export function translateRole(role: string) {
  const map: Record<string, string> = {
    user: "Usuário",
    admin: "Administrador",
    president: "Presidente",
    employee: "Funcionário",
  };

  return map[role?.toLowerCase()] || role;
}
