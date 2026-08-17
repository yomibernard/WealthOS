import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AdviserShellNav } from "@/components/shell/AdviserShellNav";

export default async function AdviserLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "ADVISER" && user.role !== "ADMIN") redirect("/app");

  return (
    <div className="app-shell min-h-[100dvh] bg-transparent">
      <AdviserShellNav name={user.name} />
      <div className="pb-10">{children}</div>
    </div>
  );
}
