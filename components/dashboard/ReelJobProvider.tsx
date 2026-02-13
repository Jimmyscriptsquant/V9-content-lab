"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import toast from "react-hot-toast";

// ── Types ────────────────────────────────────────────────────
export interface ReelScene {
  sceneNumber: number;
  taskId: string;
  prompt: string;
  duration: number;
  status: "processing" | "complete" | "failed";
  videoUrl?: string;
}

export interface ReelJob {
  id: string; // unique job id
  title: string;
  hook?: string;
  plan: any; // the full reelPlan object
  scenes: ReelScene[];
  status: "processing" | "ready" | "failed";
  createdAt: number;
}

interface ReelJobContextValue {
  jobs: ReelJob[];
  activeJob: ReelJob | null;
  addJob: (job: ReelJob) => void;
  updateJob: (jobId: string, updater: (job: ReelJob) => ReelJob) => void;
  removeJob: (jobId: string) => void;
  setActiveJobId: (id: string | null) => void;
  activeJobId: string | null;
}

const ReelJobContext = createContext<ReelJobContextValue | null>(null);

export function useReelJobs() {
  const ctx = useContext(ReelJobContext);
  if (!ctx) throw new Error("useReelJobs must be used within ReelJobProvider");
  return ctx;
}

// ── LocalStorage helpers ─────────────────────────────────────
const STORAGE_KEY = "v9_reel_jobs";

function loadJobs(): ReelJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: ReelJob[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch { /* quota exceeded, ignore */ }
}

// ── Provider ─────────────────────────────────────────────────
export default function ReelJobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<ReelJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadJobs();
    setJobs(loaded);
    setInitialized(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (initialized) saveJobs(jobs);
  }, [jobs, initialized]);

  const addJob = useCallback((job: ReelJob) => {
    setJobs((prev) => [...prev.filter((j) => j.id !== job.id), job]);
    setActiveJobId(job.id);
  }, []);

  const updateJob = useCallback(
    (jobId: string, updater: (job: ReelJob) => ReelJob) => {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updater(j) : j)));
    },
    []
  );

  const removeJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setActiveJobId((prev) => (prev === jobId ? null : prev));
  }, []);

  const activeJob = jobs.find((j) => j.id === activeJobId) || null;

  // ── Background polling for all processing jobs ─────────────
  useEffect(() => {
    const processingJobs = jobs.filter((j) => j.status === "processing");
    if (processingJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of processingJobs) {
        const processingScenes = job.scenes.filter(
          (s) => s.status === "processing"
        );
        if (processingScenes.length === 0) continue;

        for (const scene of processingScenes) {
          try {
            const res = await fetch(
              `/api/v1/generate?taskId=${scene.taskId}`
            );
            const data = await res.json();
            if (!data.success) continue;

            const taskStatus = data.data?.status;

            if (taskStatus === "succeed" || taskStatus === "completed") {
              const videoUrl = data.data?.videoUrl;
              updateJob(job.id, (j) => {
                const newScenes = j.scenes.map((s) =>
                  s.taskId === scene.taskId
                    ? { ...s, status: "complete" as const, videoUrl }
                    : s
                );
                const allDone = newScenes.every(
                  (s) => s.status === "complete" || s.status === "failed"
                );
                const allComplete = newScenes.every(
                  (s) => s.status === "complete"
                );
                const newStatus = allDone
                  ? allComplete
                    ? "ready"
                    : "failed"
                  : "processing";

                // Toast when entire reel finishes
                if (allDone && j.status === "processing") {
                  if (allComplete) {
                    toast.success(
                      `Reel "${j.title}" is ready! All ${newScenes.length} scenes complete.`,
                      { duration: 8000, id: `reel-done-${j.id}` }
                    );
                  } else {
                    toast.error(
                      `Reel "${j.title}" finished with some failed scenes.`,
                      { duration: 8000, id: `reel-done-${j.id}` }
                    );
                  }
                }

                return {
                  ...j,
                  scenes: newScenes,
                  status: newStatus as ReelJob["status"],
                };
              });
            } else if (taskStatus === "failed") {
              updateJob(job.id, (j) => {
                const newScenes = j.scenes.map((s) =>
                  s.taskId === scene.taskId
                    ? { ...s, status: "failed" as const }
                    : s
                );
                const allDone = newScenes.every(
                  (s) => s.status === "complete" || s.status === "failed"
                );

                if (allDone && j.status === "processing") {
                  toast.error(
                    `Reel "${j.title}" finished with errors.`,
                    { duration: 8000, id: `reel-done-${j.id}` }
                  );
                }

                return {
                  ...j,
                  scenes: newScenes,
                  status: allDone ? "failed" : "processing",
                };
              });
            }
          } catch {
            // Network error, retry next interval
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobs, updateJob]);

  return (
    <ReelJobContext.Provider
      value={{
        jobs,
        activeJob,
        addJob,
        updateJob,
        removeJob,
        setActiveJobId,
        activeJobId,
      }}
    >
      {children}
    </ReelJobContext.Provider>
  );
}
