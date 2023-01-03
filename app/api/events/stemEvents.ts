import { getStemContext } from '~/api/audioHandlers'
import { Track } from '~/api/db/dbHandlers'
import { eventHandler } from './eventHandler'

type StemEvent = 'play'

const stemEvent = eventHandler<StemEvent>()

const initStemEvents = async ({
  trackId,
  audioStems,
}: {
  trackId: Track['id']
  audioStems: AudioContext[]
}): Promise<void> => {
  if (!trackId) return

  const { stemContext, stemBuffers } = (await getStemContext(trackId)) || {}

  if (!stemContext || !stemBuffers) return

  const stemEvents = {
    play: ({}) => {
      window.setTimeout(() => {
        const startTime = stemContext.currentTime
        for (const source of stemBuffers) {
          source.start(startTime)
        }
      }, 0)
    },
  }

  const stemEventHandler = ({
    event,
    args,
  }: {
    event: StemEvent
    args?: any
  }) => stemEvents[event](args)

  // add event listener
  stemEvent.on(trackId, stemEventHandler)
}

export { stemEvent, initStemEvents }
