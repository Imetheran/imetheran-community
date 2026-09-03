"use client";

import { useEffect } from "react";

export const NOTIFICATION_COUNT_EVENT = "imetheran:notification-count";

export function NotificationCountSync({ count }: { count: number }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_COUNT_EVENT, { detail: { count } }));
  }, [count]);

  return null;
}
