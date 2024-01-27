import { useEffect } from 'react'
import { type WaveSurferOptions } from 'wavesurfer.js'
import { audioEvents } from '~/api/audioEvents.client'
import { audioState, getAppState, setAppState } from '~/api/db/appState.client'
import { STEMS, Stem, Track, db, getTrackPrefs } from '~/api/db/dbHandlers'
import { initWaveform } from '~/api/renderWaveform.client'
import StemAccessButton from '~/components/mixes/StemAccessButton.client'
import { StemControl } from '~/components/tracks/Controls'
import { errorHandler } from '~/utils/notifications'

const StemPanel = ({ trackId }: { trackId: Track['id'] }) => {
	if (!trackId) throw errorHandler('No track ID provided to StemPanel')

	const [stemState] = audioState[trackId].stemState()

	// check stems on disk to determine component state
	useEffect(() => {
		const initStems = async () => {
			// if stems exist, generate waveforms for each
			if (stemState === 'ready') {
				const { stems: stemCache } = (await db.trackCache.get(trackId)) || {}

				if (stemCache) {
					for (const [stem, { file }] of Object.entries(stemCache)) {
						if (!file) continue

						const waveformConfig: WaveSurferOptions = {
							container: `#zoomview-container_${trackId}_${stem}`,
							height: 17,
							fillParent: true,
							hideScrollbar: true,
							barWidth: 1,
							normalize: true
						}

						await initWaveform({
							trackId,
							file,
							stem: stem as Stem,
							waveformConfig
						})
					}
				}

				// if zoom is set to a stem, use the stem cache to redraw the primary waveform with the stem
				const { stemZoom } = (await getTrackPrefs(trackId)) || {}
				if (stemZoom) audioEvents.stemZoom(trackId, stemZoom)
			}
		}

		// prevent duplication on re-render while loading
		const [analyzingTracks] = getAppState.stemsAnalyzing()
		const analyzing = analyzingTracks.has(trackId)

		if (!analyzing) initStems()

		// add stems to analyzing state
		setAppState.stemsAnalyzing(prev => prev.add(trackId))

		return () => audioEvents.destroyStems(trackId)
	}, [trackId, stemState])

	return stemState !== 'ready' ? (
		<StemAccessButton trackId={trackId} />
	) : (
		<div className="flex flex-col gap-1 p-2 mb-3 rounded border-1 border-divider bg-background">
			{STEMS.map(stem => (
				<StemControl key={stem} trackId={trackId} stemType={stem as Stem} />
			))}
		</div>
	)
}

export { StemPanel as default }
