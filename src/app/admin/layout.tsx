import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AdminShellNav } from "@/components/shell/AdminShellNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADMIN") redirect("/app");

  return (
    <div className="app-shell min-h-[100dvh] bg-transparent">
      <AdminShellNav name={user.name} />
      <div className="pb-10">{children}</div>
    </div>
  );
}
