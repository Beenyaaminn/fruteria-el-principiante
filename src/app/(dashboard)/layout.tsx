import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KeepAlivePing } from "@/components/keep-alive-ping";
import { getCurrentUser } from "@/lib/dal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <KeepAlivePing />
      <Sidebar role={user?.role || "CAJERO"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
