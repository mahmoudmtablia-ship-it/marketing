"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

function formatPrice(value: number | null) {
  if (value === null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function PriceAlertButton({
  productId,
  initialActive,
  targetPrice,
  className,
}: {
  productId: string;
  initialActive: boolean;
  targetPrice: number | null;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const [isActive, setIsActive] = useState(initialActive);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname || `/product/${productId}`)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(isActive ? `/api/alerts?productId=${productId}` : "/api/alerts", {
        method: isActive ? "DELETE" : "POST",
        headers: isActive
          ? undefined
          : {
              "Content-Type": "application/json",
            },
        body: isActive ? undefined : JSON.stringify({ productId, targetPrice }),
      });

      const payload = (await response.json()) as {
        error?: string;
        active?: boolean;
        alert?: { isActive?: boolean };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Alert action failed.");
      }

      setIsActive(payload.alert?.isActive ?? payload.active ?? !isActive);
    } catch (actionError) {
      console.error("[PRICE_ALERT_BUTTON_ERROR]", actionError);
      setError(actionError instanceof Error ? actionError.message : "Alert action failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className={className} onClick={handleClick} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Bell className={`mr-2 h-4 w-4 ${isActive ? "fill-current" : ""}`} />
        )}
        {isActive ? "Alert Active" : "Track Price Drop"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {isActive
          ? "We will flag this product in your dashboard until the alert is disabled."
          : targetPrice
            ? `Creates an alert around ${formatPrice(targetPrice)}.`
            : "Create an alert for the next live price change."}
      </p>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
