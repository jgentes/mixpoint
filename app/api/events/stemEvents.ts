import { getStemContext } from '~/api/audioHandlers'
import { Track } from '~/api/db/dbHandlers'
import { eventHandler } from './eventHandler'

type StemEvent = 'play' | 'pause' | 'destroy'

const stemEvent = eventHandler<StemEvent>()

const initStemEvents = async (trackId: Track['id']): Promise<void> => {
  if (!trackId) return

  let { stemBuffers } = (await getStemContext(trackId)) || {}
  let stemContext: AudioContext

  const stemEvents = {
    play: ({ offset = 0 }: { offset?: number }) => {
      if (!stemBuffers) return

      // Build the audioContext every time because once started (played),
      // it must be closed and recreated before it can be started again
      stemContext = new AudioContext()

      // use setTimeout to ensure synchronized start time of all stems
      window.setTimeout(() => {
        const startTime = stemContext?.currentTime
        for (const buffer of Object.values(stemBuffers!)) {
          const source = stemContext.createBufferSource()
          source.buffer = buffer
          source.connect(stemContext.destination)
          source.start(startTime, offset)
        }
      }, 0)
    },
    pause: () => stemContext?.close(),
    destroy: () => {
      stemContext.close()
      stemBuffers = null
    },
  }

  const stemEventHandler = ({
    type,
    args,
  }: {
    type: StemEvent
    args?: any
  }) => {
    console.log('stemEventHandler', type, args)
    stemEvents[type](args)
  }

  // add event listener
  stemEvent.on(`${trackId}-stems`, stemEventHandler)
}

export { stemEvent, initStemEvents }
