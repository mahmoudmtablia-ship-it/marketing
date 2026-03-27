"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SaveProductButton({
  productId,
  initialSaved,
  className,
}: {
  productId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const [isSaved, setIsSaved] = useState(initialSaved);
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
      const response = await fetch(isSaved ? `/api/favorites?productId=${productId}` : "/api/favorites", {
        method: isSaved ? "DELETE" : "POST",
        headers: isSaved
          ? undefined
          : {
              "Content-Type": "application/json",
            },
        body: isSaved ? undefined : JSON.stringify({ productId }),
      });

      const payload = (await response.json()) as { error?: string; saved?: boolean };
      if (!response.ok) {
        throw new Error(payload.error ?? "Favorite action failed.");
      }

      setIsSaved(payload.saved ?? !isSaved);
    } catch (actionError) {
      console.error("[SAVE_PRODUCT_BUTTON_ERROR]", actionError);
      setError(actionError instanceof Error ? actionError.message : "Favorite action failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={handleClick}
        disabled={isLoading}
        aria-pressed={isSaved}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        )}
        {isSaved ? "Saved" : "Save Product"}
      </Button>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
