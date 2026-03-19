import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Camera,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  closeMyHomeRent,
  closeMyLostAndFound,
  closeMyLostAnimal,
  deleteMyAvatar,
  deleteMyHomeRent,
  deleteMyLostAndFound,
  deleteMyLostAnimal,
  getMyAvatarSignedUrl,
  getMyListings,
  getMyPartnerHistory,
  getMyProfile,
  updateMyHomeRent,
  updateMyLostAndFound,
  updateMyLostAnimal,
  updateMyPassword,
  updateMyProfile,
  uploadMyAvatar,
} from "@/services/supabase/user_profile";
import type {
  MyListingsData,
  PartnerHistoryItem,
  ProfileListingItem,
  ProfileUser,
  UpdateHomeRentInput,
  UpdateLostAndFoundInput,
  UpdateLostAnimalInput,
  UpdateProfileInput,
} from "@/types/profile";
import { COMMUNITIES } from "@/lib/communities";
import { translateRole } from "@/utils/roles";
import { formatCpf } from "@/utils/cpf";
import { formatCep } from "@/utils/zipcode";

type ProfileFormState = UpdateProfileInput;

type PasswordFormState = {
  password: string;
  confirmPassword: string;
};

type ListingTab = "lostAnimals" | "lostAndFound" | "homeRent";

type ListingEditState =
  | {
      listingType: "lost_animals";
      id: string;
      name: string;
      description: string;
      type: "lost" | "found";
      phone: string;
    }
  | {
      listingType: "lost_and_found";
      id: string;
      title: string;
      description: string;
      type: "lost" | "found";
      phone: string;
    }
  | {
      listingType: "home_rent";
      id: string;
      title: string;
      description: string;
      type: "sell" | "rent";
      address: string;
      phone: string;
    };

type ProfileCachePayload = {
  profile: ProfileUser;
  partnerHistory: PartnerHistoryItem[];
  listings: MyListingsData;
  timestamp: number;
};

const EMPTY_PROFILE_FORM: ProfileFormState = {
  fullname: "",
  address_1: "",
  address_2: "",
  zipcode: "",
  phone: "",
};

const EMPTY_PASSWORD_FORM: PasswordFormState = {
  password: "",
  confirmPassword: "",
};

const PROFILE_CACHE_KEY = "profile_page_cache_v1";
const PROFILE_CACHE_TTL = 1000 * 60 * 5;

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function calculateAge(birth: string | null) {
  if (!birth) return null;

  const birthDate = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getPartnerBadge(history: PartnerHistoryItem[]) {
  const latest = history[0];

  if (!latest) {
    return {
      label: "Sem parceria",
      className:
        "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
    };
  }

  const expiresAt = new Date(latest.expires_at);
  const isActive = latest.status
    ? latest.status === "active"
    : expiresAt >= new Date();

  if (isActive) {
    return {
      label: `Sócio ativo até ${formatDate(latest.expires_at)}`,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }

  return {
    label: `Sócio expirado em ${formatDate(latest.expires_at)}`,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  };
}

function mapListingToEditState(item: ProfileListingItem): ListingEditState {
  if (item.listingType === "lost_animals") {
    return {
      listingType: item.listingType,
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      phone: item.phone,
    };
  }

  if (item.listingType === "lost_and_found") {
    return {
      listingType: item.listingType,
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      phone: item.phone,
    };
  }

  return {
    listingType: item.listingType,
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    address: item.address,
    phone: item.phone,
  };
}

function updateListingCollection(
  listings: MyListingsData,
  updatedItem: ProfileListingItem,
): MyListingsData {
  if (updatedItem.listingType === "lost_animals") {
    return {
      ...listings,
      lostAnimals: listings.lostAnimals.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    };
  }

  if (updatedItem.listingType === "lost_and_found") {
    return {
      ...listings,
      lostAndFound: listings.lostAndFound.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    };
  }

  return {
    ...listings,
    homeRent: listings.homeRent.map((item) =>
      item.id === updatedItem.id ? updatedItem : item,
    ),
  };
}

function removeListingCollection(
  listings: MyListingsData,
  item: ProfileListingItem,
): MyListingsData {
  if (item.listingType === "lost_animals") {
    return {
      ...listings,
      lostAnimals: listings.lostAnimals.filter(
        (current) => current.id !== item.id,
      ),
    };
  }

  if (item.listingType === "lost_and_found") {
    return {
      ...listings,
      lostAndFound: listings.lostAndFound.filter(
        (current) => current.id !== item.id,
      ),
    };
  }

  return {
    ...listings,
    homeRent: listings.homeRent.filter((current) => current.id !== item.id),
  };
}

function profileInputClassName() {
  return "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500";
}

function sectionCardClassName() {
  return "rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-6";
}

function getProfileCache(): ProfileCachePayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProfileCachePayload;

    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > PROFILE_CACHE_TTL) {
      window.localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveProfileCache(payload: Omit<ProfileCachePayload, "timestamp">) {
  if (typeof window === "undefined") return;

  const cachePayload: ProfileCachePayload = {
    ...payload,
    timestamp: Date.now(),
  };

  window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cachePayload));
}

function clearProfileCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_CACHE_KEY);
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value || "Não informado"}
      </p>
    </div>
  );
}

function ListingEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
      Você ainda não criou nenhum item em{" "}
      <span className="font-semibold">{label}</span>.
    </div>
  );
}

function ListingEditModal({
  state,
  loading,
  errorMessage,
  onClose,
  onChange,
  onSubmit,
}: {
  state: ListingEditState | null;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onChange: (nextState: ListingEditState) => void;
  onSubmit: () => Promise<void>;
}) {
  if (!state) return null;

  const title =
    state.listingType === "lost_animals"
      ? "Editar animal perdido"
      : state.listingType === "lost_and_found"
        ? "Editar item de achados e perdidos"
        : "Editar anúncio de moradia";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Nesta versão, a edição pelo perfil altera os dados textuais e
              mantém as imagens atuais.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-zinc-200 p-2 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Fechar edição"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {state.listingType === "lost_animals" ? (
            <>
              <input
                type="text"
                value={state.name}
                onChange={(event) =>
                  onChange({ ...state, name: event.target.value })
                }
                className={profileInputClassName()}
                placeholder="Nome do animal"
              />
              <select
                value={state.type}
                onChange={(event) =>
                  onChange({
                    ...state,
                    type: event.target.value as UpdateLostAnimalInput["type"],
                  })
                }
                className={profileInputClassName()}
              >
                <option value="lost">Perdido</option>
                <option value="found">Encontrado</option>
              </select>
              <textarea
                value={state.description}
                onChange={(event) =>
                  onChange({ ...state, description: event.target.value })
                }
                className={`${profileInputClassName()} min-h-32 md:col-span-2`}
                placeholder="Descrição"
              />
              <input
                type="text"
                value={state.phone}
                onChange={(event) =>
                  onChange({ ...state, phone: formatPhone(event.target.value) })
                }
                className={`${profileInputClassName()} md:col-span-2`}
                placeholder="Telefone"
              />
            </>
          ) : null}

          {state.listingType === "lost_and_found" ? (
            <>
              <input
                type="text"
                value={state.title}
                onChange={(event) =>
                  onChange({ ...state, title: event.target.value })
                }
                className={profileInputClassName()}
                placeholder="Título"
              />
              <select
                value={state.type}
                onChange={(event) =>
                  onChange({
                    ...state,
                    type: event.target.value as UpdateLostAndFoundInput["type"],
                  })
                }
                className={profileInputClassName()}
              >
                <option value="lost">Perdido</option>
                <option value="found">Encontrado</option>
              </select>
              <textarea
                value={state.description}
                onChange={(event) =>
                  onChange({ ...state, description: event.target.value })
                }
                className={`${profileInputClassName()} min-h-32 md:col-span-2`}
                placeholder="Descrição"
              />
              <input
                type="text"
                value={state.phone}
                onChange={(event) =>
                  onChange({ ...state, phone: formatPhone(event.target.value) })
                }
                className={`${profileInputClassName()} md:col-span-2`}
                placeholder="Telefone"
              />
            </>
          ) : null}

          {state.listingType === "home_rent" ? (
            <>
              <input
                type="text"
                value={state.title}
                onChange={(event) =>
                  onChange({ ...state, title: event.target.value })
                }
                className={profileInputClassName()}
                placeholder="Título"
              />
              <select
                value={state.type}
                onChange={(event) =>
                  onChange({
                    ...state,
                    type: event.target.value as UpdateHomeRentInput["type"],
                  })
                }
                className={profileInputClassName()}
              >
                <option value="rent">Aluguel</option>
                <option value="sell">Compra</option>
              </select>
              <input
                type="text"
                value={state.address}
                onChange={(event) =>
                  onChange({ ...state, address: event.target.value })
                }
                className={`${profileInputClassName()} md:col-span-2`}
                placeholder="Endereço"
              />
              <textarea
                value={state.description}
                onChange={(event) =>
                  onChange({ ...state, description: event.target.value })
                }
                className={`${profileInputClassName()} min-h-32 md:col-span-2`}
                placeholder="Descrição"
              />
              <input
                type="text"
                value={state.phone}
                onChange={(event) =>
                  onChange({ ...state, phone: formatPhone(event.target.value) })
                }
                className={`${profileInputClassName()} md:col-span-2`}
                placeholder="Telefone"
              />
            </>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [partnerHistory, setPartnerHistory] = useState<PartnerHistoryItem[]>(
    [],
  );
  const [listings, setListings] = useState<MyListingsData>({
    lostAnimals: [],
    lostAndFound: [],
    homeRent: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] =
    useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(EMPTY_PASSWORD_FORM);
  const [savingPassword, setSavingPassword] = useState(false);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ListingTab>("lostAnimals");
  const [listingEditState, setListingEditState] =
    useState<ListingEditState | null>(null);
  const [listingEditLoading, setListingEditLoading] = useState(false);
  const [listingEditError, setListingEditError] = useState("");
  const [listingActionId, setListingActionId] = useState<string | null>(null);

  const age = useMemo(
    () => calculateAge(profile?.birth ?? null),
    [profile?.birth],
  );

  const partnerBadge = useMemo(
    () => getPartnerBadge(partnerHistory),
    [partnerHistory],
  );

  const selectedCommunity = useMemo(
    () =>
      COMMUNITIES.find(
        (community) => community.key === profile?.comunity && community.active,
      ) ?? null,
    [profile?.comunity],
  );

  const communityAddressItems = useMemo(
    () => selectedCommunity?.addressItems ?? [],
    [selectedCommunity],
  );

  const communityZipcodes = useMemo(
    () => selectedCommunity?.zipcodes ?? [],
    [selectedCommunity],
  );

  const hasPresetAddressItems = communityAddressItems.length > 0;
  const hasPresetZipcodes = communityZipcodes.length > 0;

  const address1Label = useMemo(() => {
    if (!selectedCommunity) {
      return "Rua / Quadra";
    }

    const hasStreet = communityAddressItems.some(
      (item) => item.type === "street",
    );
    const hasBlock = communityAddressItems.some(
      (item) => item.type === "block",
    );

    if (hasStreet && hasBlock) return "Rua / Quadra";
    if (hasStreet) return "Rua";
    if (hasBlock) return "Quadra";

    return "Rua / Quadra";
  }, [selectedCommunity, communityAddressItems]);

  const listingTabs = useMemo(
    () => [
      {
        key: "lostAnimals" as const,
        label: "Animais Perdidos",
        count: listings.lostAnimals.length,
        items: listings.lostAnimals.map(
          (item) =>
            ({
              ...item,
              listingType: "lost_animals" as const,
            }) satisfies ProfileListingItem,
        ),
      },
      {
        key: "lostAndFound" as const,
        label: "Achados e Perdidos",
        count: listings.lostAndFound.length,
        items: listings.lostAndFound.map(
          (item) =>
            ({
              ...item,
              listingType: "lost_and_found" as const,
            }) satisfies ProfileListingItem,
        ),
      },
      {
        key: "homeRent" as const,
        label: "Moradia",
        count: listings.homeRent.length,
        items: listings.homeRent.map(
          (item) =>
            ({
              ...item,
              listingType: "home_rent" as const,
            }) satisfies ProfileListingItem,
        ),
      },
    ],
    [listings],
  );

  const activeTabData =
    listingTabs.find((tab) => tab.key === activeTab) ?? listingTabs[0];

  useEffect(() => {
    const cache = getProfileCache();

    if (cache) {
      setProfile(cache.profile);
      setPartnerHistory(cache.partnerHistory);
      setListings(cache.listings);
      setProfileForm({
        fullname: cache.profile.fullname ?? "",
        address_1: cache.profile.address_1 ?? "",
        address_2: cache.profile.address_2 ?? "",
        zipcode: cache.profile.zipcode ?? "",
        phone: cache.profile.phone ?? "",
      });
      setLoading(false);
    }

    async function loadProfilePage() {
      try {
        if (!cache) {
          setLoading(true);
        }

        setErrorMessage("");

        const [profileData, partnerData, listingData] = await Promise.all([
          getMyProfile(),
          getMyPartnerHistory(),
          getMyListings(),
        ]);

        setProfile(profileData);
        setPartnerHistory(partnerData);
        setListings(listingData);
        setProfileForm({
          fullname: profileData.fullname ?? "",
          address_1: profileData.address_1 ?? "",
          address_2: profileData.address_2 ?? "",
          zipcode: profileData.zipcode ?? "",
          phone: profileData.phone ?? "",
        });

        saveProfileCache({
          profile: profileData,
          partnerHistory: partnerData,
          listings: listingData,
        });
      } catch (error) {
        if (!cache) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Erro ao carregar o perfil.",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    void loadProfilePage();
  }, []);

  useEffect(() => {
    async function loadAvatarUrl() {
      if (!profile?.picture_path) {
        setAvatarUrl(null);
        return;
      }

      try {
        const signedUrl = await getMyAvatarSignedUrl(profile.picture_path);
        setAvatarUrl(signedUrl);
      } catch {
        setAvatarUrl(null);
      }
    }

    void loadAvatarUrl();
  }, [profile?.picture_path]);

  useEffect(() => {
    if (!profile) return;

    saveProfileCache({
      profile,
      partnerHistory,
      listings,
    });
  }, [profile, partnerHistory, listings]);

  function setFeedbackSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profileForm.address_1) {
      setErrorMessage(`Selecione ${address1Label.toLowerCase()}.`);
      setSuccessMessage("");
      return;
    }

    if (!profileForm.zipcode) {
      setErrorMessage("Selecione o CEP.");
      setSuccessMessage("");
      return;
    }

    try {
      setSavingProfile(true);
      const updatedProfile = await updateMyProfile(profileForm);

      setProfile(updatedProfile);
      setProfileForm({
        fullname: updatedProfile.fullname ?? "",
        address_1: updatedProfile.address_1 ?? "",
        address_2: updatedProfile.address_2 ?? "",
        zipcode: updatedProfile.zipcode ?? "",
        phone: updatedProfile.phone ?? "",
      });
      setIsEditingProfile(false);
      setFeedbackSuccess("Dados pessoais atualizados com sucesso.");

      saveProfileCache({
        profile: updatedProfile,
        partnerHistory,
        listings,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar o perfil.",
      );
      setSuccessMessage("");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordForm.password || !passwordForm.confirmPassword) {
      setErrorMessage("Preencha os dois campos de senha.");
      setSuccessMessage("");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setErrorMessage("A confirmação da senha não confere.");
      setSuccessMessage("");
      return;
    }

    try {
      setSavingPassword(true);
      await updateMyPassword(passwordForm.password);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setFeedbackSuccess("Senha atualizada com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar a senha.",
      );
      setSuccessMessage("");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    try {
      setAvatarLoading(true);
      const updatedProfile = await uploadMyAvatar(file);
      setProfile(updatedProfile);
      setFeedbackSuccess("Avatar atualizado com sucesso.");

      saveProfileCache({
        profile: updatedProfile,
        partnerHistory,
        listings,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar o avatar.",
      );
      setSuccessMessage("");
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleDeleteAvatar() {
    try {
      setAvatarLoading(true);
      const updatedProfile = await deleteMyAvatar();
      setProfile(updatedProfile);
      setFeedbackSuccess("Avatar removido com sucesso.");

      saveProfileCache({
        profile: updatedProfile,
        partnerHistory,
        listings,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao remover o avatar.",
      );
      setSuccessMessage("");
    } finally {
      setAvatarLoading(false);
    }
  }

  function openListingEdit(item: ProfileListingItem) {
    setListingEditError("");
    setListingEditState(mapListingToEditState(item));
  }

  async function handleListingEditSubmit() {
    if (!listingEditState) return;

    try {
      setListingEditLoading(true);
      setListingEditError("");

      if (listingEditState.listingType === "lost_animals") {
        const updated = await updateMyLostAnimal(listingEditState.id, {
          name: listingEditState.name,
          description: listingEditState.description,
          type: listingEditState.type,
          phone: listingEditState.phone,
        });

        const nextListings = updateListingCollection(listings, {
          ...updated,
          listingType: "lost_animals",
        });

        setListings(nextListings);

        if (profile) {
          saveProfileCache({
            profile,
            partnerHistory,
            listings: nextListings,
          });
        }
      }

      if (listingEditState.listingType === "lost_and_found") {
        const updated = await updateMyLostAndFound(listingEditState.id, {
          title: listingEditState.title,
          description: listingEditState.description,
          type: listingEditState.type,
          phone: listingEditState.phone,
        });

        const nextListings = updateListingCollection(listings, {
          ...updated,
          listingType: "lost_and_found",
        });

        setListings(nextListings);

        if (profile) {
          saveProfileCache({
            profile,
            partnerHistory,
            listings: nextListings,
          });
        }
      }

      if (listingEditState.listingType === "home_rent") {
        const updated = await updateMyHomeRent(listingEditState.id, {
          title: listingEditState.title,
          description: listingEditState.description,
          type: listingEditState.type,
          address: listingEditState.address,
          phone: listingEditState.phone,
        });

        const nextListings = updateListingCollection(listings, {
          ...updated,
          listingType: "home_rent",
        });

        setListings(nextListings);

        if (profile) {
          saveProfileCache({
            profile,
            partnerHistory,
            listings: nextListings,
          });
        }
      }

      setListingEditState(null);
      setFeedbackSuccess("Item atualizado com sucesso.");
    } catch (error) {
      setListingEditError(
        error instanceof Error ? error.message : "Erro ao salvar o item.",
      );
    } finally {
      setListingEditLoading(false);
    }
  }

  async function handleCloseListing(item: ProfileListingItem) {
    const confirmed = window.confirm(
      "Deseja realmente encerrar este item? O registro continuará visível no seu histórico.",
    );

    if (!confirmed) return;

    try {
      setListingActionId(item.id);

      if (item.listingType === "lost_animals") {
        const updated = await closeMyLostAnimal(item.id);
        const nextListings = updateListingCollection(listings, {
          ...updated,
          listingType: "lost_animals",
        });

        setListings(nextListings);

        if (profile) {
          saveProfileCache({
            profile,
            partnerHistory,
            listings: nextListings,
          });
        }
      }

      if (item.listingType === "lost_and_found") {
        const updated = await closeMyLostAndFound(item.id);
        const nextListings = updateListingCollection(listings, {
          ...updated,
          listingType: "lost_and_found",
        });

        setListings(nextListings);

        if (profile) {
          saveProfileCache({
            profile,
            partnerHistory,
            listings: nextListings,
          });
        }
      }

      if (item.listingType === "home_rent") {
        const updated = await closeMyHomeRent(item.id);
        const nextListings = updateListingCollection(listings, {
          ...updated,
          listingType: "home_rent",
        });

        setListings(nextListings);

        if (profile) {
          saveProfileCache({
            profile,
            partnerHistory,
            listings: nextListings,
          });
        }
      }

      setFeedbackSuccess("Item encerrado com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao encerrar o item.",
      );
      setSuccessMessage("");
    } finally {
      setListingActionId(null);
    }
  }

  async function handleDeleteListing(item: ProfileListingItem) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este item? Esta ação remove também as imagens do bucket e não pode ser desfeita.",
    );

    if (!confirmed) return;

    try {
      setListingActionId(item.id);

      if (item.listingType === "lost_animals") {
        await deleteMyLostAnimal(item.id);
      }

      if (item.listingType === "lost_and_found") {
        await deleteMyLostAndFound(item.id);
      }

      if (item.listingType === "home_rent") {
        await deleteMyHomeRent(item.id);
      }

      const nextListings = removeListingCollection(listings, item);
      setListings(nextListings);

      if (profile) {
        saveProfileCache({
          profile,
          partnerHistory,
          listings: nextListings,
        });
      }

      setFeedbackSuccess("Item excluído com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao excluir o item.",
      );
      setSuccessMessage("");
    } finally {
      setListingActionId(null);
    }
  }

  useEffect(() => {
    return () => {
      if (
        !profile &&
        !partnerHistory.length &&
        !listings.lostAnimals.length &&
        !listings.lostAndFound.length &&
        !listings.homeRent.length
      ) {
        clearProfileCache();
      }
    };
  }, [profile, partnerHistory, listings]);

  if (loading) {
    return (
      <DashboardLayout>
        <main className="min-h-screen bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:py-8 md:py-10">
          <div className="mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Carregando perfil...
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <main className="min-h-screen bg-zinc-50 px-4 py-6 dark:bg-zinc-950 sm:py-8 md:py-10">
          <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage || "Não foi possível carregar o perfil."}
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:py-8 md:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-4xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <div className="relative flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-4xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`Avatar de ${profile.fullname}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={34}
                      className="text-zinc-400 dark:text-zinc-600"
                    />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                      {profile.fullname}
                    </h1>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${partnerBadge.className}`}
                    >
                      {partnerBadge.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                      <Mail size={14} />
                      {profile.email}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-800">
                      <MapPin size={14} />
                      {selectedCommunity?.label || "Comunidade não informada"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 capitalize dark:border-zinc-800">
                      <ShieldCheck size={14} />
                      {translateRole(profile.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
                  {avatarLoading ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} />
                  )}
                  Trocar avatar
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => void handleAvatarFileChange(event)}
                    disabled={avatarLoading}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void handleDeleteAvatar()}
                  disabled={avatarLoading || !profile.picture_path}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                  {avatarLoading ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Remover avatar
                </button>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className={sectionCardClassName()}>
              <div className="mb-5 flex flex-col gap-3 sm:items-center">
                <SectionTitle
                  title="Dados pessoais"
                  description="Você pode editar apenas nome, endereço, CEP e telefone."
                />

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile((prev) => !prev);
                    setProfileForm({
                      fullname: profile.fullname ?? "",
                      address_1: profile.address_1 ?? "",
                      address_2: profile.address_2 ?? "",
                      zipcode: profile.zipcode ?? "",
                      phone: profile.phone ?? "",
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Pencil size={16} />
                  {isEditingProfile ? "Cancelar edição" : "Editar dados"}
                </button>
              </div>

              {isEditingProfile ? (
                <form
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  onSubmit={handleProfileSubmit}
                >
                  <input
                    type="text"
                    value={profileForm.fullname}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        fullname: event.target.value,
                      }))
                    }
                    className={`${profileInputClassName()} md:col-span-2`}
                    placeholder="Nome completo"
                    required
                  />

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {address1Label}
                    </label>

                    {hasPresetAddressItems ? (
                      <select
                        value={profileForm.address_1}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            address_1: event.target.value,
                          }))
                        }
                        className={profileInputClassName()}
                        required
                      >
                        <option value="">
                          Selecione {address1Label.toLowerCase()}
                        </option>
                        {communityAddressItems.map((item) => (
                          <option key={item.value} value={item.label}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={profileForm.address_1}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            address_1: event.target.value,
                          }))
                        }
                        className={profileInputClassName()}
                        placeholder="Endereço principal"
                        required
                      />
                    )}
                  </div>

                  <input
                    type="text"
                    value={profileForm.address_2}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        address_2: event.target.value,
                      }))
                    }
                    className={profileInputClassName()}
                    placeholder="Complemento"
                  />

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      CEP
                    </label>

                    {hasPresetZipcodes ? (
                      <select
                        value={profileForm.zipcode}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            zipcode: event.target.value,
                          }))
                        }
                        className={profileInputClassName()}
                        required
                      >
                        <option value="">Selecione o CEP</option>
                        {communityZipcodes.map((zipcode) => (
                          <option key={zipcode} value={zipcode}>
                            {formatCep(zipcode)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formatCep(profileForm.zipcode)}
                        onChange={(event) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            zipcode: event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 8),
                          }))
                        }
                        className={profileInputClassName()}
                        placeholder="CEP"
                        required
                      />
                    )}
                  </div>

                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        phone: formatPhone(event.target.value),
                      }))
                    }
                    className={profileInputClassName()}
                    placeholder="Telefone"
                  />

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingProfile ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Salvar dados
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ProfileField
                    icon={User}
                    label="Nome completo"
                    value={profile.fullname || ""}
                  />
                  <ProfileField
                    icon={Mail}
                    label="E-mail"
                    value={profile.email || ""}
                  />
                  <ProfileField
                    icon={Phone}
                    label="Telefone"
                    value={profile.phone || ""}
                  />
                  <ProfileField
                    icon={MapPin}
                    label="Comunidade"
                    value={
                      selectedCommunity?.label || "Comunidade não informada"
                    }
                  />
                  <ProfileField
                    icon={MapPin}
                    label="Endereço principal"
                    value={profile.address_1 || ""}
                  />
                  <ProfileField
                    icon={MapPin}
                    label="Complemento"
                    value={profile.address_2 || ""}
                  />
                  <ProfileField
                    icon={MapPin}
                    label="CEP"
                    value={formatCep(profile.zipcode || "")}
                  />
                  <ProfileField
                    icon={ShieldCheck}
                    label="Cargo"
                    value={translateRole(profile.role)}
                  />
                  <ProfileField
                    icon={User}
                    label="CPF"
                    value={formatCpf(profile.cpf || "")}
                  />
                  <ProfileField
                    icon={CreditCard}
                    label="Nascimento / idade"
                    value={
                      profile.birth
                        ? `${formatDate(profile.birth)}${age !== null ? ` • ${age} anos` : ""}`
                        : "Não informado"
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <section className={sectionCardClassName()}>
                <SectionTitle
                  title="Segurança"
                  description="Altere sua senha de acesso."
                />

                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={16}
                    />
                    <input
                      type="password"
                      value={passwordForm.password}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      className={`${profileInputClassName()} pl-11`}
                      placeholder="Nova senha"
                    />
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={16}
                    />
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className={`${profileInputClassName()} pl-11`}
                      placeholder="Confirmar nova senha"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {savingPassword ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <LockKeyhole size={16} />
                    )}
                    Atualizar senha
                  </button>
                </form>
              </section>

              <section className={sectionCardClassName()}>
                <SectionTitle title="Histórico de Sócio" />

                <div className="space-y-3">
                  {partnerHistory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                      Nenhum histórico de parceria encontrado.
                    </div>
                  ) : (
                    partnerHistory.map((item) => {
                      const expiresAt = new Date(item.expires_at);
                      const isActive = item.status
                        ? item.status === "active"
                        : expiresAt >= new Date();

                      return (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Período iniciado em{" "}
                                {formatDate(item.created_at)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                Válido até {formatDate(item.expires_at)}
                              </p>
                            </div>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                  : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                              }`}
                            >
                              {item.status
                                ? item.status === "active"
                                  ? "Ativa"
                                  : item.status === "cancelled"
                                    ? "Cancelada"
                                    : "Expirada"
                                : isActive
                                  ? "Ativa"
                                  : "Expirada"}
                            </span>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </section>

          <section className={sectionCardClassName()}>
            <SectionTitle
              title="Minhas publicações"
              description="Gerencie os itens criados por você. Você pode editar dados textuais, encerrar ou excluir cada publicação."
            />

            <div className="mb-5 flex flex-wrap gap-2">
              {listingTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {activeTabData.items.length === 0 ? (
              <ListingEmptyState label={activeTabData.label} />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {activeTabData.items.map((item) => {
                  const isBusy = listingActionId === item.id;
                  const coverUrl = item.pic_1_url;
                  const listingTitle =
                    item.listingType === "lost_animals"
                      ? item.name
                      : item.title;
                  const listingTypeLabel =
                    item.listingType === "home_rent"
                      ? item.type === "rent"
                        ? "Aluguel"
                        : "Compra"
                      : item.type === "lost"
                        ? "Perdido"
                        : "Encontrado";
                  const statusLabel =
                    item.status === "open"
                      ? "Aberto"
                      : item.status === "resolved"
                        ? "Resolvido"
                        : "Encerrado";

                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={listingTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="space-y-4 p-5">
                        <div className="flex-col items-center justify-center gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                              {listingTitle}
                            </h3>
                          </div>

                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            {listingTypeLabel}
                          </span>
                          <span className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                            Criado em {formatDateTime(item.created_at)}
                          </span>
                        </div>

                        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {item.description}
                        </p>

                        {item.listingType === "home_rent" ? (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Endereço:{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {item.address}
                            </span>
                          </p>
                        ) : null}

                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Telefone:{" "}
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {item.phone}
                          </span>
                        </p>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => openListingEdit(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleCloseListing(item)}
                            disabled={isBusy || item.status !== "open"}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
                          >
                            {isBusy ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Save size={16} />
                            )}
                            Encerrar
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteListing(item)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                          >
                            {isBusy ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <ListingEditModal
          state={listingEditState}
          loading={listingEditLoading}
          errorMessage={listingEditError}
          onClose={() => {
            setListingEditState(null);
            setListingEditError("");
          }}
          onChange={setListingEditState}
          onSubmit={handleListingEditSubmit}
        />
      </main>
    </DashboardLayout>
  );
}
