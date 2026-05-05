import type {
  GarbageCollectionSchedule,
  Weekday,
} from "@/types/garbage_collection";
import { Pencil, Trash2 } from "lucide-react";

const ORDER: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const LABELS: Record<Weekday, string> = {
  sunday: "Domingo",
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
};

type Props = {
  items: GarbageCollectionSchedule[];
  canManage?: boolean;
  onEdit?: (item: GarbageCollectionSchedule) => void;
  onDelete?: (item: GarbageCollectionSchedule) => void;
};

export default function ScheduleWeekTable({
  items,
  canManage = false,
  onEdit,
  onDelete,
}: Props) {
  const grouped = ORDER.map((weekday) => ({
    weekday,
    items: items
      .filter((item) => item.weekday === weekday)
      .sort((a, b) => a.pass_time.localeCompare(b.pass_time)),
  }));

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead className="bg-zinc-100/80 text-left text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
          <tr>
            <th className="px-4 py-3 text-center">Dia da semana</th>
            <th className="px-4 py-3 text-center">Horários</th>
            {canManage ? (
              <th className="px-4 py-3 text-center">Ações</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ weekday, items: dayItems }) => (
            <tr
              key={weekday}
              className="border-t border-zinc-200 align-top dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-medium align-middle">
                {LABELS[weekday]}
              </td>
              <td className="px-4 py-3 align-middle">
                {dayItems.length ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 align-middle">
                    {dayItems.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                      >
                        {item.pass_time.slice(0, 5)}{" "}
                        {item.is_active ? "" : "(inativo)"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-400 align-middle">
                    Sem horários
                  </span>
                )}
              </td>
              {canManage ? (
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-wrap justify-center gap-2">
                    {dayItems.map((item) => (
                      <div key={`${item.id}-actions`} className="flex gap-1">
                        <button
                          onClick={() => onEdit?.(item)}
                          className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          type="button"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDelete?.(item)}
                          className="rounded-lg border border-rose-300 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
