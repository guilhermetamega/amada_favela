import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import {
  createGarbageSchedule,
  getEditableGarbageSchedules,
} from "@/services/supabase/garbage_collection";
import type { GarbageCollectionSchedule, Weekday } from "@/types/garbage_collection";

const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function GarbageSchedulesPage() {
  const [items, setItems] = useState<GarbageCollectionSchedule[]>([]);
  const [weekday, setWeekday] = useState<Weekday>("monday");
  const [passTime, setPassTime] = useState("08:00");

  useEffect(() => {
    void getEditableGarbageSchedules().then(setItems).catch(() => undefined);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const created = await createGarbageSchedule({ weekday, pass_time: passTime });
    setItems((prev) => [...prev, created]);
  }

  return (
    <DashboardLayout>
      <MainLayout className="space-y-4">
        <h1 className="text-2xl font-semibold">Horários de lixo</h1>
        <p className="text-sm text-zinc-500">Configure os dias/horários da coleta. O contador global só aparece quando faltarem 10 minutos ou menos.</p>
        <form onSubmit={onSubmit} className="flex gap-2">
          <select value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)} className="rounded border px-2 py-1">
            {weekdays.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input type="time" value={passTime} onChange={(e) => setPassTime(e.target.value)} className="rounded border px-2 py-1" required />
          <button className="rounded bg-emerald-600 px-3 py-1 text-white" type="submit">Adicionar</button>
        </form>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded border p-3 text-sm">{item.weekday} - {item.pass_time} {item.is_active ? "(ativo)" : "(inativo)"}</li>
          ))}
        </ul>
      </MainLayout>
    </DashboardLayout>
  );
}
