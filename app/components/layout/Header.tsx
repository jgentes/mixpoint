import { Box, IconButton } from '@mui/joy'
import { getState, putState, useLiveQuery } from '~/api/db'
import Menu from '~/components/layout/Menu'

import DarkMode from '~/components/DarkMode'
import Logo from '~/components/MixpointLogo'

import { Menu as MenuIcon, Settings } from '@mui/icons-material'

const Header = () => {
  const { leftNavOpen } =
    useLiveQuery(() => getState('app', 'leftNavOpen')) || {}

  return (
    <>
      <Box>
        <IconButton
          variant="outlined"
          size="sm"
          title={`${leftNavOpen ? 'Hide' : 'Show'} navigation`}
          onClick={() => putState('app', { leftNavOpen: true })}
          sx={{ display: { sm: 'none' }, mr: 1.5 }}
        >
          <MenuIcon />
        </IconButton>
        <Logo />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
        <IconButton
          size="sm"
          variant="outlined"
          color="primary"
          aria-label="Apps"
        >
          <Settings />
        </IconButton>
        <DarkMode />
      </Box>
    </>
  )
}

export default Header
