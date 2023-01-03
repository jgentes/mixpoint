import { getStemContext } from '~/api/audioHandlers'
import { Track } from '~/api/dbHandlers'

const stemEventTypes = ['play'] as const
type StemEvent = typeof stemEventTypes[number]

const stemEvent = {
  on(trackId: number, callback: Function) {
    window.addEventListener(String(trackId), (e: CustomEventInit) =>
      callback(e.detail)
    )
  },
  emit(trackId: number, event: StemEvent, args?: any) {
    window.dispatchEvent(
      new CustomEvent(String(trackId), { detail: { event, args } })
    )
  },
  off(trackId: number, callback: any) {
    window.removeEventListener(String(trackId), callback)
  },
}

const loadStemEvents = async ({
  trackId,
  audioStems,
}: {
  trackId: Track['id']
  audioStems: AudioContext[]
}): Promise<void> => {
  if (!trackId) return

  const { stemContext, stemBuffers } = (await getStemContext(trackId)) || {}

  if (!stemContext || !stemBuffers) return

  const playEvent = () => {
    window.setTimeout(() => {
      const startTime = stemContext.currentTime
      for (const source of stemBuffers) {
        source.start(startTime)
      }
    }, 0)
  }

  const stemEvents = ({ event, args }: { event: StemEvent; args?: any }) => {
    switch (event) {
      case 'play':
        playEvent()
        break
    }
  }

  // add event listener
  stemEvent.on(trackId, stemEvents)
}

export { stemEvent, loadStemEvents }
