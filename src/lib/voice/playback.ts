/**
 * Manages a gapless audio playback queue for streaming PCM audio
 * from the Gemini Live API (24kHz, Int16 PCM → Float32 → AudioContext)
 */
export class AudioPlaybackQueue {
  private ctx: AudioContext
  private gainNode: GainNode
  private nextStartTime: number = 0
  private sampleRate: number
  private activeSources = new Set<AudioBufferSourceNode>()

  constructor(ctx: AudioContext, sampleRate = 24000) {
    this.ctx = ctx
    this.sampleRate = sampleRate
    // Route all audio through a gain node to prevent output clipping
    this.gainNode = ctx.createGain()
    this.gainNode.gain.value = 0.75
    this.gainNode.connect(ctx.destination)
  }

  enqueue(int16Data: Int16Array) {
    const float32 = new Float32Array(int16Data.length)
    for (let i = 0; i < int16Data.length; i++) {
      float32[i] = int16Data[i] / 32768
    }

    const buffer = this.ctx.createBuffer(1, float32.length, this.sampleRate)
    buffer.copyToChannel(float32, 0)

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.gainNode)

    // Track active nodes so we can stop them, and auto-remove when done
    this.activeSources.add(source)
    source.onended = () => {
      this.activeSources.delete(source)
    }

    const now = this.ctx.currentTime
    const startAt = Math.max(now, this.nextStartTime)
    source.start(startAt)
    this.nextStartTime = startAt + buffer.duration
  }

  stop() {
    // Stop and release all scheduled/active source nodes immediately
    for (const source of this.activeSources) {
      try { source.stop() } catch { /* already stopped */ }
      source.disconnect()
    }
    this.activeSources.clear()
    this.nextStartTime = 0
  }
}
