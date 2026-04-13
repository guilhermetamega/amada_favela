import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import AdminServiceOrdersHero from "@/components/adminServiceOrders/Hero";
import AdminServiceOrdersFeedback from "@/components/adminServiceOrders/Feedback";
import AdminServiceOrdersFilters from "@/components/adminServiceOrders/Filters";
import GroupedOrdersList from "@/components/adminServiceOrders/GroupedOrderList";
import FinalizeOrderModal from "@/components/adminServiceOrders/FinalizeOrderModal";
import {
  getAdminGroupedServiceOrders,
  resolveServiceOrderGroup,
} from "@/services/supabase/sevice_orders";
import type { GroupedServiceOrder } from "@/types/service_orders";
import MainLayout from "@/components/layout/MainLayout";

function matchesDate(dateString: string, selectedDate: string) {
  if (!selectedDate) return true;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` === selectedDate;
}

export default function AdminServiceOrdersPage() {
  const [items, setItems] = useState<GroupedServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingResolve, setPendingResolve] =
    useState<GroupedServiceOrder | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await getAdminGroupedServiceOrders();
      setItems(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao carregar ocorrências.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const availableTopics = useMemo(() => {
    return Array.from(
      new Set(items.map((item) => item.category_label).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.address_1.toLowerCase().includes(normalizedSearch) ||
        item.display_issue.toLowerCase().includes(normalizedSearch) ||
        item.category_label.toLowerCase().includes(normalizedSearch);

      const matchesTopic =
        !selectedTopic || item.category_label === selectedTopic;

      const matchesItemDate =
        !selectedDate ||
        item.items.some((order) => matchesDate(order.created_at, selectedDate));

      return matchesSearch && matchesTopic && matchesItemDate;
    });
  }, [items, search, selectedDate, selectedTopic]);

  async function handleResolve() {
    if (!pendingResolve) return;

    try {
      setResolveLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await resolveServiceOrderGroup(
        pendingResolve.address_1,
        pendingResolve.normalized_issue_key,
      );

      const next = await getAdminGroupedServiceOrders();
      setItems(next);
      setPendingResolve(null);
      setSuccessMessage("Ordem finalizada com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao finalizar ordem.",
      );
    } finally {
      setResolveLoading(false);
    }
  }

  function handleClearFilters() {
    setSearch("");
    setSelectedDate("");
    setSelectedTopic("");
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <AdminServiceOrdersHero title="Ocorrências" />

          <AdminServiceOrdersFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          {!loading ? (
            <AdminServiceOrdersFilters
              search={search}
              selectedDate={selectedDate}
              selectedTopic={selectedTopic}
              topics={availableTopics}
              onSearchChange={setSearch}
              onDateChange={setSelectedDate}
              onTopicChange={setSelectedTopic}
              onClear={handleClearFilters}
            />
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-[28px] bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : (
            <GroupedOrdersList
              items={filteredItems}
              onResolve={(item) => setPendingResolve(item)}
            />
          )}
        </div>
      </MainLayout>

      <FinalizeOrderModal
        open={!!pendingResolve}
        title={pendingResolve?.display_issue ?? ""}
        count={pendingResolve?.requests_count ?? 0}
        loading={resolveLoading}
        onClose={() => setPendingResolve(null)}
        onConfirm={handleResolve}
      />
    </DashboardLayout>
  );
}
