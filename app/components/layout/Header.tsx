import { Box, IconButton } from '@mui/joy'
import { useLiveQuery, getState, putState } from '~/api/db'
import { Menu } from '~/components/layout/Menu'

import Logo from '~/components/MixpointLogo'
import DarkMode from '~/components/DarkMode'

import { Settings, Menu as MenuIcon } from '@mui/icons-material'

export default function Header() {
  const leftNavOpen = useLiveQuery(() => getState('app', 'leftNavOpen'))

  return (
    <>
      <Box>
        <IconButton
          variant="outlined"
          size="sm"
          title={`${leftNavOpen ? 'Hide' : 'Show'} navigation`}
          onClick={() => putState('app', { leftNavOpen: true })}
          sx={{ display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Logo />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
        <Menu
          id="app-selector"
          control={
            <IconButton
              size="sm"
              variant="outlined"
              color="primary"
              aria-label="Apps"
            >
              <Settings />
            </IconButton>
          }
          menus={[
            {
              label: 'Email',
              href: '/joy-ui/getting-started/templates/email/',
            },
            {
              label: 'Team',
              href: '/joy-ui/getting-started/templates/team/',
            },
            {
              label: 'Files',
              active: true,
              href: '/joy-ui/getting-started/templates/files/',
              'aria-current': 'page',
            },
          ]}
        />
        <DarkMode />
      </Box>
    </>
  )
}
