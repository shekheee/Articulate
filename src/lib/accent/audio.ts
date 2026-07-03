/** Browser-safe base64 encoding for large ArrayBuffers (avoids spread limit). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return arrayBufferToBase64(await blob.arrayBuffer())
}

/** Pick a MediaRecorder mime type supported by this browser. */
export function getSupportedRecordingMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ]
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return 'audio/webm'
}

export function extensionForMime(mime: string): string {
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

export const MIN_RECORDING_MS = 400
export const MAX_RECORDING_MS = 30_000
export const SILENCE_STOP_MS = 2200
export const SPEECH_RMS_THRESHOLD = 0.012
