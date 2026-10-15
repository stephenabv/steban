"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/** Set on <html> once the first client-side navigation commits. */
export const ROUTE_TRANSITIONS_ATTRIBUTE = "data-route-transitions";

/**
 * Arms the `.route-page` enter animation (styles/globals.less) only after the
 * first in-app navigation. On the initial document load the page must paint
 * at full opacity: Chrome reports Largest Contentful Paint for content inside
 * an opacity animation only once it ends, which held mobile LCP back by ~1 s.
 *
 * A layout effect sets the attribute before the browser paints the commit that
 * changed the route, so the incoming page still animates on that navigation.
 */
export function RouteTransitions() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (pathname !== initialPathname.current) {
      document.documentElement.setAttribute(ROUTE_TRANSITIONS_ATTRIBUTE, "");
    }
  }, [pathname]);

  return null;
}
