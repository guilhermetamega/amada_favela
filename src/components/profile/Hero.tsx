import type { ChangeEvent } from "react";
import {
  Camera,
  LoaderCircle,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import type { ProfileUser } from "@/types/profile";

type Props = {
  profile: ProfileUser;
  avatarUrl: string | null;
  partnerBadge: { label: string; className: string };
  communityLabel: string;
  roleLabel: string;
  avatarLoading: boolean;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDeleteAvatar: () => void;
};

function InfoChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 sm:text-sm">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

export default function ProfileHero({
  profile,
  avatarUrl,
  partnerBadge,
  communityLabel,
  roleLabel,
  avatarLoading,
  onAvatarChange,
  onDeleteAvatar,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
        <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Avatar de ${profile.fullname}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={28} className="text-zinc-400 dark:text-zinc-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <span
                  className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-[11px] font-semibold sm:text-xs ${partnerBadge.className}`}
                >
                  <span className="truncate">{partnerBadge.label}</span>
                </span>

                <h1 className="max-w-full wrap-break-word text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl lg:text-3xl">
                  {profile.fullname}
                </h1>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <InfoChip icon={<Mail size={14} />}>{profile.email}</InfoChip>
                <InfoChip icon={<MapPin size={14} />}>
                  {communityLabel}
                </InfoChip>
                <InfoChip icon={<ShieldCheck size={14} />}>
                  {roleLabel}
                </InfoChip>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[320px]">
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800">
              {avatarLoading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Camera size={16} />
              )}
              <span className="truncate">Trocar avatar</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onAvatarChange}
                disabled={avatarLoading}
              />
            </label>

            <button
              type="button"
              onClick={onDeleteAvatar}
              disabled={avatarLoading || !profile.picture_path}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              {avatarLoading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              <span className="truncate">Remover avatar</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
