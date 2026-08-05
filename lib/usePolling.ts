import { useCallback, useEffect, useRef, useState } from "react";
import type { JobStatus } from "@/types/api";

interface UsePollingOptions<T> {
  /** Function that fetches the current job state. Called every `intervalMs`. */
  getter: () => Promise<T>;
  /** How often to poll in milliseconds. Default: 1000 */
  intervalMs?: number;
  /** Whether to start polling immediately. Set to false to delay start. */
  enabled?: boolean;
  /** Called with each response — use to extract status from the raw response. */
  getStatus: (data: T) => JobStatus;
}

interface UsePollingResult<T> {
  data: T | null;
  status: JobStatus | null;
  error: string | null;
  isPolling: boolean;
}

/**
 * Polls `getter` every `intervalMs` until the returned status is "done" or "error".
 * Automatically stops polling when a terminal state is reached.
 * Cleans up on unmount.
 */
export function usePolling<T>({
  getter,
  intervalMs = 1000,
  enabled = true,
  getStatus,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isMountedRef.current) setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    try {
      const result = await getter();
      if (!isMountedRef.current) return;

      setData(result);
      const currentStatus = getStatus(result);
      setStatus(currentStatus);

      if (currentStatus === "done" || currentStatus === "error") {
        stop();
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : "Polling failed");
      setStatus("error");
      stop();
    }
  }, [getter, getStatus, stop]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) return;

    setIsPolling(true);
    // Poll immediately, then on interval
    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      isMountedRef.current = false;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs]);

  return { data, status, error, isPolling };
}
