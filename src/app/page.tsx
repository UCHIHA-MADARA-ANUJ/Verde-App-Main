"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/pages/Dashboard";

export default function HomePage() {
  return (
    <AppShell>
      <Header />
      <Dashboard />
    </AppShell>
  );
}
