"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon="warning"
      title="This page failed to load"
      description={
        error.digest
          ? `An unexpected error occurred (reference ${error.digest}). Try again, or check the server logs.`
          : "An unexpected error occurred. Try again, or check the server logs."
      }
      action={
        <Button icon="refresh" onClick={() => unstable_retry()}>
          Try again
        </Button>
      }
    />
  );
}
