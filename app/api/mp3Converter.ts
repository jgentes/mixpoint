const convertWav = (
  blob: Blob,
  onSuccess: Function,
  onProgress: Function,
  onError: Function
) => {
  const mp3Worker = new Worker('/workers/mp3encoder.js')

  const fileReader = new FileReader()

  fileReader.onload = e => {
    mp3Worker.postMessage({ cmd: 'init' })
    mp3Worker.postMessage({ cmd: 'encode', rawInput: e?.target?.result })
    mp3Worker.postMessage({ cmd: 'finish' })

    mp3Worker.onmessage = async e => {
      switch (e.data.cmd) {
        case 'error':
          onError('Error converting to MP3: ' + e.data.msg)
          break

        case 'progress':
          onProgress(e.data.progress)
          break

        case 'end':
          const mp3Blob = new Blob(e.data.buf, { type: 'audio/mp3' })
          onProgress(1)
          await onSuccess(mp3Blob)
      }
    }
  }

  fileReader.readAsArrayBuffer(blob)
}

export { convertWav }
