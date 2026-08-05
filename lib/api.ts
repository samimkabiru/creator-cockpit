/**
 * API barrel file.
 *
 * All components import from here — never from mock-api.ts directly.
 * Switching to the real backend later is a one-line change in this file.
 */

export {
  startProcessJob,
  getProcessJob,
  startThumbnailJob,
  getThumbnailJob,
} from "./mock-api";
