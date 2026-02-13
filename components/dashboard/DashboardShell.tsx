"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import ReelJobProvider from "./ReelJobProvider";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <ReelJobProvider>
      <Toaster position="top-right" />
      {children}
    </ReelJobProvider>
  );
}
