import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import ServiceOrdersHero from "@/components/serviceOrders/Hero";
import ServiceOrdersFeedback from "@/components/serviceOrders/Feedback";
import ServiceOrderForm from "@/components/serviceOrders/ServiceOrderForm";
import SubmitConfirmModal from "@/components/serviceOrders/SubmitConfirmModal";
import MyOrdersList from "@/components/serviceOrders/MyOrdersList";
import {
  createServiceOrder,
  getMyServiceOrders,
  getServiceOrderCategories,
} from "@/services/supabase/sevice_orders";
import type {
  ServiceOrder,
  ServiceOrderCategory,
} from "@/types/service_orders";
import { supabase } from "@/services/supabase/client";

export default function ServiceOrdersPage() {
  const [categories, setCategories] = useState<ServiceOrderCategory[]>([]);
  const [myOrders, setMyOrders] = useState<ServiceOrder[]>([]);
  const [address1, setAddress1] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customIssue, setCustomIssue] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Usuário não autenticado.");

        const [categoriesData, ordersData, profileData] = await Promise.all([
          getServiceOrderCategories(),
          getMyServiceOrders(),
          supabase.from("users").select("address_1").eq("id", user.id).single(),
        ]);

        if (!active) return;

        setCategories(categoriesData);
        setMyOrders(ordersData);
        setAddress1(profileData.data?.address_1 ?? "");
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao carregar ordens de serviço.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const selectedCategoryLabel =
    categories.find((item) => item.slug === selectedCategory)?.label || "";

  async function handleConfirmSubmit() {
    try {
      setSubmitLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createServiceOrder({
        category_slug: selectedCategory,
        custom_issue: customIssue,
      });

      const ordersData = await getMyServiceOrders();
      setMyOrders(ordersData);
      setSelectedCategory("");
      setCustomIssue("");
      setConfirmOpen(false);
      setSuccessMessage("Ordem de serviço enviada com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro ao enviar ordem de serviço.",
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <ServiceOrdersHero title="Ordens de Serviço" />

          <ServiceOrdersFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          {loading ? (
            <div className="space-y-4">
              <div className="h-72 animate-pulse rounded-[28px] bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-72 animate-pulse rounded-[28px] bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <ServiceOrderForm
                categories={categories}
                selectedCategory={selectedCategory}
                customIssue={customIssue}
                address1={address1}
                loading={submitLoading}
                onCategoryChange={setSelectedCategory}
                onCustomIssueChange={setCustomIssue}
                onSubmit={() => setConfirmOpen(true)}
              />

              <MyOrdersList items={myOrders} />
            </div>
          )}
        </div>
      </main>

      <SubmitConfirmModal
        open={confirmOpen}
        issueLabel={
          selectedCategory === "outros"
            ? customIssue || "Outros"
            : selectedCategoryLabel
        }
        loading={submitLoading}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </DashboardLayout>
  );
}
