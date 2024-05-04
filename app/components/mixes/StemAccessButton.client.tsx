import { CircularProgress } from '@nextui-org/react'
import type { ReactElement } from 'react'
import { useCountUp } from 'use-count-up'
import type { Track } from '~/api/handlers/dbHandlers'
import {
  getStemsDirHandle,
  validateTrackStemAccess
} from '~/api/handlers/fileHandlers'
import { stemAudio } from '~/api/handlers/stemHandler'
import { type StemState, audioState } from '~/api/models/appState.client'
import {
  OfflineDownloadIcon,
  RuleFolderIcon,
  TuneIcon,
  WarningIcon
} from '~/components/icons'
import { errorHandler } from '~/utils/notifications'

const StemAccessButton = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const stemState = audioState[trackId]?.stemState || 'selectStemDir'
  const stemTimer = audioState[trackId]?.stemTimer || 45

  const getStemsDir = async () => {
    try {
      await getStemsDirHandle()
      await validateTrackStemAccess(trackId)
    } catch (err) {
      // this would be due to denial of permission (ie. clicked cancel)
      return errorHandler('Permission to the file or folder was denied.')
    }
  }

  const TimerCircle = ({ color }: { color: 'success' | 'warning' }) => {
    const { value = 1 } = useCountUp({
      isCounting: true,
      duration: stemTimer,
      start: 0,
      end: 100,
      easing: 'linear',
      updateInterval: 1,
      onComplete: () => ({ shouldRepeat: true })
    })

    return (
      <CircularProgress
        aria-label="Stem Timer Progress"
        size="md"
        color={color}
        className="mx-auto"
        value={(((value as number) || 1) / stemTimer) * 100}
      />
    )
  }

  const stemStates: {
    [key in StemState]: {
      icon: ReactElement
      primaryText: string
      secondaryText: string
    }
  } = {
    selectStemDir: {
      icon: (
        <OfflineDownloadIcon className="text-4xl text-default-600 m-auto" />
      ),
      primaryText: 'Click to Select Stems Folder',
      secondaryText: 'Downloaded stems will be stored in the folder'
    },
    grantStemDirAccess: {
      icon: <RuleFolderIcon className="text-4xl text-default-600 m-auto" />,
      primaryText: 'Click to Grant Folder Access',
      secondaryText: 'Permission needed to access stems'
    },
    getStems: {
      icon: <TuneIcon className="text-4xl text-default-600 m-auto" />,
      primaryText: 'Click to Retrieve Stems',
      secondaryText: 'Separate track into drums, vocals, etc'
    },
    uploadingFile: {
      icon: <TimerCircle color="success" />,
      primaryText: 'Please stand by...',
      secondaryText: 'Preparing service for stem separation'
    },
    processingStems: {
      icon: <TimerCircle color="warning" />,
      primaryText: 'Please stand by...',
      secondaryText: 'Stem separation in progress'
    },
    downloadingStems: {
      icon: <CircularProgress size="md" color="success" className="mx-auto" />,
      primaryText: 'Please stand by...',
      secondaryText: 'Downloading stems'
    },
    ready: { icon: <></>, primaryText: '', secondaryText: '' },
    error: {
      icon: <WarningIcon className="text-3xl text-warning-600 mx-auto" />,
      primaryText: 'Something went wrong',
      secondaryText: 'Please try again'
    }
  }

  const stemHandler = async () => {
    try {
      stemState === 'getStems' ? await stemAudio(trackId) : await getStemsDir()
    } catch (e) {
      return // error handled in promises
    }
  }

  return (
    <div
      className="
				border-2 border-dashed p-5 text-center cursor-pointer rounded border-default-500 bg-default-50 hover:bg-warning-500 hover:bg-opacity-10 hover:border-warning-500 active:border-warning-500 active:bg-warning-500m mb-3 h-32"
      aria-label={stemStates[stemState as keyof typeof stemStates].primaryText}
      onClick={stemHandler}
    >
      {stemStates[stemState as keyof typeof stemStates].icon}
      <div className="text-default-600 text-md font-semibold">
        {stemStates[stemState as keyof typeof stemStates].primaryText}
      </div>
      <div className="text-default-600 text-sm">
        {stemStates[stemState as keyof typeof stemStates].secondaryText}
      </div>
    </div>
  )
}

export { StemAccessButton as default }
