/**
 * Re-mounts on every public navigation, replaying the fade-up route transition
 * (`.route-page` in styles/globals.less; disabled under reduced motion).
 */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-page">{children}</div>;
}
