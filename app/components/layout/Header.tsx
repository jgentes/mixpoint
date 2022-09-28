import { Box, Typography, TextField, IconButton } from '@mui/joy'
import { useLiveQuery, AppState, appState } from '~/api/db'
import { Menu } from '~/components/layout/Menu'
import DarkMode from '~/components/DarkMode'

import { SearchRounded, Settings, Menu as MenuIcon } from '@mui/icons-material'

export default function Header() {
  const leftNavOpen: AppState['leftNavOpen'] = useLiveQuery(
    async () => (await appState.get())?.leftNavOpen
  )

  return (
    <Box
      component="header"
      className="Header"
      sx={[
        {
          p: 2,
          gap: 2,
          bgcolor: 'background.surface',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gridColumn: '1 / -1',
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        },
      ]}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <IconButton
          variant="outlined"
          size="sm"
          title={`${leftNavOpen ? 'Hide' : 'Show'} navigation`}
          onClick={() => appState.put({ leftNavOpen: true })}
          sx={{ display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography component="h1" fontWeight="xl">
          Mixpoint
        </Typography>
      </Box>
      <TextField
        size="sm"
        variant="soft"
        placeholder="Search..."
        startDecorator={<SearchRounded color="primary" />}
        endDecorator={
          <IconButton variant="outlined" size="sm" color="neutral">
            <Typography fontWeight="lg" fontSize="sm" textColor="text.tertiary">
              /
            </Typography>
          </IconButton>
        }
        sx={{
          fontWeight: 'thin',
          flexBasis: '500px',
          display: {
            xs: 'none',
            sm: 'flex',
          },
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
        <IconButton
          size="sm"
          variant="outlined"
          color="primary"
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          <SearchRounded />
        </IconButton>
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
    </Box>
  )
}
