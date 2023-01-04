import { getStemContext } from '~/api/audioHandlers'
import { Track } from '~/api/db/dbHandlers'
import { eventHandler } from './eventHandler'

type StemEvent = 'play' | 'destroy'

const stemEvent = eventHandler<StemEvent>()

const initStemEvents = async (trackId: Track['id']): Promise<void> => {
  if (!trackId) return

  let { stemContext, stemBuffers } = (await getStemContext(trackId)) || {}

  const stemEvents = {
    play: ({
      stem,
    }: {
      stem: 'bass' | 'drums' | 'vocals' | 'other' | 'all'
    }) => {
      if (!stemContext || !stemBuffers) return
      if (stem == 'all') {
        window.setTimeout(() => {
          const startTime = stemContext?.currentTime
          for (const buffer of Object.values(stemBuffers!)) {
            buffer.start(startTime)
          }
        }, 0)
      }
    },
    destroy: () => {
      stemContext = null
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
