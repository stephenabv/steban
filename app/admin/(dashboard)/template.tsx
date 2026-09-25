/** Replays the route transition for each admin page inside the persistent shell. */
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="route-page">{children}</div>;
}
