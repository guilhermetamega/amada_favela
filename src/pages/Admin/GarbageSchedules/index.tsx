import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import ScheduleWeekTable from "@/components/garbage/ScheduleWeekTable";
import {
  createGarbageSchedule,
  deleteGarbageSchedule,
  getEditableGarbageSchedules,
  updateGarbageSchedule,
} from "@/services/supabase/garbage_collection";
import type { GarbageCollectionSchedule, Weekday } from "@/types/garbage_collection";

const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const labels: Record<Weekday, string> = {
  sunday: "Domingo", monday: "Segunda", tuesday: "Terça", wednesday: "Quarta", thursday: "Quinta", friday: "Sexta", saturday: "Sábado",
};

export default function GarbageSchedulesPage() {
  const [items, setItems] = useState<GarbageCollectionSchedule[]>([]);
  const [editing, setEditing] = useState<GarbageCollectionSchedule | null>(null);
  const [weekday, setWeekday] = useState<Weekday>("monday");
  const [passTime, setPassTime] = useState("08:00");

  useEffect(() => {
    void getEditableGarbageSchedules().then(setItems).catch(() => undefined);
  }, []);

  const isEditing = useMemo(() => !!editing, [editing]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      const updated = await updateGarbageSchedule(editing.id, { weekday, pass_time: passTime, is_active: editing.is_active, notes: editing.notes ?? "" });
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      return;
    }
    const created = await createGarbageSchedule({ weekday, pass_time: passTime });
    setItems((prev) => [...prev, created]);
  }

  function startEdit(item: GarbageCollectionSchedule) {
    setEditing(item);
    setWeekday(item.weekday);
    setPassTime(item.pass_time.slice(0, 5));
  }

  async function remove(item: GarbageCollectionSchedule) {
    await deleteGarbageSchedule(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  return (
    <DashboardLayout>
      <MainLayout className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Horários de lixo (admin)</h1>
          <p className="mt-1 text-sm text-zinc-500">Cadastre, edite e exclua os horários da coleta para sua comunidade.</p>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
            <select value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
              {weekdays.map((d) => <option key={d} value={d}>{labels[d]}</option>)}
            </select>
            <input type="time" value={passTime} onChange={(e) => setPassTime(e.target.value)} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950" required />
            <button className="rounded-xl bg-emerald-600 px-4 py-2 text-white" type="submit">{isEditing ? "Salvar edição" : "Adicionar horário"}</button>
            {isEditing ? <button className="rounded-xl border border-zinc-300 px-4 py-2" type="button" onClick={() => setEditing(null)}>Cancelar</button> : null}
          </form>
        </div>

        <ScheduleWeekTable items={items} canManage onEdit={startEdit} onDelete={remove} />
      </MainLayout>
    </DashboardLayout>
  );
}
