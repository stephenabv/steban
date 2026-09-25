"use client";

import { useEffect } from "react";
import { StatusView } from "@/components/layout/StatusView";
import { Button } from "@/components/ui/Button";

export default function PublicError({
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
    <StatusView
      title="Something went wrong"
      description="This page couldn't be loaded right now. It's usually temporary — please try again."
      actions={
        <>
          <Button icon="refresh" onClick={() => unstable_retry()}>
            Try again
          </Button>
          <Button href="/" variant="secondary">
            Back to home
          </Button>
        </>
      }
    />
  );
}
