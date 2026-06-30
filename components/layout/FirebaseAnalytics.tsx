"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { firebaseApp } from "@/lib/firebase";

export function FirebaseAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    isSupported().then((yes) => {
      if (!yes) return;
      const analytics = getAnalytics(firebaseApp);
      logEvent(analytics, "page_view", { page_path: pathname });
    });
  }, [pathname]);

  return null;
}
