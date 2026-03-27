"use client";

import { useEffect } from "react";

export default function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
      signal: controller.signal,
    }).catch((error) => {
      if (controller.signal.aborted) {
        return;
      }

      console.error("[PRODUCT_VIEW_TRACKER_ERROR]", error);
    });

    return () => controller.abort();
  }, [productId]);

  return null;
}
