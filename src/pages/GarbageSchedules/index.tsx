import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import ScheduleWeekTable from "@/components/garbage/ScheduleWeekTable";
import GarbagePushNotificationCard from "@/components/garbage/GarbagePushNotificationCard";
import { getCommunityGarbageSchedules } from "@/services/supabase/garbage_collection";
import type { GarbageCollectionSchedule } from "@/types/garbage_collection";

export default function GarbageSchedulesPublicPage() {
  const [items, setItems] = useState<GarbageCollectionSchedule[]>([]);

  useEffect(() => {
    void getCommunityGarbageSchedules().then(setItems).catch(() => undefined);
  }, []);

  return (
    <DashboardLayout>
      <MainLayout className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Horários de lixo</h1>
          <p className="mt-1 text-sm text-zinc-500">Visualize os dias e horários previstos para passagem da coleta na comunidade.</p>
        </div>
        <GarbagePushNotificationCard />
        <ScheduleWeekTable items={items} />
      </MainLayout>
    </DashboardLayout>
  );
}
