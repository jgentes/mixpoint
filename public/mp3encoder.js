;(function () {
  'use strict'

  console.log('MP3 conversion worker started.')
  importScripts('/lame.min.js')

  let mp3Encoder,
    maxSamples = 1152,
    wav,
    samplesLeft,
    dataBuffer,
    samplesRight

  const clearBuffer = () => (dataBuffer = [])

  const appendToBuffer = mp3Buf => dataBuffer.push(new Int8Array(mp3Buf))

  const init = () => clearBuffer()

  const encode = arrayBuffer => {
    wav = lamejs.WavHeader.readHeader(new DataView(arrayBuffer))

    if (!wav) {
      self.postMessage({
        cmd: 'error',
        msg: 'Specified file is not a Wave file',
      })
      return
    }

    const dataView = new Int16Array(
      arrayBuffer,
      wav.dataOffset,
      wav.dataLen / 2
    )
    samplesLeft =
      wav.channels === 1
        ? dataView
        : new Int16Array(wav.dataLen / (2 * wav.channels))
    samplesRight =
      wav.channels === 2
        ? new Int16Array(wav.dataLen / (2 * wav.channels))
        : undefined
    if (wav.channels > 1) {
      for (let i = 0; i < samplesLeft.length; i++) {
        samplesLeft[i] = dataView[i * 2]
        samplesRight[i] = dataView[i * 2 + 1]
      }
    }

    mp3Encoder = new lamejs.Mp3Encoder(wav.channels, wav.sampleRate, 44100)

    let remaining = samplesLeft.length
    for (let i = 0; remaining >= maxSamples; i += maxSamples) {
      const left = samplesLeft.subarray(i, i + maxSamples)
      let right
      if (samplesRight) {
        right = samplesRight.subarray(i, i + maxSamples)
      }
      const mp3buf = mp3Encoder.encodeBuffer(left, right)
      appendToBuffer(mp3buf)
      remaining -= maxSamples
      if (i % 100 === 0) {
        self.postMessage({
          cmd: 'progress',
          progress: 1 - remaining / samplesLeft.length,
        })
      }
    }
  }

  const finish = () => {
    if (!wav || !mp3Encoder) return

    const mp3buf = mp3Encoder.flush()
    appendToBuffer(mp3buf)
    self.postMessage({
      cmd: 'end',
      buf: dataBuffer,
    })

    clearBuffer() //free up memory
  }

  self.onmessage = e => {
    switch (e.data.cmd) {
      case 'init':
        init(e.data.config)
        break

      case 'encode':
        encode(e.data.rawInput)
        break

      case 'finish':
        finish()
        break
    }
  }
})()
