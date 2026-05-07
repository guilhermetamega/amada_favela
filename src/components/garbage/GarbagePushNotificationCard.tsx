import { useMemo, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import {
  getFirebaseVapidKey,
  getFirebaseWebConfig,
  isPushMessagingSupported,
  requestGarbagePushToken,
} from "@/services/firebase_messaging";
import { registerGarbagePushToken } from "@/services/supabase/garbage_collection";

type Status = "idle" | "loading" | "success" | "error";

export default function GarbagePushNotificationCard() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const availability = useMemo(() => {
    if (!isPushMessagingSupported()) {
      return {
        enabled: false,
        message: "Este navegador não oferece suporte a notificações push.",
      };
    }

    if (!getFirebaseWebConfig() || !getFirebaseVapidKey()) {
      return {
        enabled: false,
        message:
          "As variáveis públicas do Firebase ainda não foram configuradas neste ambiente.",
      };
    }

    if (Notification.permission === "denied") {
      return {
        enabled: false,
        message:
          "As notificações estão bloqueadas no navegador. Libere a permissão nas configurações do site.",
      };
    }

    return { enabled: true, message: "" };
  }, []);

  async function enableNotifications() {
    try {
      setStatus("loading");
      setMessage("");

      const fcmToken = await requestGarbagePushToken();
      await registerGarbagePushToken({
        fcm_token: fcmToken,
        platform: "web",
        user_agent: navigator.userAgent,
      });

      setStatus("success");
      setMessage(
        "Notificações ativadas. Você será avisado 10 minutos antes da coleta.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações push.",
      );
    }
  }

  const isDisabled = !availability.enabled || status === "loading";

  return (
    <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            {status === "success" ? <BellRing size={22} /> : <Bell size={22} />}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
              Receber aviso da coleta
            </h2>
            <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">
              Ative para receber uma notificação push quando faltar 10 minutos
              para o próximo horário de lixo da sua comunidade.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={enableNotifications}
          disabled={isDisabled}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-400"
        >
          {status === "loading" ? "Ativando..." : "Ativar notificações"}
        </button>
      </div>

      {availability.message || message ? (
        <p
          className={`mt-3 text-sm ${
            status === "error" || availability.message
              ? "text-rose-600 dark:text-rose-300"
              : "text-emerald-700 dark:text-emerald-200"
          }`}
        >
          {message || availability.message}
        </p>
      ) : null}
    </section>
  );
}
