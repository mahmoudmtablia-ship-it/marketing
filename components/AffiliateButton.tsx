"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type AffiliateButtonProps = Omit<ButtonProps, "onClick"> & {
  productId: string;
  sourceAgent: string;
  sourceId?: string;
  userId?: string;
  children: ReactNode;
};

export default function AffiliateButton({
  productId,
  sourceAgent,
  sourceId,
  userId,
  children,
  disabled,
  ...props
}: AffiliateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          sourceAgent,
          sourceId,
          userId,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.destination) {
        throw new Error(payload.error ?? "Unable to route affiliate click.");
      }

      window.location.assign(payload.destination);
    } catch (error) {
      console.error("[AFFILIATE_REDIRECT_ERROR]", error);
      setIsLoading(false);
    }
  }

  return (
    <Button {...props} disabled={disabled || isLoading} onClick={handleClick}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}
