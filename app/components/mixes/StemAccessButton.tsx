import { CloudDownload, RuleFolder, Tune } from '@mui/icons-material'
import { CircularProgress, Sheet, Typography } from '@mui/joy'
import { ReactElement, useEffect, useState } from 'react'
import { audioState, StemState } from '~/api/appState'
import { Track } from '~/api/db/dbHandlers'
import { getStemsDirHandle, validateTrackStemAccess } from '~/api/fileHandlers'
import { stemAudio } from '~/api/stemHandler'
import { errorHandler } from '~/utils/notifications'

const StemAccessButton = ({ trackId }: { trackId: Track['id'] }) => {
  if (!trackId) return null

  const [stemState = 'selectStemDir'] = audioState[trackId].stemState()

  const getStemsDir = async () => {
    try {
      await getStemsDirHandle()
      await validateTrackStemAccess(trackId)
    } catch (err) {
      // this would be due to denial of permission (ie. clicked cancel)
      return errorHandler('Permission to the file or folder was denied.')
    }
  }

  const stemHandler = () => {
    if (stemState == 'getStems') {
      return stemAudio(trackId)
    }

    getStemsDir()
  }

  const stemStates: {
    [key in StemState]: {
      icon: ReactElement
      primaryText: string
      secondaryText: string
    }
  } = {
    selectStemDir: {
      icon: <CloudDownload sx={{ fontSize: 38, color: 'text.secondary' }} />,
      primaryText: 'Click to Select Stems Folder',
      secondaryText: 'Downloaded stems will be stored here',
    },
    grantStemDirAccess: {
      icon: <RuleFolder sx={{ fontSize: 38, color: 'text.secondary' }} />,
      primaryText: 'Click to Grant Folder Access',
      secondaryText: 'Permission needed to access stems',
    },
    getStems: {
      icon: <Tune sx={{ fontSize: 38, color: 'text.secondary' }} />,
      primaryText: 'Click to Retrieve Stems',
      secondaryText: 'Separate track into drums, vocals, etc',
    },
    processingStems: {
      icon: <CircularProgress size='md' color='warning' />,
      primaryText: 'Please stand by...',
      secondaryText: 'Stem separation in progress',
    },
    convertingStems: {
      icon: <CircularProgress size='md' color='warning' />,
      primaryText: 'Please stand by...',
      secondaryText: 'Converting stems to MP3 (320kbps)',
    },
    ready: { icon: <></>, primaryText: '', secondaryText: '' },
  }

  return (
    <Sheet
      variant='soft'
      sx={{
        border: '2px dashed #bbb',
        padding: '20px 10px',
        margin: '10px',
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '6px',
        borderColor: '#e9b830cc',
        backgroundColor: 'rgba(233, 215, 48, 0.1)',

        '&:hover, &:active': {
          borderColor: '#e9b830c0',
          backgroundColor: 'rgba(233, 215, 48, 0.3)',
        },
      }}
      onClick={stemHandler}
    >
      {stemStates[stemState].icon}
      <Typography
        level='body1'
        className='drop'
        sx={{ color: 'text.secondary' }}
      >
        <b>{stemStates[stemState].primaryText}</b>
      </Typography>
      <Typography className='drop' level='body2'>
        {stemStates[stemState].secondaryText}
      </Typography>
    </Sheet>
  )
}

export { StemAccessButton as default }
