import { ShieldAlert } from "lucide-react";

type Props = {
  onClick: () => void;
  reported?: boolean;
};

export default function ReportContentButton({
  onClick,
  reported = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClick();
      }}
      className={[
        "absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition active:scale-95 focus:outline-none focus:ring-2 touch-manipulation",
        reported
          ? "border-red-300/60 bg-red-600 text-white focus:ring-red-200 dark:border-red-400/40 dark:bg-red-500"
          : "border-white/30 bg-black/60 text-white hover:bg-black/70 focus:ring-white/70",
      ].join(" ")}
      aria-label={
        reported ? "Conteúdo já denunciado por você" : "Denunciar conteúdo"
      }
      title={
        reported ? "Você já denunciou este conteúdo" : "Denunciar conteúdo"
      }
    >
      <ShieldAlert size={16} />
    </button>
  );
}
