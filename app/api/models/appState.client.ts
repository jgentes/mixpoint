// This file handles application state that may be persisted to local storage.
import { proxy, ref, snapshot } from 'valtio'
import { devtools, proxySet, watch } from 'valtio/utils'
import { db } from '~/api/handlers/dbHandlers'
import type {
  AudioState,
  MixState,
  Track,
  UiState,
  UserState,
} from '~/api/models/appModels'
import { Env } from '~/utils/env'

// AudioState captures ephemeral state of a mix, while persistent state is stored in IndexedDB
const audioState = proxy<{
  [trackId: Track['id']]: AudioState
}>({})

const uiState = proxy<UiState>({
  search: '',
  selected: proxySet(),
  rowsPerPage: 10,
  page: 1,
  showButton: null,
  openDrawer: false,
  dropZoneLoader: false,
  processing: false,
  analyzing: proxySet(),
  stemsAnalyzing: proxySet(),
  syncTimer: undefined,
  userEmail: '',
  modal: { openState: false },
})

let mixState = proxy<MixState>()
let userState = proxy<UserState>()

const clearAppState = async () => await db.appState.clear()

const initAudioState = async () => {
  // Pull latest persistent state from Dexie and populate Valtio store
  let seeded = false
  const initialMixState = ((await db.appState.get('mixState')) as MixState) || {
    tracks: [],
    trackState: {},
  }
  mixState = proxy(initialMixState)

  watch(get => {
    get(mixState)
    //@ts-ignore dexie typescript failure
    if (seeded) db.appState.put(snapshot(mixState), 'mixState')
  })

  let initialUserState = (await db.appState.get('userState')) as UserState
  // ensure that we ref the stemsDirHandle
  if (initialUserState?.stemsDirHandle)
    initialUserState = {
      ...initialUserState,
      stemsDirHandle: ref(initialUserState.stemsDirHandle),
    }
  userState = proxy(initialUserState)

  watch(get => {
    get(userState)
    //@ts-ignore dexie typescript failure
    if (seeded) db.appState.put(snapshot(userState), 'userState')
  })

  seeded = true

  if (Env === 'development') {
    devtools(uiState, { name: 'uiState', enable: true })
    devtools(mixState, { name: 'mixState', enable: true })
    devtools(userState, { name: 'userState', enable: true })
    // audioState waveforms cause memory issues in devtools
  }

  // Start audioState init (if we have a mix in localstorage (valtio))
  const tracks = snapshot(mixState.tracks)
  console.log('audioStateinit:', tracks)
  if (tracks?.length) {
    for (const trackId of tracks) {
      audioState[Number(trackId)] = {}
    }
  }
}

initAudioState()

export { clearAppState, uiState, audioState, mixState, userState }
