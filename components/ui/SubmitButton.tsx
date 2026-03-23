"use client";

import { useFormStatus } from "react-dom";
import LoadingButton from "./LoadingButton";

export default function SubmitButton({
  defaultText = "Submit",
  loadingText = "Processing...",
  className = "",
  variant = "primary",
}: {
  defaultText?: string;
  loadingText?: string;
  className?: string;
  variant?: "primary" | "danger" | "secondary";
}) {
  // This automatically detects if the parent <form> is submitting!
  const { pending } = useFormStatus();

  return (
    <LoadingButton
      type="submit"
      isLoading={pending}
      defaultText={defaultText}
      loadingText={loadingText}
      className={className}
      variant={variant}
    />
  );
}
