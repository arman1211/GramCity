import { toast } from "sonner";

import { ApiClientError } from "@/lib/api";

export function toastApiError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiClientError) {
    toast.error(error.message);
    return;
  }
  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }
  toast.error(fallback);
}
