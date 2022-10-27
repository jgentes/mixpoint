import { Box, Radio, radioClasses, RadioGroup } from '@mui/joy'
import { TrackState } from '~/api/dbHandlers'
import { EventBus } from '~/api/EventBus'

const BeatResolutionControl = ({
  trackId,
  beatResolution,
}: {
  trackId: TrackState['id']
  beatResolution: TrackState['beatResolution']
}) => {
  const changeBeatResolution = (beatResolution: TrackState['beatResolution']) =>
    EventBus.emit('beatResolution', { trackId: trackId, beatResolution })

  return (
    <RadioGroup
      row
      name="beatResolution"
      value={beatResolution}
      variant="outlined"
      sx={{ ml: 'auto' }}
      onChange={e =>
        changeBeatResolution(+e.target.value as TrackState['beatResolution'])
      }
    >
      {[0.25, 0.5, 1].map(item => (
        <Box
          key={item}
          sx={theme => ({
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 48,
            height: 24,
            '&:not([data-first-child])': {
              borderLeft: '1px solid',
              borderColor: 'divider',
            },
            [`&[data-first-child] .${radioClasses.action}`]: {
              borderTopLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              borderBottomLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
            },
            [`&[data-last-child] .${radioClasses.action}`]: {
              borderTopRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
              borderBottomRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
            },
          })}
        >
          <Radio
            value={item}
            disableIcon
            overlay
            label={`${item * 100}%`}
            variant={beatResolution == item ? 'outlined' : 'plain'}
            color="primary"
            sx={{
              fontSize: '12px',
              color: 'text.secondary',
            }}
            componentsProps={{
              action: {
                sx: { borderRadius: 0, transition: 'none' },
              },
              label: { sx: { lineHeight: 0 } },
            }}
          />
        </Box>
      ))}
    </RadioGroup>
  )
}

export { BeatResolutionControl as default }
