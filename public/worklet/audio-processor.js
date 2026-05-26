/**
 * AudioWorkletProcessor: captures microphone PCM, downsamples to 16kHz,
 * and emits Int16Array chunks every ~100ms.
 * Loaded as a module worklet from /worklet/audio-processor.js
 */
class PCMAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = []
    this._targetSampleRate = 16000
    this._chunkSamples = 1600 // 100ms at 16kHz
    this._accumulated = 0
    this._ratio = sampleRate / this._targetSampleRate
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channelData = input[0] // Float32Array, one channel

    // Downsample via linear interpolation
    const downsampled = this._downsample(channelData, this._ratio)

    for (let i = 0; i < downsampled.length; i++) {
      this._buffer.push(downsampled[i])
    }

    // Emit chunks
    while (this._buffer.length >= this._chunkSamples) {
      const chunk = this._buffer.splice(0, this._chunkSamples)
      const int16 = new Int16Array(chunk.length)
      for (let i = 0; i < chunk.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, Math.round(chunk[i] * 32767)))
      }
      this.port.postMessage({ type: 'pcm', data: int16.buffer }, [int16.buffer])
    }

    return true
  }

  _downsample(input, ratio) {
    const outputLength = Math.floor(input.length / ratio)
    const output = new Float32Array(outputLength)
    for (let i = 0; i < outputLength; i++) {
      const srcIdx = i * ratio
      const lo = Math.floor(srcIdx)
      const hi = Math.min(lo + 1, input.length - 1)
      const t = srcIdx - lo
      output[i] = input[lo] * (1 - t) + input[hi] * t
    }
    return output
  }
}

registerProcessor('pcm-audio-processor', PCMAudioProcessor)
