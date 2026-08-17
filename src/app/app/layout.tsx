import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { CommandPalette } from "@/components/CommandPalette";
import { getSessionUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role === "ADVISER") redirect("/adviser");
  if (user.role === "ADMIN") redirect("/admin");

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="page">
        <div className="command-bar print:hidden">
          <CommandPalette />
        </div>
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
