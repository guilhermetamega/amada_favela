import type { CommunityData } from "@/types/community";

type Props = {
  communities: CommunityData[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (item: CommunityData) => void;
};

export default function CommunitySection({ communities, loading, onCreate, onEdit }: Props) {
  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={onCreate} className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">
          Nova comunidade
        </button>
      </div>
      {loading ? <div className="text-zinc-300">Carregando comunidades...</div> : null}
      {!loading ? (
        <div className="grid grid-cols-1 divide-y divide-zinc-800">
          {communities.map((item) => (
            <div key={item.key} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-white">{item.label}</p>
                <p className="text-xs text-zinc-400">key: {item.key}</p>
              </div>
              <button type="button" onClick={() => onEdit(item)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800">Editar</button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
