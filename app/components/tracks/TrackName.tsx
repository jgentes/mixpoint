import { useLiveQuery } from 'dexie-react-hooks'
import { db, Track } from '~/api/dbHandlers'

const TrackName = (trackId: Track['id']) => {
  if (!trackId) return null

  const track = useLiveQuery(() => db.tracks.get(trackId), [trackId]) || {}
  if (!track.name) return 'Loading...'
  return track.name.replace(/\.[^/.]+$/, '')
}

export { TrackName as default }
