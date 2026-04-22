import { supabase } from "@/services/supabase/client";
import type { CommunityAddressItem, CommunityData } from "@/types/community";

const DEFAULT_COMMUNITIES: CommunityData[] = [
  {
    key: "andarai",
    label: "Andaraí",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "arara",
    label: "Arara",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "barreira",
    label: "Barreira do Vasco",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "cdd",
    label: "Cidade de Deus",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "ceuazul",
    label: "Céu Azul",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "cpx",
    label: "Complexo do Alemão",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "formiga",
    label: "Morro da Formiga",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "jacare",
    label: "Jacarezinho",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "lins",
    label: "Lins",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "macaco",
    label: "Morro do Macaco",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "mandela2",
    label: "Mandela 2",
    active: true,
    zipcodes: ["20911-300"],
    addressItems: [
      { value: "q-1", label: "Quadra 1", type: "block" },
      { value: "q-2", label: "Quadra 2", type: "block" },
      { value: "q-3", label: "Quadra 3", type: "block" },
      { value: "q-4", label: "Quadra 4", type: "block" },
      { value: "q-5", label: "Quadra 5", type: "block" },
      { value: "q-6", label: "Quadra 6", type: "block" },
      { value: "q-7", label: "Quadra 7", type: "block" },
      { value: "q-8", label: "Quadra 8", type: "block" },
      { value: "q-9", label: "Quadra 9", type: "block" },
      { value: "q-10", label: "Quadra 10", type: "block" },
      { value: "q-11", label: "Quadra 11", type: "block" },
      { value: "q-12", label: "Quadra 12", type: "block" },
      { value: "q-13", label: "Quadra 13", type: "block" },
      { value: "q-14", label: "Quadra 14", type: "block" },
      { value: "q-15", label: "Quadra 15", type: "block" },
      { value: "q-16", label: "Quadra 16", type: "block" },
      { value: "q-17", label: "Quadra 17", type: "block" },
      { value: "q-18", label: "Quadra 18", type: "block" },
      { value: "q-19", label: "Quadra 19", type: "block" },
      { value: "q-20", label: "Quadra 20", type: "block" },
      { value: "q-21", label: "Quadra 21", type: "block" },
      { value: "q-22", label: "Quadra 22", type: "block" },
      { value: "q-23", label: "Quadra 23", type: "block" },
      { value: "q-24", label: "Quadra 24", type: "block" },
      { value: "q-25", label: "Quadra 25", type: "block" },
      { value: "q-26", label: "Quadra 26", type: "block" },
      { value: "q-27", label: "Quadra 27", type: "block" },
      { value: "q-28", label: "Quadra 28", type: "block" },
      { value: "q-29", label: "Quadra 29", type: "block" },
      { value: "q-30", label: "Quadra 30", type: "block" },
      { value: "q-31", label: "Quadra 31", type: "block" },
      { value: "q-32", label: "Quadra 32", type: "block" },
      { value: "q-33", label: "Quadra 33", type: "block" },
      { value: "q-34", label: "Quadra 34", type: "block" },
      { value: "q-35", label: "Quadra 35", type: "block" },
      { value: "q-36", label: "Quadra 36", type: "block" },
      { value: "q-37", label: "Quadra 37", type: "block" },
      { value: "q-38", label: "Quadra 38", type: "block" },
      { value: "q-39", label: "Quadra 39", type: "block" },
      { value: "q-40", label: "Quadra 40", type: "block" },
      { value: "tv-1", label: "Terreninho - Vila 1", type: "village" },
      { value: "tv-2", label: "Terreninho - Vila 2", type: "village" },
      { value: "tv-3", label: "Terreninho - Vila 3", type: "village" },
      { value: "tv-4", label: "Terreninho - Vila 4", type: "village" },
      { value: "tv-5", label: "Terreninho - Vila 5", type: "village" },
      { value: "tr-1", label: "Terreninho - Rua 1", type: "street" },
      { value: "tr-2", label: "Terreninho - Rua 2", type: "street" },
      { value: "tr-3", label: "Terreninho - Rua 3", type: "street" },
      { value: "tr-4", label: "Terreninho - Rua 4", type: "street" },
      { value: "tr-5", label: "Terreninho - Rua 5", type: "street" },
      { value: "tr-6", label: "Terreninho - Rua 6", type: "street" },
      { value: "tr-7", label: "Terreninho - Rua 7", type: "street" },
      { value: "tr-8", label: "Terreninho - Rua 8", type: "street" },
      { value: "tr-9", label: "Terreninho - Rua 9", type: "street" },
      { value: "tl-1", label: "Terreninho - Travessa 1", type: "lane" },
      { value: "tl-2", label: "Terreninho - Travessa 2", type: "lane" },
      { value: "tl-3", label: "Terreninho - Travessa 3", type: "lane" },
      { value: "tl-4", label: "Terreninho - Travessa 4", type: "lane" },
      { value: "tl-5", label: "Terreninho - Travessa 5", type: "lane" },
      { value: "tl-6", label: "Terreninho - Travessa 6", type: "lane" },
      { value: "tl-7", label: "Terreninho - Travessa 7", type: "lane" },
      { value: "tl-8", label: "Terreninho - Travessa 8", type: "lane" },
    ],
  },
  {
    key: "mangueira",
    label: "Mangueira",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "manguinhos",
    label: "Manguinhos",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "ppg",
    label: "PPG",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "pdm",
    label: "Parque das Missões",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "rocinha",
    label: "Rocinha",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "saojoao",
    label: "São João",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "sc",
    label: "São Carlos",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "tuiuti",
    label: "Tuiuti",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "urubu",
    label: "Urubu",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "viladojoao",
    label: "Vila do João",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "pinheiro",
    label: "Pinheiro",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "timbau",
    label: "Morro do Timbau",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "salsa",
    label: "Salsa e Merengue",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "esperanca",
    label: "Conjunto Esperança",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "baixa",
    label: "Baixa do Sapateiro",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "uniao",
    label: "Parque União",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "holanda",
    label: "Nova Holanda",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "boca",
    label: "Boca do Mato",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "barao",
    label: "Barão",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "vidigal",
    label: "Vidigal",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
  {
    key: "uruguaiana",
    label: "Uruguaiana",
    active: false,
    zipcodes: [],
    addressItems: [],
  },
];

type CommunityRow = {
  key: string;
  label: string;
  active: boolean;
  zipcodes: string[] | null;
  address_items:
    | Array<
        Partial<CommunityAddressItem> & {
          value: string;
          label: string;
          type?: string | null;
          address_number?: string | number | null;
        }
      >
    | null;
};

function parseAddressNumberFromItem(input: { value: string; label: string }) {
  const fromValue = input.value.match(/(\d+)\s*$/)?.[1];
  if (fromValue) return fromValue;

  const fromLabel = input.label.match(/(\d+)\s*$/)?.[1];
  if (fromLabel) return fromLabel;

  return "";
}

function normalizeAddressLabel(input: { label: string; addressNumber: string }) {
  if (!input.addressNumber) return input.label.trim();

  const suffixPattern = new RegExp(`\\s*[-]?\\s*${input.addressNumber}\\s*$`);
  return input.label.replace(suffixPattern, "").trim();
}

function normalizeAddressItem(
  item: Partial<CommunityAddressItem> & {
    value: string;
    label: string;
    type?: string | null;
    address_number?: string | number | null;
  },
): CommunityAddressItem {
  const rawAddressNumber =
    typeof item.address_number === "number"
      ? String(item.address_number)
      : (item.address_number ?? "").toString().trim();
  const addressNumber = rawAddressNumber || parseAddressNumberFromItem(item);

  return {
    value: item.value,
    label: normalizeAddressLabel({ label: item.label, addressNumber }),
    address_number: addressNumber,
    type: (item.type ?? "others").toString(),
  };
}

function normalizeCommunityData(input: CommunityData): CommunityData {
  return {
    ...input,
    addressItems: input.addressItems.map((item) => normalizeAddressItem(item)),
  };
}

export let COMMUNITIES: CommunityData[] =
  DEFAULT_COMMUNITIES.map(normalizeCommunityData);

function mapRowToCommunity(row: CommunityRow): CommunityData {
  return {
    key: row.key,
    label: row.label,
    active: Boolean(row.active),
    zipcodes: Array.isArray(row.zipcodes) ? row.zipcodes : [],
    addressItems: Array.isArray(row.address_items)
      ? row.address_items.map((item) => normalizeAddressItem(item))
      : [],
  };
}

export async function loadCommunitiesFromSupabase() {
  const { data, error } = await supabase
    .from("communities")
    .select("key, label, active, zipcodes, address_items")
    .order("label", { ascending: true });

  if (error) {
    console.error("Erro ao carregar communities do Supabase:", error);
    return;
  }

  if (!data?.length) {
    COMMUNITIES = DEFAULT_COMMUNITIES.map(normalizeCommunityData);
    return;
  }

  COMMUNITIES = data.map((row) => mapRowToCommunity(row as CommunityRow));
}

export function getDefaultCommunities(): CommunityData[] {
  return DEFAULT_COMMUNITIES.map(normalizeCommunityData);
}
