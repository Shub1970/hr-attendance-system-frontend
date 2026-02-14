import { NavSidebar } from "@/components/nav-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent md:flex">
      <NavSidebar />
      <main className="w-full p-4 md:p-8">{children}</main>
    </div>
  );
}
