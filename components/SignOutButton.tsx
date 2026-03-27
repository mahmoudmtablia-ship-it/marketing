"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export default function SignOutButton(props: Omit<ButtonProps, "onClick">) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      void signOut({ callbackUrl: "/" });
    });
  }

  return (
    <Button {...props} onClick={handleClick} disabled={props.disabled || isPending}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span className="ml-2">Sign Out</span>
    </Button>
  );
}
