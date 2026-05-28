"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getKehadiranSetup } from "@/app/actions/attendance";
import BulkAttendancePage from "./BulkAttendancePage";
import QrAttendancePage from "./QrAttendancePage";

export default function KehadiranDashboard() {
  const router = useRouter();
  const [mode, setMode] = useState<"BULK" | "QR" | null | "loading">("loading");

  useEffect(() => {
    getKehadiranSetup().then((res) => {
      if (!res.attendanceMode) {
        router.push("/setup");
      } else {
        setMode(res.attendanceMode as "BULK" | "QR");
      }
    });
  }, [router]);

  if (mode === "loading" || mode === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  return mode === "BULK" ? <BulkAttendancePage /> : <QrAttendancePage />;
}
