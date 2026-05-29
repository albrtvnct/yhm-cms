"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getServantsList } from "@/app/actions/pelayanan";

// Interfaces
interface Servant {
  id: string;
  name: string;
  phone: string | null;
  gender: string | null;
  ministries: string | null;
}

interface ScheduleRow {
  id: string;
  position: string;
  positionKey: string;
  colorType: "indigo" | "teal" | "amber" | "blue" | "emerald" | "rose" | "orange";
  servants: string;
  servantIds: string[]; 
  status: "Konfirmasi" | "Pending" | "Batal";
  lastRotation: string;
}

interface WorkloadRow {
  name: string;
  role: string;
  count: number;
  maxCount: number;
  status: "Normal" | "Terlalu sering" | "Kurang dipakai";
  colorType: "indigo" | "rose" | "teal" | "blue";
}

interface PositionConfig {
  name: string;
  maxTasks: number;
}

interface ServiceSession {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

const DEFAULT_EMPTY_SCHEDULES: ScheduleRow[] = [
  { id: "1", position: "Worship leader", positionKey: "wl", colorType: "indigo", servants: "Belum ditugaskan", servantIds: [], status: "Pending", lastRotation: "-" },
  { id: "2", position: "Singer", positionKey: "singer", colorType: "teal", servants: "Belum ditugaskan", servantIds: [], status: "Pending", lastRotation: "-" },
  { id: "3", position: "Multimedia", positionKey: "multimedia", colorType: "amber", servants: "Belum ditugaskan", servantIds: [], status: "Pending", lastRotation: "-" },
  { id: "4", position: "Kolektan", positionKey: "kolektan", colorType: "blue", servants: "Belum ditugaskan", servantIds: [], status: "Pending", lastRotation: "-" },
  { id: "5", position: "Penjamu", positionKey: "penjamu", colorType: "emerald", servants: "Belum ditugaskan", servantIds: [], status: "Pending", lastRotation: "-" },
  { id: "6", position: "Doa syafaat", positionKey: "doa", colorType: "rose", servants: "Belum ditugaskan", servantIds: [], status: "Pending", lastRotation: "-" },
];

export default function PelayananDashboard() {
  // DB Servants
  const [dbServants, setDbServants] = useState<Servant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Service Sessions State
  const [services, setServices] = useState<ServiceSession[]>([
    { id: "srv-1", title: "Minggu, 25 Mei 2026 — ibadah umum 09.00", date: "2026-05-25", time: "09:00", type: "ibadah umum" },
    { id: "srv-2", title: "Minggu, 25 Mei 2026 — ibadah sore 17.00", date: "2026-05-25", time: "17:00", type: "ibadah sore" }
  ]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("srv-1");

  // Map containing schedules indexed by serviceId
  const [assignmentsByServiceId, setAssignmentsByServiceId] = useState<{ [serviceId: string]: ScheduleRow[] }>({});

  // Active Selected row in table for WA Simulator
  const [selectedRowId, setSelectedRowId] = useState<string>("1"); 

  // Workload states
  const [workloads, setWorkloads] = useState<WorkloadRow[]>([]);

  // Customizable flexible positions
  const [positions, setPositions] = useState<PositionConfig[]>([
    { name: "Worship leader", maxTasks: 3 },
    { name: "Singer", maxTasks: 4 },
    { name: "Multimedia", maxTasks: 4 },
    { name: "Kolektan", maxTasks: 4 },
    { name: "Penjamu", maxTasks: 4 },
    { name: "Doa syafaat", maxTasks: 2 },
    { name: "Soundman", maxTasks: 4 },
    { name: "Operator Lighting", maxTasks: 4 }
  ]);

  // Modal control states
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTargetRow, setSwapTargetRow] = useState<ScheduleRow | null>(null);
  
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastLog, setBroadcastLog] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionMax, setNewPositionMax] = useState(4);

  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false);
  const [showBlockDatesModal, setShowBlockDatesModal] = useState(false);

  // New Service Modal States
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceDate, setNewServiceDate] = useState("2026-05-31");
  const [newServiceTime, setNewServiceTime] = useState("09:00");
  const [newServiceType, setNewServiceType] = useState("ibadah umum");
  const [newServiceAutoFill, setNewServiceAutoFill] = useState(true);

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "info" } | null>(null);

  // Show a visual toast
  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  // Run the rotation generator algorithm for a specific service session
  const runRotationAlgorithm = (membersList: Servant[]): ScheduleRow[] => {
    const assignedIds = new Set<string>();
    
    // Helper to find a member for a ministry
    const findMemberForMinistry = (keyword: string, count: number = 1): Servant[] => {
      const matched = membersList.filter(m => 
        !assignedIds.has(m.id) && 
        m.ministries && 
        m.ministries.toLowerCase().includes(keyword.toLowerCase())
      );
      const selected = matched.slice(0, count);
      selected.forEach(m => assignedIds.add(m.id));
      return selected;
    };

    // Helper to get fallback members if no matching ministry found
    const getFallbackMembers = (count: number = 1): Servant[] => {
      const matched = membersList.filter(m => !assignedIds.has(m.id));
      const selected = matched.slice(0, count);
      selected.forEach(m => assignedIds.add(m.id));
      return selected;
    };

    // Populate positions
    let wlMembers = findMemberForMinistry("leader");
    if (wlMembers.length === 0) wlMembers = findMemberForMinistry("wl");
    if (wlMembers.length === 0) wlMembers = getFallbackMembers(1);

    let singerMembers = findMemberForMinistry("singer", 3);
    if (singerMembers.length === 0) singerMembers = findMemberForMinistry("sing", 3);
    if (singerMembers.length === 0) singerMembers = getFallbackMembers(Math.min(3, membersList.length - assignedIds.size));

    let multiMembers = findMemberForMinistry("multimedia");
    if (multiMembers.length === 0) multiMembers = findMemberForMinistry("media");
    if (multiMembers.length === 0) multiMembers = findMemberForMinistry("operator");
    if (multiMembers.length === 0) multiMembers = getFallbackMembers(1);

    let kolektanMembers = findMemberForMinistry("kolektan", 2);
    if (kolektanMembers.length === 0) kolektanMembers = findMemberForMinistry("usher", 2);
    if (kolektanMembers.length === 0) kolektanMembers = getFallbackMembers(Math.min(2, membersList.length - assignedIds.size));

    let penjamuMembers = findMemberForMinistry("penjamu", 2);
    if (penjamuMembers.length === 0) penjamuMembers = findMemberForMinistry("greeter", 2);
    if (penjamuMembers.length === 0) penjamuMembers = getFallbackMembers(Math.min(2, membersList.length - assignedIds.size));

    let doaMembers = findMemberForMinistry("doa");
    if (doaMembers.length === 0) doaMembers = findMemberForMinistry("syafaat");
    if (doaMembers.length === 0) doaMembers = findMemberForMinistry("pdt");
    if (doaMembers.length === 0) doaMembers = getFallbackMembers(1);

    return [
      { id: "1", position: "Worship leader", positionKey: "wl", colorType: "indigo", servants: wlMembers.map(m => m.name).join("") || "Belum ditugaskan", servantIds: wlMembers.map(m => m.id), status: wlMembers.length > 0 ? "Konfirmasi" : "Pending", lastRotation: wlMembers.length > 0 ? "3 mgg lalu" : "-" },
      { id: "2", position: "Singer", positionKey: "singer", colorType: "teal", servants: singerMembers.map(m => m.name).join(" - ") || "Belum ditugaskan", servantIds: singerMembers.map(m => m.id), status: singerMembers.length > 0 ? "Konfirmasi" : "Pending", lastRotation: singerMembers.length > 0 ? "2 mgg lalu" : "-" },
      { id: "3", position: "Multimedia", positionKey: "multimedia", colorType: "amber", servants: multiMembers.map(m => m.name).join("") || "Belum ditugaskan", servantIds: multiMembers.map(m => m.id), status: multiMembers.length > 0 ? "Pending" : "Pending", lastRotation: multiMembers.length > 0 ? "1 mgg lalu" : "-" },
      { id: "4", position: "Kolektan", positionKey: "kolektan", colorType: "blue", servants: kolektanMembers.map(m => m.name).join(" - ") || "Belum ditugaskan", servantIds: kolektanMembers.map(m => m.id), status: kolektanMembers.length > 0 ? "Konfirmasi" : "Pending", lastRotation: kolektanMembers.length > 0 ? "4 mgg lalu" : "-" },
      { id: "5", position: "Penjamu", positionKey: "penjamu", colorType: "emerald", servants: penjamuMembers.map(m => m.name).join(" - ") || "Belum ditugaskan", servantIds: penjamuMembers.map(m => m.id), status: penjamuMembers.length > 0 ? "Konfirmasi" : "Pending", lastRotation: penjamuMembers.length > 0 ? "3 mgg lalu" : "-" },
      { id: "6", position: "Doa syafaat", positionKey: "doa", colorType: "rose", servants: doaMembers.map(m => m.name).join("") || "Belum ditugaskan", servantIds: doaMembers.map(m => m.id), status: doaMembers.length > 0 ? "Konfirmasi" : "Pending", lastRotation: doaMembers.length > 0 ? "Minggu ini" : "-" },
    ];
  };

  // Load dynamic data on mount
  useEffect(() => {
    setMounted(true);
    async function loadData() {
      setIsLoading(true);
      const res = await getServantsList();
      if (res.success && res.data && res.data.length > 0) {
        const membersList: Servant[] = res.data;
        setDbServants(membersList);

        // Prepopulate assignments mapping for service 1 & 2
        const srv1Scheds = runRotationAlgorithm(membersList);
        // Slightly shuffle for srv2
        const reversedMembers = [...membersList].reverse();
        const srv2Scheds = runRotationAlgorithm(reversedMembers);

        setAssignmentsByServiceId({
          "srv-1": srv1Scheds,
          "srv-2": srv2Scheds
        });

        // Initialize workloads
        const activeServantsForWorkload = membersList.slice(0, Math.min(4, membersList.length));
        const initialWorkloads: WorkloadRow[] = activeServantsForWorkload.map((m, i) => {
          const appearCount = srv1Scheds.filter(s => s.servantIds.includes(m.id)).length;
          const fakeCount = appearCount > 0 ? appearCount + 1 : 1; 

          let status: "Normal" | "Terlalu sering" | "Kurang dipakai" = "Normal";
          if (fakeCount >= 4) status = "Terlalu sering";
          else if (fakeCount <= 1) status = "Kurang dipakai";

          const colorTypes: ("indigo" | "rose" | "teal" | "blue")[] = ["indigo", "rose", "teal", "blue"];

          return {
            name: m.name,
            role: m.ministries || "Pelayan",
            count: fakeCount,
            maxCount: 4,
            status,
            colorType: colorTypes[i % 4]
          };
        });
        setWorkloads(initialWorkloads);

      } else {
        setDbServants([]);
        setAssignmentsByServiceId({
          "srv-1": DEFAULT_EMPTY_SCHEDULES,
          "srv-2": DEFAULT_EMPTY_SCHEDULES
        });
        setWorkloads([]);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Update schedules when switching services
  const schedules = useMemo(() => {
    return assignmentsByServiceId[selectedServiceId] || DEFAULT_EMPTY_SCHEDULES;
  }, [assignmentsByServiceId, selectedServiceId]);

  // Set schedules state wrapper to update the mapping dictionary
  const setSchedules = (updateFn: (prev: ScheduleRow[]) => ScheduleRow[]) => {
    setAssignmentsByServiceId((prevMap) => {
      const currentScheds = prevMap[selectedServiceId] || DEFAULT_EMPTY_SCHEDULES;
      return {
        ...prevMap,
        [selectedServiceId]: updateFn(currentScheds)
      };
    });
  };

  // Selected Row Object
  const selectedRow = useMemo(() => {
    return schedules.find((s) => s.id === selectedRowId) || DEFAULT_EMPTY_SCHEDULES[0];
  }, [schedules, selectedRowId]);

  // Active Service Object
  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);

  // Summary Metrics
  const totalActiveServants = useMemo(() => dbServants.length, [dbServants]);

  const confirmedCount = useMemo(() => {
    const weeklyConfirmed = schedules.filter((s) => s.status === "Konfirmasi" && s.servants !== "Belum ditugaskan").length;
    const baseConfirmed = Math.max(0, Math.floor(dbServants.length * 0.8) - 6);
    return baseConfirmed + weeklyConfirmed;
  }, [schedules, dbServants]);

  const pendingCount = useMemo(() => {
    const weeklyPending = schedules.filter((s) => s.status === "Pending" && s.servants !== "Belum ditugaskan").length;
    const basePending = Math.max(0, Math.floor(dbServants.length * 0.15) - 2);
    return basePending + weeklyPending;
  }, [schedules, dbServants]);

  // Attendance confirmation inside WA simulator
  const handleConfirmAttendance = (status: "Konfirmasi" | "Batal") => {
    if (!selectedRow.servants || selectedRow.servants === "Belum ditugaskan") {
      triggerToast("Tugaskan pelayan terlebih dahulu sebelum konfirmasi!", "info");
      return;
    }

    setSchedules((prev) =>
      prev.map((s) => (s.id === selectedRow.id ? { ...s, status } : s))
    );
    triggerToast(
      status === "Konfirmasi"
        ? `Kehadiran ${selectedRow.servants} terkonfirmasi!`
        : `Jadwal ${selectedRow.servants} ditolak/dibatalkan.`
    );

    if (status === "Batal") {
      setTimeout(() => {
        handleOpenSwap(selectedRow);
      }, 1000);
    }
  };

  // Open Swap Modal
  const handleOpenSwap = (row: ScheduleRow) => {
    setSwapTargetRow(row);
    setShowSwapModal(true);
  };

  // Confirm Swap
  const handleConfirmSwap = (selectedServantName: string) => {
    if (!swapTargetRow) return;

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === swapTargetRow.id
          ? {
              ...s,
              servants: selectedServantName,
              status: "Konfirmasi", 
              lastRotation: "Baru saja ditukar"
            }
          : s
      )
    );

    // Update workloads if matched
    const isNameInWorkload = workloads.some(w => w.name === selectedServantName);
    if (!isNameInWorkload && workloads.length < 5) {
      setWorkloads(prev => [
        ...prev,
        {
          name: selectedServantName,
          role: swapTargetRow.position,
          count: 1,
          maxCount: 4,
          status: "Normal",
          colorType: "blue"
        }
      ]);
    } else {
      setWorkloads(prev =>
        prev.map(w =>
          w.name === selectedServantName
            ? { ...w, count: Math.min(w.count + 1, w.maxCount + 1), status: w.count + 1 > w.maxCount ? "Terlalu sering" : "Normal" }
            : w
        )
      );
    }

    if (swapTargetRow.servants !== "Belum ditugaskan") {
      const outgoingFirstName = swapTargetRow.servants.split(" ")[0];
      setWorkloads(prev =>
        prev.map(w =>
          w.name.includes(outgoingFirstName)
            ? { ...w, count: Math.max(w.count - 1, 0), status: w.count - 1 === 0 ? "Kurang dipakai" : "Normal" }
            : w
        )
      );
    }

    setShowSwapModal(false);
    triggerToast(`Jadwal posisi ${swapTargetRow.position} berhasil ditukar ke ${selectedServantName}!`);
  };

  // Start Broadcast Simulation
  const handleStartBroadcast = () => {
    if (dbServants.length === 0) {
      triggerToast("Tidak ada pelayan terdaftar untuk dikirimkan broadcast!", "info");
      return;
    }

    setIsBroadcasting(true);
    setShowBroadcastModal(true);
    setBroadcastProgress(0);
    setBroadcastLog([]);

    const logMessages = [
      "Menyiapkan template WhatsApp personal pelayan...",
      "Menghubungkan ke Gateway WA Fonnte...",
      ...schedules
        .filter(s => s.servants && s.servants !== "Belum ditugaskan")
        .flatMap(s => 
          s.servants.split(" - ").map(name => `Mengirim pesan personal ke ${name} (${s.position}) - Sukses 💬`)
        ),
      "Semua pesan berhasil dibroadcast secara personal!"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logMessages.length) {
        setBroadcastLog((prev) => [...prev, logMessages[currentStep]]);
        setBroadcastProgress(Math.floor(((currentStep + 1) / logMessages.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsBroadcasting(false);
        triggerToast("Broadcast jadwal bulanan berhasil dikirim!");
      }
    }, 400);
  };

  // Add Position
  const handleAddPosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;

    if (positions.some((p) => p.name.toLowerCase() === newPositionName.trim().toLowerCase())) {
      alert("Posisi ini sudah terdaftar!");
      return;
    }

    setPositions((prev) => [...prev, { name: newPositionName.trim(), maxTasks: newPositionMax }]);
    setNewPositionName("");
    triggerToast(`Posisi "${newPositionName}" berhasil ditambahkan!`);
  };

  // Add Worship Service Session (Tambah Sesi Ibadah)
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();

    // Format date in Indonesian readability
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateObj = new Date(newServiceDate);
    const dateStrFormatted = dateObj.toLocaleDateString('id-ID', options);
    
    // Clean formatted title: "Minggu, 31 Mei 2026 — ibadah umum 09.00"
    const newTitle = `${dateStrFormatted} — ${newServiceType} ${newServiceTime.replace(":", ".")}`;
    const newId = `srv-${Date.now()}`;

    const newServiceObj: ServiceSession = {
      id: newId,
      title: newTitle,
      date: newServiceDate,
      time: newServiceTime,
      type: newServiceType
    };

    // Auto-generate or empty
    const newScheds = newServiceAutoFill && dbServants.length > 0 
      ? runRotationAlgorithm(dbServants) 
      : DEFAULT_EMPTY_SCHEDULES.map(s => ({ ...s }));

    setServices(prev => [...prev, newServiceObj]);
    setAssignmentsByServiceId(prevMap => ({
      ...prevMap,
      [newId]: newScheds
    }));

    setSelectedServiceId(newId);
    setSelectedRowId("1");
    setShowAddServiceModal(false);
    triggerToast(`Sesi ibadah baru "${newServiceType}" berhasil dibuat!`);
  };

  // Export Worship Schedule as JPEG Image
  const handleExportAsJPEG = () => {
    triggerToast("Menyiapkan dokumen ekspor...", "info");

    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Title Header Background Panel
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(8, 8, canvas.width - 16, 120);

    // Title Text
    ctx.fillStyle = "#18181b";
    ctx.font = "bold 28px Inter, Arial, sans-serif";
    ctx.fillText("JADWAL PELAYANAN IBADAH GEREJA", 50, 60);

    // Subtitle Date/Time
    ctx.fillStyle = "#71717a";
    ctx.font = "bold 16px Inter, Arial, sans-serif";
    ctx.fillText(selectedService.title.toUpperCase(), 50, 95);

    // Logo / Branding on top right
    ctx.fillStyle = "#18181b";
    ctx.font = "extrabold 22px Inter, Arial, sans-serif";
    ctx.fillText("✝ YeshProduction", 780, 70);

    // Table Headers
    ctx.fillStyle = "#71717a";
    ctx.font = "bold 14px Inter, Arial, sans-serif";
    ctx.fillText("POSISI PELAYANAN", 50, 190);
    ctx.fillText("NAMA PELAYAN", 350, 190);
    ctx.fillText("STATUS KONFIRMASI", 750, 190);

    // Headers line
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 205);
    ctx.lineTo(950, 205);
    ctx.stroke();

    // Custom RoundRect Drawing helper
    const drawRoundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    };

    // Draw Rows
    let currentY = 250;
    schedules.forEach((row) => {
      // 1. Draw Position Badge Pill
      let badgeBg = "#f4f4f5";
      let badgeText = "#27272a";
      if (row.colorType === "indigo") { badgeBg = "#e0e7ff"; badgeText = "#4338ca"; }
      else if (row.colorType === "teal") { badgeBg = "#ccfbf1"; badgeText = "#0f766e"; }
      else if (row.colorType === "amber") { badgeBg = "#fef3c7"; badgeText = "#b45309"; }
      else if (row.colorType === "blue") { badgeBg = "#dbeafe"; badgeText = "#1d4ed8"; }
      else if (row.colorType === "emerald") { badgeBg = "#d1fae5"; badgeText = "#047857"; }
      else if (row.colorType === "rose") { badgeBg = "#ffe4e6"; badgeText = "#be123c"; }

      ctx.fillStyle = badgeBg;
      drawRoundRect(ctx, 50, currentY - 20, 180, 30, 15);
      ctx.fill();

      ctx.fillStyle = badgeText;
      ctx.font = "bold 12px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(row.position.toUpperCase(), 140, currentY);

      // Reset align
      ctx.textAlign = "left";

      // 2. Draw Servant Names
      ctx.fillStyle = row.servants === "Belum ditugaskan" ? "#a1a1aa" : "#18181b";
      ctx.font = row.servants === "Belum ditugaskan" ? "italic 15px Arial, sans-serif" : "bold 15px Arial, sans-serif";
      ctx.fillText(row.servants, 350, currentY);

      // 3. Draw Status Text Badge
      let statusColor = "#d97706"; // pending amber
      if (row.status === "Konfirmasi") statusColor = "#059669"; // emerald
      else if (row.status === "Batal") statusColor = "#e11d48"; // rose

      ctx.fillStyle = statusColor;
      ctx.font = "bold 14px Inter, Arial, sans-serif";
      ctx.fillText(row.status === "Konfirmasi" ? "✔ TERKONFIRMASI" : row.status === "Batal" ? "✖ DIBATALKAN" : "⏳ MENUNGGU RESPONS", 750, currentY);

      // Divider line
      ctx.strokeStyle = "#fafafa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, currentY + 22);
      ctx.lineTo(950, currentY + 22);
      ctx.stroke();

      currentY += 60;
    });

    // Footer Panel
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(8, canvas.height - 50, canvas.width - 16, 42);

    ctx.fillStyle = "#71717a";
    ctx.font = "medium 11px Inter, Arial, sans-serif";
    ctx.fillText("Diekspor otomatis dari YeshProduction Scheduler Admin. Data riil & terkonfirmasi lewat WhatsApp Gateway.", 50, canvas.height - 25);
    ctx.fillText("Tanggal Ekspor: " + new Date().toLocaleString("id-ID"), 700, canvas.height - 25);

    // Save & Trigger Download
    setTimeout(() => {
      try {
        const url = canvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        link.href = url;
        const cleanName = selectedService.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
        link.download = `jadwal-pelayanan-${cleanName}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast("Jadwal JPEG berhasil diunduh!");
      } catch (err) {
        console.error("Export error:", err);
        alert("Gagal melakukan ekspor gambar. Lingkungan browser membatasi rendering canvas.");
      }
    }, 600);
  };

  // Color mapper classes
  const getColorClasses = (color: string) => {
    switch (color) {
      case "indigo":
        return {
          badge: "bg-indigo-50 text-indigo-600 border border-indigo-100",
          bg: "bg-indigo-500",
          text: "text-indigo-600"
        };
      case "teal":
        return {
          badge: "bg-teal-50 text-teal-600 border border-teal-100",
          bg: "bg-teal-500",
          text: "text-teal-600"
        };
      case "amber":
        return {
          badge: "bg-amber-50 text-amber-600 border border-amber-100",
          bg: "bg-amber-500",
          text: "text-amber-600"
        };
      case "blue":
        return {
          badge: "bg-blue-50 text-blue-600 border border-blue-100",
          bg: "bg-blue-500",
          text: "text-blue-600"
        };
      case "emerald":
        return {
          badge: "bg-emerald-50 text-emerald-600 border border-emerald-100",
          bg: "bg-emerald-500",
          text: "text-emerald-600"
        };
      case "rose":
        return {
          badge: "bg-rose-50 text-rose-600 border border-rose-100",
          bg: "bg-rose-500",
          text: "text-rose-600"
        };
      default:
        return {
          badge: "bg-zinc-50 text-zinc-600 border border-zinc-100",
          bg: "bg-zinc-500",
          text: "text-zinc-600"
        };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-16 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Penjadwalan Pelayan</h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Kelola draf jadwal pelayanan mingguan secara otomatis dengan AI auto-rotasi dan WhatsApp Integration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowPositionsModal(true)}
            className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Posisi ({positions.length})
          </button>
          <button
            onClick={handleStartBroadcast}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.839 1.452 5.393 0 9.778-4.383 9.78-9.775.002-2.612-1.012-5.068-2.857-6.914C16.565 2.07 14.113 1.056 11.5 1.055 6.109 1.055 1.727 5.437 1.725 10.829c-.001 1.693.447 3.344 1.298 4.795l-.973 3.553 3.642-.953c1.436.786 2.972 1.196 4.955 1.196z" />
            </svg>
            Broadcast WA
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
        </div>
      ) : dbServants.length === 0 ? (
        <div className="bg-white border border-zinc-200/60 p-8 rounded-[2rem] text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-950">Belum Ada Pelayan Aktif</h3>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            Tidak ada jemaat aktif terdaftar di database untuk dijadwalkan. Silakan tambahkan anggota baru di menu **Jemaat** terlebih dahulu dan tentukan kategori pelayanan (ministries) mereka.
          </p>
        </div>
      ) : (
        <>
          <div className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase mt-10 mb-3 ml-1">Ringkasan Jadwal Pelayan</div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: "Total pelayan aktif", value: totalActiveServants.toString(), sub: "Di semua posisi", color: "text-zinc-500" },
              { label: "Ibadah bulan ini", value: (services.length * 4).toString(), sub: "4 sesi per minggu", color: "text-zinc-500" },
              { label: "Sudah konfirmasi", value: confirmedCount.toString(), sub: `${Math.min(100, Math.round((confirmedCount / (totalActiveServants || 1)) * 100))}% terkonfirmasi`, color: "text-emerald-600 font-bold" },
              { label: "Menunggu konfirmasi", value: pendingCount.toString(), sub: "WA terkirim", color: "text-amber-600 font-bold" },
            ].map((card, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-white border border-zinc-200/60 text-zinc-900 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md duration-200"
              >
                <div className="text-sm font-bold text-zinc-500 flex items-center justify-between">
                  {card.label}
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold tracking-tight text-zinc-900">{card.value}</div>
                  <div className={`text-xs mt-1 ${card.color}`}>
                    {card.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Section Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Left 2 Columns: Schedule & Rotation */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Schedule Table Card */}
              <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  JADWAL IBADAH MINGGUAN
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-amber-500 border border-zinc-100 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      {/* Service selector dropdown */}
                      <select
                        value={selectedServiceId}
                        onChange={(e) => {
                          setSelectedServiceId(e.target.value);
                          setSelectedRowId("1");
                        }}
                        className="font-extrabold text-zinc-900 text-base border-b-2 border-zinc-200 hover:border-zinc-500 bg-transparent pr-8 py-0.5 focus:outline-none cursor-pointer max-w-full truncate"
                      >
                        {services.map(srv => (
                          <option key={srv.id} value={srv.id}>
                            {srv.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-zinc-400 text-xs mt-1.5">Ganti sesi ibadah di atas atau tambahkan jadwal ibadah baru.</p>
                    </div>
                  </div>

                  {/* Actions: Add Service and Export JPEG */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowAddServiceModal(true)}
                      className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Ibadah
                    </button>
                    <button
                      onClick={handleExportAsJPEG}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Ekspor JPEG
                    </button>
                  </div>
                </div>

                {/* Interactive Schedule Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-400 text-xs uppercase tracking-wider font-extrabold">
                        <th className="pb-3 pt-1 pl-2">Posisi</th>
                        <th className="pb-3 pt-1">Pelayan</th>
                        <th className="pb-3 pt-1 text-center">Status</th>
                        <th className="pb-3 pt-1 text-right">Rotasi terakhir</th>
                        <th className="pb-3 pt-1 text-right pr-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {schedules.map((row) => {
                        const isSelected = selectedRowId === row.id;
                        const colors = getColorClasses(row.colorType);

                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRowId(row.id)}
                            className={`group cursor-pointer hover:bg-zinc-50 transition-all rounded-xl ${
                              isSelected ? "bg-zinc-100/70 font-semibold" : ""
                            }`}
                          >
                            {/* Position badge */}
                            <td className="py-3.5 pl-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                                {row.position}
                              </span>
                            </td>
                            {/* Servant name & Initial */}
                            <td className="py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-black text-xs flex items-center justify-center shrink-0 border border-zinc-200">
                                  {row.servants === "Belum ditugaskan" || row.servants.includes(" - ") ? "GRP" : row.servants.substring(0, 2).toUpperCase()}
                                </div>
                                <span className={`text-sm group-hover:text-zinc-950 transition-colors ${
                                  row.servants === "Belum ditugaskan" ? "text-zinc-400 italic" : "text-zinc-700"
                                }`}>
                                  {row.servants}
                                </span>
                              </div>
                            </td>
                            {/* Status tag */}
                            <td className="py-3.5 text-center">
                              <div className="inline-flex items-center justify-center">
                                {row.status === "Konfirmasi" && (
                                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Konfirmasi
                                  </span>
                                )}
                                {row.status === "Pending" && (
                                  <span className="text-xs text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                    <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pending
                                  </span>
                                )}
                                {row.status === "Batal" && (
                                  <span className="text-xs text-rose-600 font-bold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Batal
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Rotation Counter */}
                            <td className="py-3.5 text-right text-xs font-bold text-zinc-400 group-hover:text-zinc-500 transition-colors">
                              {row.lastRotation}
                            </td>
                            {/* Actions swap button */}
                            <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenSwap(row)}
                                className="text-xs font-bold text-zinc-600 bg-white hover:bg-zinc-100 hover:text-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 transition-colors cursor-pointer"
                              >
                                Tukar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workload Rotation (Rotasi Pelayan) Card */}
              {workloads.length > 0 && (
                <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                    ROTASI PELAYAN — DISTRIBUSI BEBAN BULAN INI
                  </div>

                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
                    <h3 className="font-extrabold text-zinc-900 text-base">
                      Frekuensi tugas per pelayan
                    </h3>
                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-3 py-1 rounded-full">
                      AI auto-rotasi
                    </span>
                  </div>

                  {/* Servant Workload Rows */}
                  <div className="space-y-4">
                    {workloads.map((item, idx) => {
                      const dots = [];
                      for (let i = 0; i < 5; i++) {
                        dots.push(i < item.count);
                      }

                      let tagColor = "";
                      if (item.status === "Terlalu sering") tagColor = "bg-rose-50 text-rose-600 border border-rose-100";
                      else if (item.status === "Kurang dipakai") tagColor = "bg-teal-50 text-teal-600 border border-teal-100";
                      else tagColor = "bg-indigo-50 text-indigo-600 border border-indigo-100";

                      const initialAvatar = item.name.split(" ").map(n => n[0]).join("").substring(0, 2);

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-zinc-50 rounded-2xl transition-all border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200">
                              {initialAvatar}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800">{item.name}</div>
                              <div className="text-xs text-zinc-400 mt-0.5">{item.role} - {item.count}x bulan ini</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 mt-3 sm:mt-0">
                            {/* Workload dots indicator */}
                            <div className="flex gap-1.5">
                              {dots.map((active, i) => (
                                <span
                                  key={i}
                                  className={`w-3.5 h-3.5 rounded ${
                                    active
                                      ? item.status === "Terlalu sering"
                                        ? "bg-emerald-500" 
                                        : item.status === "Kurang dipakai"
                                        ? "bg-amber-500"
                                        : item.colorType === "indigo"
                                        ? "bg-indigo-500"
                                        : "bg-blue-500"
                                      : "bg-zinc-200"
                                  }`}
                                ></span>
                              ))}
                            </div>

                            {/* Status label */}
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${tagColor}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Warning Box */}
                  <div className="mt-6 p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 shrink-0 animate-ping"></span>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      <span className="font-extrabold text-purple-900">AI Recommendation:</span> Sistem otomatis menjaga rotasi adil. Pelayan yang terlalu sering bertugas akan dikurangi jadwalnya pada draf ibadah berikutnya untuk pemerataan beban tugas.
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button 
                      onClick={() => setShowAlgorithmModal(true)}
                      className="px-4 py-2 border border-zinc-200 bg-white text-zinc-600 text-xs font-bold rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      Detail algoritma rotasi
                    </button>
                    <button 
                      onClick={() => setShowBlockDatesModal(true)}
                      className="px-4 py-2 border border-zinc-200 bg-white text-zinc-600 text-xs font-bold rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      Blokir tanggal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Column: WA Simulator */}
            <div>
              {/* WA Notification Card */}
              <div className="bg-white border border-zinc-200/60 rounded-[2rem] p-6 shadow-sm text-zinc-900 sticky top-6">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  SIMULASI NOTIFIKASI WA KE PELAYAN
                </div>

                {/* Whatsapp Bubble Header */}
                <div className="p-4 bg-zinc-50 border border-zinc-200/60 rounded-3xl flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <div className="text-xs font-bold text-zinc-500">
                        Bot YeshProduction &rarr; <span className="text-zinc-900 font-extrabold">
                          {selectedRow.servants === "Belum ditugaskan" ? "(Pilih Pelayan)" : selectedRow.servants.split(" - ")[0]}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold">
                      Sabtu, 24 Mei - 18.00
                    </div>
                  </div>

                  {/* Whatsapp Message Text */}
                  <div className="py-4 text-xs text-zinc-700 leading-relaxed font-mono whitespace-pre-line">
                    {selectedRow.servants === "Belum ditugaskan" ? (
                      <span className="text-zinc-400 italic">
                        Belum ada pelayan yang ditugaskan untuk posisi ini. Silakan klik tombol "Tukar" di samping untuk menugaskan pelayan dari database.
                      </span>
                    ) : (
                      `Halo ${selectedRow.servants.split(" - ")[0]}!

Kamu dijadwalkan sebagai *${selectedRow.position}* untuk ibadah umum besok:
📅 Minggu, 25 Mei 2026
⏰ Ibadah pukul 09.00 WIB
📍 GBI Jakarta Pusat

Mohon konfirmasi kehadiranmu ya 🙏`
                    )}
                  </div>

                  {/* Whatsapp Interactive Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-200">
                    <button
                      onClick={() => handleConfirmAttendance("Konfirmasi")}
                      disabled={selectedRow.servants === "Belum ditugaskan"}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-700 text-[11px] font-black rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Hadir — konfirmasi
                    </button>
                    <button
                      onClick={() => handleConfirmAttendance("Batal")}
                      disabled={selectedRow.servants === "Belum ditugaskan"}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-700 text-[11px] font-black rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Tidak bisa hadir
                    </button>
                  </div>
                </div>
                
                <p className="text-[11px] text-zinc-400 mt-4 text-center leading-relaxed">
                  *Klik baris tabel di samping untuk melihat notifikasi WhatsApp pelayan lainnya.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Modal Tambah Jadwal Ibadah Baru */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Jadwal Ibadah Baru
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
              Buat draf sesi ibadah baru. Anda dapat memilih untuk mengisi pelayan secara otomatis menggunakan AI auto-rotasi jemaat.
            </p>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">TANGGAL IBADAH</label>
                <input
                  type="date"
                  required
                  value={newServiceDate}
                  onChange={(e) => setNewServiceDate(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">WAKTU MULAI</label>
                <input
                  type="time"
                  required
                  value={newServiceTime}
                  onChange={(e) => setNewServiceTime(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1.5">JENIS / SESI IBADAH</label>
                <select
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="ibadah umum">Ibadah Umum</option>
                  <option value="ibadah sore">Ibadah Sore</option>
                  <option value="ibadah pemuda">Ibadah Pemuda / Youth</option>
                  <option value="ibadah remaja">Ibadah Remaja</option>
                  <option value="ibadah anak">Ibadah Anak / Sekolah Minggu</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="autoFillCheck"
                  checked={newServiceAutoFill}
                  onChange={(e) => setNewServiceAutoFill(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="autoFillCheck" className="text-xs text-zinc-700 font-bold select-none cursor-pointer">
                  Isi otomatis jadwal menggunakan AI auto-rotasi
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Buat Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Tukar Jadwal */}
      {showSwapModal && swapTargetRow && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Tukar Jadwal Pelayan
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
              Pilih pelayan pengganti yang tersedia untuk menggantikan posisi <span className="font-extrabold text-zinc-900">{swapTargetRow.position}</span> (saat ini: <span className="font-bold text-amber-500">{swapTargetRow.servants}</span>).
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {dbServants.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">Tidak ada pelayan terdaftar di database.</p>
              ) : (
                dbServants
                  .filter((s) => !swapTargetRow.servants.includes(s.name))
                  .map((servant) => {
                    const fakeRot = servant.ministries?.toLowerCase().includes(swapTargetRow.positionKey.toLowerCase())
                      ? "Kompeten - 3 mgg lalu"
                      : "Luar posisi utama - Belum bertugas";

                    return (
                      <button
                        key={servant.id}
                        onClick={() => handleConfirmSwap(servant.name)}
                        className="w-full text-left p-3 bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100 rounded-2xl transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900">{servant.name}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{servant.phone || "No HP tidak ada"}</div>
                        </div>
                        <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2.5 py-1 rounded-full group-hover:bg-zinc-300 group-hover:text-zinc-800 font-bold">
                          {fakeRot}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setShowSwapModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Broadcast WA Progress */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Proses Broadcast WhatsApp Personal
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Mengirimkan notifikasi draf jadwal personal satu per satu kepada masing-masing pelayan terdaftar melalui API Fonnte.
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-100 h-3.5 rounded-full overflow-hidden mb-4 border border-zinc-200 shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${broadcastProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-zinc-400 font-bold mb-4">
              <span>{broadcastProgress === 100 ? "Pengiriman selesai!" : "Sedang memproses..."}</span>
              <span>{broadcastProgress}%</span>
            </div>

            {/* Live Logs console */}
            <div className="h-48 bg-zinc-950 border border-zinc-200 rounded-2xl p-4 font-mono text-xs text-emerald-600 overflow-y-auto space-y-2 scrollbar-thin">
              {broadcastLog.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-500 select-none">&rarr;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end">
              <button
                disabled={isBroadcasting}
                onClick={() => setShowBroadcastModal(false)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  isBroadcasting
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                }`}
              >
                {isBroadcasting ? "Harap Tunggu..." : "Selesai & Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Konfigurasi Posisi */}
      {showPositionsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 3m0-3a2 2 0 110 3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Konfigurasi Posisi Pelayanan Fleksibel
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
              Sistem bersifat dinamis. Gereja Anda bisa mendefinisikan posisi apa saja yang dibutuhkan dan menetapkan batas tugas maksimal per posisi per bulan.
            </p>

            {/* List current positions */}
            <div className="space-y-2 max-h-52 overflow-y-auto mb-5 pr-1 border-b border-zinc-200 pb-5">
              {positions.map((pos, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-zinc-50 border border-zinc-100 rounded-2xl">
                  <span className="text-sm font-bold text-zinc-700">{pos.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Maksimal tugas:</span>
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {pos.maxTasks}x / bln
                    </span>
                    <button
                      onClick={() => setPositions(prev => prev.filter(p => p.name !== pos.name))}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 p-1 hover:bg-rose-50 rounded cursor-pointer"
                      title="Hapus Posisi"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add new position */}
            <form onSubmit={handleAddPosition} className="space-y-4">
              <div className="text-xs font-bold text-zinc-400">TAMBAH POSISI BARU</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Contoh: Soundman, Tim Parkir, Liturgos"
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-zinc-400 whitespace-nowrap">Kuota tugas:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newPositionMax}
                    onChange={(e) => setNewPositionMax(parseInt(e.target.value) || 4)}
                    className="w-16 bg-white border border-zinc-200 rounded-xl px-2 py-2.5 text-center text-sm text-zinc-900 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setShowPositionsModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Detail Algoritma Rotasi */}
      {showAlgorithmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Algoritma Rotasi Pelayan
            </h3>
            <div className="text-xs text-zinc-500 leading-relaxed font-medium space-y-3 mt-4">
              <p>
                Sistem YeshProduction menggunakan algoritma antrean prioritas adil untuk mengusulkan draf jadwal secara otomatis setiap bulannya.
              </p>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2.5 text-zinc-700">
                <div className="flex gap-2">
                  <span className="text-indigo-600 font-extrabold">1.</span>
                  <span>
                    <strong className="text-zinc-900">Batas Maksimum Tugas:</strong> Setiap pelayan memiliki kuota tugas bulanan per posisi agar beban pelayanan terbagi rata.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-indigo-600 font-extrabold">2.</span>
                  <span>
                    <strong className="text-zinc-900">Prioritas Durasi Tunggu:</strong> Sistem mendeteksi siapa pelayan yang paling lama belum bertugas, lalu menempatkan mereka di antrean teratas.
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-indigo-600 font-extrabold">3.</span>
                  <span>
                    <strong className="text-zinc-900">AI Warning Flag:</strong> Sistem memindai riwayat penolakan / ketidakhadiran pelayan untuk menandai distribusi yang tidak merata.
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setShowAlgorithmModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Blokir Tanggal */}
      {showBlockDatesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 text-zinc-900 shadow-2xl relative animate-fade-in-up">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Blokir Tanggal Ketersediaan
            </h3>
            <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
              Pelayan dapat memblokir tanggal tertentu ketika mereka berhalangan (misal: sakit, dinas luar kota, liburan). AI auto-rotasi tidak akan memilih mereka pada tanggal tersebut.
            </p>

            <div className="space-y-2 mb-4">
              <div className="text-xs font-bold text-zinc-400">DAFTAR BLOKIR AKTIF</div>
              {dbServants.length > 0 ? (
                dbServants.slice(0, Math.min(2, dbServants.length)).map((s, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-zinc-700">{s.name}</span>
                      <span className="text-zinc-500 ml-1.5">&rarr; {idx === 0 ? "31 Mei 2026 (Dinas Luar)" : "07 Juni 2026 (Keluar Kota)"}</span>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      Sistem Lock
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 italic">Belum ada tanggal pelayanan yang diblokir oleh pelayan.</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setShowBlockDatesModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
