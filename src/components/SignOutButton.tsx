"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full"
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
