import { Stems, getAudioState, setAudioState } from '~/api/db/appState'
import { Stem, Track, db, storeTrackCache } from '~/api/db/dbHandlers'
import { getStemsDirHandle } from '~/api/fileHandlers'
import { convertWav } from '~/api/mp3Converter'
import { errorHandler } from '~/utils/notifications'

const START_ENDPOINT = 'https://stemproxy.jgentes.workers.dev/start'
const CHECK_ENDPOINT = 'https://stemproxy.jgentes.workers.dev/check'

type BananaStartRequest = {
	id?: string // some uuid to identify the payload
	created?: number // the current Unix timestamp in seconds
	apiKey?: string // your api key, for authorization
	modelKey?: string // the key giving you access to this model
	startOnly?: boolean // tell backend to return a callID immediately, without awaiting results. Defaults to false.
	modelInputs: {
		fineTuned?: boolean // tell backend to use the fine-tuned model. Defaults to false.
		mp3?: boolean // if true, the backend will convert the resulting files to mp3. Defaults to false (ie. return .wav files)
		file: {
			name: string // the full filename with extension
			data: string // the base64 encoded file data
		}
	}
}

type BananaStartResponse = {
	id: string // the return payload id
	message: string // success or server error messages. Our API does not throw 500 errors, so always check this field for the substring "error" to catch errors
	created: number // the current Unix timestamp in seconds
	apiVersion: string // identifier on which backend was used, to help us debug
	callID: string // the async call ID used on the /check/v4 call to see the task's status
	finished: boolean // a boolean to communicate that the inference is finished and you can expect values in the modelOutputs field
	modelOutputs: {
		name: string
		data: { name: Stems; data: string }[]
	}[] // an array of objects containing the name of the file and the base64 encoded data for each audio stem
}

type BananaCheckRequest = {
	id?: BananaStartRequest['id']
	created?: BananaStartRequest['created']
	apiKey?: BananaStartRequest['apiKey']
	longPoll?: boolean // **suggested -** a flag telling the REST call wait on the server for results, up to 50s
	callID: string // the async task ID to fetch results for
}

type BananaCheckResponse = Omit<BananaStartResponse, 'callID' | 'finished'>

const sendPost = async (
	endpoint: string,
	body: BananaStartRequest | BananaCheckRequest
): Promise<BananaStartResponse | BananaCheckResponse> => {
	let res
	try {
		res = await fetch(endpoint, {
			method: 'post',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
	} catch (e) {
		throw errorHandler('Error connecting to server')
	}
	if (!res.ok) {
		const message = `An error has occurred: ${res.status} - ${res.statusText}`
		throw errorHandler(message)
	}

	return res.json()
}

const checkForStems = async (
	callID: BananaCheckRequest['callID'],
	trackId: Track['id']
): Promise<BananaCheckResponse['modelOutputs']> => {
	const checkRequest: BananaCheckRequest = { callID }

	const handleErr = (msg?: string) => {
		setAudioState[trackId].stemState('error')
		throw errorHandler(`Error generating stems: ${msg}`)
	}

	return new Promise(resolve =>
		setTimeout(async () => {
			let message
			let modelOutputs
			try {
				;({ message, modelOutputs } = (await sendPost(
					CHECK_ENDPOINT,
					checkRequest
				)) as BananaCheckResponse)
			} catch (err) {
				handleErr()
			}

			if (
				message?.includes('error') ||
				(message === 'success' && !modelOutputs)
			)
				handleErr(message)

			// if we don't have modelOutputs, we need to keep polling
			resolve(modelOutputs || (await checkForStems(callID, trackId)))
		}, 10000)
	)
}

const stemAudio = async (trackId: Track['id']) => {
	// retrieve file from cache
	const { file } = (await db.trackCache.get(trackId)) || {}
	if (!file) return errorHandler('No file found for track, try re-adding it.')

	// ensure we have access to a directory to save the stems
	const dirHandle = await getStemsDirHandle()
	if (!dirHandle) {
		// this would be due to denial of permission (ie. clicked cancel)
		return errorHandler('Permission to the file or folder was denied.')
	}

	setAudioState[trackId].stemState('processingStems')

	// convert file to Base64
	const fileBuffer = await file.arrayBuffer()
	const fileBase64 = window.btoa(
		new Uint8Array(fileBuffer).reduce(
			(data, byte) => data + String.fromCharCode(byte),
			''
		)
	)

	// create payload with encoded audio file
	const startBody: BananaStartRequest = {
		modelInputs: {
			fineTuned: false,
			file: {
				name: file.name,
				data: fileBase64
			}
		}
	}

	// send initial request to API
	let { finished, callID, modelOutputs } = (await sendPost(
		START_ENDPOINT,
		startBody
	)) as BananaStartResponse

	// if finished, we have modelOutputs, otherwise we need to poll using callID
	if (!finished) modelOutputs = await checkForStems(callID, trackId)

	const { name: filename, data: stems } = modelOutputs[0]

	setAudioState[trackId].stemState('convertingStems')

	console.log(`Received stems for ${filename}, converting to mp3...`)

	// create a new dir with name of audio file
	let audioDirHandle
	try {
		audioDirHandle = await dirHandle.getDirectoryHandle(`${filename} - stems`, {
			create: true
		})
	} catch (e) {
		return errorHandler('Error creating directory for stems.')
	}

	const stemType = `audio/${startBody.modelInputs.mp3 ? 'mp3' : 'wav'}`

	for (const { name, data } of stems) {
		const stemName = name.toString().slice(0, -4)
		const rename = `${stemName}.mp3`
		const stemFile = await audioDirHandle.getFileHandle(rename, {
			create: true
		})
		const writer = await stemFile.createWritable()

		// Decode the base64-encoded WAV file
		const audioData = window.atob(data)

		// Create a Uint8Array from the binary data string
		const audioArray = new Uint8Array(
			audioData.split('').map(c => c.charCodeAt(0))
		)

		// create a Blob from the audio data
		const audioBlob = new Blob([audioArray], { type: stemType })

		const finalize = async (blob: Blob) => {
			// create a file from the blob
			const file = new File([blob], rename, {
				type: 'audio/mp3'
			})

			await writer.write(file)
			await writer.close()

			console.log(`Stem saved: ${filename} - ${rename}`)

			// store stem in cache
			await storeTrackCache({
				id: trackId,
				stems: { [stemName as Stem]: { file } }
			})

			// give a couple of seconds before trying to render the stem waveform
			if (stemName === 'other')
				// 'other' is always the last stem
				console.log('setting stem ready')
			setTimeout(() => setAudioState[trackId].stemState('ready'), 2000)
		}

		if (!startBody.modelInputs.mp3) {
			console.log(`Converting stem: ${filename} - ${rename}`)

			convertWav(
				audioBlob,
				finalize,
				(progress: string) => {
					//console.log(`${rename}:`, `${(Number(progress) * 100).toFixed(1)}%`)
				},
				(error: string) => errorHandler(error)
			)
		} else await finalize(audioBlob)
	}
}

export { stemAudio }
