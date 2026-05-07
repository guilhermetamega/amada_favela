import { useEffect, useMemo, useRef, useState } from "react";
import { getCommunityGarbageSchedules } from "@/services/supabase/garbage_collection";
import type { GarbageCollectionSchedule } from "@/types/garbage_collection";

type WidgetCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const STORAGE_KEY = "garbage-countdown-widget-corner";
const MOBILE_QUERY = "(max-width: 767px)";
const EDGE_OFFSET_PX = 16;
const MOBILE_BOTTOM_OFFSET = "calc(env(safe-area-inset-bottom) + 7.25rem)";

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

function isWidgetCorner(value: string | null): value is WidgetCorner {
  return (
    value === "top-left" ||
    value === "top-right" ||
    value === "bottom-left" ||
    value === "bottom-right"
  );
}

function getCornerStyle(corner: WidgetCorner, isMobile: boolean) {
  const bottom = isMobile ? MOBILE_BOTTOM_OFFSET : `${EDGE_OFFSET_PX}px`;

  return {
    top: corner.startsWith("top") ? `${EDGE_OFFSET_PX}px` : undefined,
    bottom: corner.startsWith("bottom") ? bottom : undefined,
    left: corner.endsWith("left") ? `${EDGE_OFFSET_PX}px` : undefined,
    right: corner.endsWith("right") ? `${EDGE_OFFSET_PX}px` : undefined,
  };
}

function getNearestCorner(x: number, y: number): WidgetCorner {
  const horizontal = x < window.innerWidth / 2 ? "left" : "right";
  const vertical = y < window.innerHeight / 2 ? "top" : "bottom";

  return `${vertical}-${horizontal}` as WidgetCorner;
}

export default function GarbageCountdownWidget() {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [schedules, setSchedules] = useState<GarbageCollectionSchedule[]>([]);
  const [now, setNow] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [corner, setCorner] = useState<WidgetCorner>(() => {
    if (typeof window === "undefined") return "bottom-left";
    const storedCorner = window.localStorage.getItem(STORAGE_KEY);
    return isWidgetCorner(storedCorner) ? storedCorner : "bottom-left";
  });
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [widgetSize, setWidgetSize] = useState({ width: 210, height: 104 });

  useEffect(() => {
    void getCommunityGarbageSchedules()
      .then(setSchedules)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const updateIsMobile = () => setIsMobile(media.matches);

    updateIsMobile();
    media.addEventListener("change", updateIsMobile);

    return () => media.removeEventListener("change", updateIsMobile);
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
  const { width, height } = widgetSize;
  const baseStyle = getCornerStyle(corner, isMobile);
  const dragStyle = dragPosition
    ? {
        left: Math.min(
          Math.max(EDGE_OFFSET_PX, dragPosition.x - width / 2),
          window.innerWidth - width - EDGE_OFFSET_PX,
        ),
        top: Math.min(
          Math.max(EDGE_OFFSET_PX, dragPosition.y - height / 2),
          window.innerHeight - height - EDGE_OFFSET_PX,
        ),
        right: undefined,
        bottom: undefined,
      }
    : baseStyle;

  return (
    <div
      ref={widgetRef}
      className="fixed z-60 cursor-grab touch-none select-none rounded-xl bg-emerald-600/95 px-4 py-3 text-white shadow-xl transition-[top,bottom,left,right,transform] active:cursor-grabbing"
      style={dragStyle}
      role="status"
      aria-live="polite"
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setWidgetSize({ width: rect.width, height: rect.height });
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragPosition({ x: event.clientX, y: event.clientY });
      }}
      onPointerMove={(event) => {
        if (!dragPosition) return;
        setDragPosition({ x: event.clientX, y: event.clientY });
      }}
      onPointerUp={(event) => {
        const nextCorner = getNearestCorner(event.clientX, event.clientY);
        setCorner(nextCorner);
        window.localStorage.setItem(STORAGE_KEY, nextCorner);
        setDragPosition(null);
      }}
      onPointerCancel={() => setDragPosition(null)}
    >
      <p className="text-xs uppercase opacity-80">Coleta de lixo em</p>
      <p className="text-2xl font-bold tabular-nums">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
      <p className="text-xs opacity-80">Arraste para reposicionar</p>
    </div>
  );
}
