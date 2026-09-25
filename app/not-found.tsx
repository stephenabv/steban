import type { Metadata } from "next";
import { StatusView } from "@/components/layout/StatusView";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1}>
      <StatusView
        fullScreen
        code="404"
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        actions={
          <>
            <Button href="/" icon="arrow-left">
              Back to home
            </Button>
            <Button href="/projects" variant="secondary">
              Browse projects
            </Button>
          </>
        }
      />
    </main>
  );
}
