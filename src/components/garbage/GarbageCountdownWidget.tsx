import { useEffect, useMemo, useState } from "react";
import { getCommunityGarbageSchedules } from "@/services/supabase/garbage_collection";
import type { GarbageCollectionSchedule } from "@/types/garbage_collection";

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function getNextOccurrence(schedule: GarbageCollectionSchedule, now: Date) {
  const [hours, minutes] = schedule.pass_time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  const weekday = WEEKDAY_MAP[schedule.weekday];
  const deltaDays = (weekday - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + deltaDays);
  if (target <= now) target.setDate(target.getDate() + 7);
  return target;
}

export default function GarbageCountdownWidget() {
  const [schedules, setSchedules] = useState<GarbageCollectionSchedule[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    void getCommunityGarbageSchedules()
      .then(setSchedules)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const next = useMemo(() => {
    if (!schedules.length) return null;
    return schedules
      .map((schedule) => ({ schedule, when: getNextOccurrence(schedule, now) }))
      .sort((a, b) => a.when.getTime() - b.when.getTime())[0];
  }, [schedules, now]);

  if (!next) return null;
  const diffMs = next.when.getTime() - now.getTime();
  if (diffMs > 10 * 60 * 1000 || diffMs <= 0) return null;

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="fixed bottom-20 left-4 z-50 rounded-xl bg-emerald-600/95 px-4 py-3 text-white shadow-xl md:bottom-4">
      <p className="text-xs uppercase opacity-80">Coleta de lixo em</p>
      <p className="text-2xl font-bold tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      <p className="text-xs opacity-80">Push Firebase: etapa 2 (standby).</p>
    </div>
  );
}
