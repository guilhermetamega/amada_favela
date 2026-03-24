import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import DashboardLayout from "@/components/layout/Layout";
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
import ProfileFeedback from "@/components/profile/Feedback";
import ProfileHero from "@/components/profile/Hero";
import PartnerHistoryModal from "@/components/profile/HistoryModal";
import ListingEditModal from "@/components/profile/ListingEditModal";
import ProfileListingsSection from "@/components/profile/ListingsSection";
import ProfilePageSkeleton from "@/components/profile/PageSkeleton";
import ProfilePartnerSection from "@/components/profile/PartnerSection";
import ProfilePersonalSection from "@/components/profile/PersonalSection";
import ProfileSecuritySection from "@/components/profile/SecuritySection";

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

type AddressItem = {
  label: string;
  value: string;
  type?: "street" | "block";
};

type ProfileCachePayload = {
  profile: ProfileUser;
  partnerHistory: PartnerHistoryItem[];
  listings: MyListingsData;
  avatarUrl: string | null;
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

const PROFILE_CACHE_KEY = "profile_page_cache_v2";
const PROFILE_CACHE_TTL = 1000 * 60 * 5;

function getProfileCache() {
  try {
    const raw = window.sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProfileCachePayload;
    const expired = Date.now() - parsed.timestamp > PROFILE_CACHE_TTL;

    if (expired) {
      window.sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveProfileCache(payload: Omit<ProfileCachePayload, "timestamp">) {
  try {
    window.sessionStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        ...payload,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // noop
  }
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isPartnerHistoryItemActive(item: PartnerHistoryItem) {
  const expiresAt = new Date(item.expires_at);
  return item.status ? item.status === "active" : expiresAt >= new Date();
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

  const active = isPartnerHistoryItemActive(latest);

  return active
    ? {
        label: "Sócio ativo",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
      }
    : {
        label: "Sócio expirado",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
      };
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
  const [partnerActionMessage, setPartnerActionMessage] = useState("");

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
  const [isPartnerHistoryModalOpen, setIsPartnerHistoryModalOpen] =
    useState(false);

  const partnerBadge = useMemo(
    () => getPartnerBadge(partnerHistory),
    [partnerHistory],
  );

  const hasActivePartner = useMemo(
    () => partnerHistory.some((item) => isPartnerHistoryItemActive(item)),
    [partnerHistory],
  );

  const selectedCommunity = useMemo(
    () =>
      COMMUNITIES.find(
        (community) => community.key === profile?.comunity && community.active,
      ) ?? null,
    [profile?.comunity],
  );

  const communityAddressItems = useMemo<AddressItem[]>(
    () => (selectedCommunity?.addressItems as AddressItem[] | undefined) ?? [],
    [selectedCommunity],
  );

  const communityZipcodes = useMemo<string[]>(
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

  const address1Placeholder = useMemo(() => {
    if (!selectedCommunity) {
      return "Digite sua rua ou quadra";
    }

    const hasStreet = communityAddressItems.some(
      (item) => item.type === "street",
    );
    const hasBlock = communityAddressItems.some(
      (item) => item.type === "block",
    );

    if (hasStreet && hasBlock) return "Selecione ou digite sua rua/quadra";
    if (hasStreet) return "Digite sua rua";
    if (hasBlock) return "Digite sua quadra";

    return "Digite sua rua ou quadra";
  }, [selectedCommunity, communityAddressItems]);

  useEffect(() => {
    const cache = getProfileCache();

    if (cache) {
      setProfile(cache.profile);
      setPartnerHistory(cache.partnerHistory);
      setListings(cache.listings);
      setAvatarUrl(cache.avatarUrl);
      setProfileForm({
        fullname: cache.profile.fullname ?? "",
        address_1: cache.profile.address_1 ?? "",
        address_2: cache.profile.address_2 ?? "",
        zipcode: cache.profile.zipcode ?? "",
        phone: cache.profile.phone ?? "",
      });
      setLoading(false);
    }

    let active = true;

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

        let nextAvatarUrl: string | null = cache?.avatarUrl ?? null;

        if (profileData.picture_path) {
          try {
            nextAvatarUrl = await getMyAvatarSignedUrl(
              profileData.picture_path,
            );
          } catch {
            nextAvatarUrl = null;
          }
        } else {
          nextAvatarUrl = null;
        }

        if (!active) return;

        setProfile(profileData);
        setPartnerHistory(partnerData);
        setListings(listingData);
        setAvatarUrl(nextAvatarUrl);
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
          avatarUrl: nextAvatarUrl,
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
        if (active) setLoading(false);
      }
    }

    void loadProfilePage();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const shouldLockScroll = isPartnerHistoryModalOpen || !!listingEditState;
    document.body.style.overflow = shouldLockScroll ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isPartnerHistoryModalOpen, listingEditState]);

  function setFeedbackSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
  }

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
    setPartnerActionMessage("");
  }

  function handlePayMonthlyFeeClick() {
    setPartnerActionMessage(
      "A função de pagamento da mensalidade será liberada após a configuração completa da Stripe.",
    );
    setSuccessMessage("");
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
        avatarUrl,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
      );
      setSuccessMessage("");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordForm.password || !passwordForm.confirmPassword) {
      setErrorMessage("Preencha a nova senha e a confirmação.");
      setSuccessMessage("");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setErrorMessage("A confirmação da senha não corresponde.");
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
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a senha.",
      );
      setSuccessMessage("");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setAvatarLoading(true);
      clearMessages();

      const updatedProfile = await uploadMyAvatar(file);
      setProfile(updatedProfile);

      let nextAvatarUrl: string | null = null;
      if (updatedProfile.picture_path) {
        nextAvatarUrl = await getMyAvatarSignedUrl(updatedProfile.picture_path);
      }

      setAvatarUrl(nextAvatarUrl);
      setFeedbackSuccess("Avatar atualizado com sucesso.");

      saveProfileCache({
        profile: updatedProfile,
        partnerHistory,
        listings,
        avatarUrl: nextAvatarUrl,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o avatar.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleDeleteAvatar() {
    try {
      setAvatarLoading(true);
      clearMessages();

      const updatedProfile = await deleteMyAvatar();
      setProfile(updatedProfile);
      setAvatarUrl(null);
      setFeedbackSuccess("Avatar removido com sucesso.");

      saveProfileCache({
        profile: updatedProfile,
        partnerHistory,
        listings,
        avatarUrl: null,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o avatar.",
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  function handleEditListing(item: ProfileListingItem) {
    setListingEditError("");

    if (item.listingType === "lost_animals") {
      setListingEditState({
        listingType: "lost_animals",
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        phone: item.phone,
      });
      return;
    }

    if (item.listingType === "lost_and_found") {
      setListingEditState({
        listingType: "lost_and_found",
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        phone: item.phone,
      });
      return;
    }

    setListingEditState({
      listingType: "home_rent",
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      address: item.address,
      phone: item.phone,
    });
  }

  async function handleSubmitListingEdit() {
    if (!listingEditState) return;

    try {
      setListingEditLoading(true);
      setListingEditError("");

      if (listingEditState.listingType === "lost_animals") {
        await updateMyLostAnimal(listingEditState.id, {
          name: listingEditState.name.trim(),
          description: listingEditState.description.trim(),
          type: listingEditState.type,
          phone: formatPhone(listingEditState.phone),
        } as UpdateLostAnimalInput);
      } else if (listingEditState.listingType === "lost_and_found") {
        await updateMyLostAndFound(listingEditState.id, {
          title: listingEditState.title.trim(),
          description: listingEditState.description.trim(),
          type: listingEditState.type,
          phone: formatPhone(listingEditState.phone),
        } as UpdateLostAndFoundInput);
      } else {
        await updateMyHomeRent(listingEditState.id, {
          title: listingEditState.title.trim(),
          description: listingEditState.description.trim(),
          type: listingEditState.type,
          address: listingEditState.address.trim(),
          phone: formatPhone(listingEditState.phone),
        } as UpdateHomeRentInput);
      }

      const listingData = await getMyListings();
      setListings(listingData);
      setListingEditState(null);
      setFeedbackSuccess("Anúncio atualizado com sucesso.");

      if (profile) {
        saveProfileCache({
          profile,
          partnerHistory,
          listings: listingData,
          avatarUrl,
        });
      }
    } catch (error) {
      setListingEditError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o anúncio.",
      );
    } finally {
      setListingEditLoading(false);
    }
  }

  async function handleCloseListing(item: ProfileListingItem) {
    try {
      setListingActionId(item.id);
      clearMessages();

      if (item.listingType === "lost_animals") {
        await closeMyLostAnimal(item.id);
      } else if (item.listingType === "lost_and_found") {
        await closeMyLostAndFound(item.id);
      } else {
        await closeMyHomeRent(item.id);
      }

      const listingData = await getMyListings();
      setListings(listingData);
      setFeedbackSuccess("Anúncio encerrado com sucesso.");

      if (profile) {
        saveProfileCache({
          profile,
          partnerHistory,
          listings: listingData,
          avatarUrl,
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar o anúncio.",
      );
    } finally {
      setListingActionId(null);
    }
  }

  async function handleDeleteListing(item: ProfileListingItem) {
    try {
      setListingActionId(item.id);
      clearMessages();

      if (item.listingType === "lost_animals") {
        await deleteMyLostAnimal(item.id);
      } else if (item.listingType === "lost_and_found") {
        await deleteMyLostAndFound(item.id);
      } else {
        await deleteMyHomeRent(item.id);
      }

      const listingData = await getMyListings();
      setListings(listingData);
      setFeedbackSuccess("Anúncio excluído com sucesso.");

      if (profile) {
        saveProfileCache({
          profile,
          partnerHistory,
          listings: listingData,
          avatarUrl,
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o anúncio.",
      );
    } finally {
      setListingActionId(null);
    }
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:py-8 md:py-10">
        {loading && !profile ? (
          <ProfilePageSkeleton />
        ) : !profile ? (
          <div className="mx-auto max-w-6xl rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {errorMessage || "Não foi possível carregar o perfil."}
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            <ProfileFeedback
              errorMessage={errorMessage}
              successMessage={successMessage}
              partnerActionMessage={partnerActionMessage}
            />

            <ProfileHero
              profile={profile}
              avatarUrl={avatarUrl}
              partnerBadge={partnerBadge}
              communityLabel={
                selectedCommunity?.label || "Comunidade não informada"
              }
              roleLabel={translateRole(profile.role)}
              avatarLoading={avatarLoading}
              onAvatarChange={handleAvatarChange}
              onDeleteAvatar={handleDeleteAvatar}
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <ProfilePersonalSection
                  profile={profile}
                  form={profileForm}
                  address1Label={address1Label}
                  address1Placeholder={address1Placeholder}
                  communityZipcodes={communityZipcodes}
                  communityAddressItems={communityAddressItems}
                  hasPresetZipcodes={hasPresetZipcodes}
                  hasPresetAddressItems={hasPresetAddressItems}
                  saving={savingProfile}
                  editing={isEditingProfile}
                  onStartEdit={() => setIsEditingProfile(true)}
                  onCancelEdit={() => {
                    setIsEditingProfile(false);
                    setProfileForm({
                      fullname: profile.fullname ?? "",
                      address_1: profile.address_1 ?? "",
                      address_2: profile.address_2 ?? "",
                      zipcode: profile.zipcode ?? "",
                      phone: profile.phone ?? "",
                    });
                  }}
                  onChange={setProfileForm}
                  onSubmit={handleProfileSubmit}
                />
                <ProfilePartnerSection
                  partnerHistory={partnerHistory}
                  hasActivePartner={hasActivePartner}
                  partnerBadge={partnerBadge}
                  onPayMonthlyFeeClick={handlePayMonthlyFeeClick}
                  onOpenHistory={() => setIsPartnerHistoryModalOpen(true)}
                />
              </div>

              <div className="space-y-6">
                <ProfileSecuritySection
                  form={passwordForm}
                  saving={savingPassword}
                  onChange={setPasswordForm}
                  onSubmit={handlePasswordSubmit}
                />

                <ProfileListingsSection
                  listings={listings}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onEdit={handleEditListing}
                  onClose={(item: ProfileListingItem) =>
                    void handleCloseListing(item)
                  }
                  onDelete={(item: ProfileListingItem) =>
                    void handleDeleteListing(item)
                  }
                  listingActionId={listingActionId}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <PartnerHistoryModal
        open={isPartnerHistoryModalOpen}
        items={partnerHistory}
        onClose={() => setIsPartnerHistoryModalOpen(false)}
      />

      <ListingEditModal
        value={listingEditState}
        loading={listingEditLoading}
        errorMessage={listingEditError}
        onChange={setListingEditState}
        onClose={() => setListingEditState(null)}
        onSubmit={handleSubmitListingEdit}
      />
    </DashboardLayout>
  );
}
