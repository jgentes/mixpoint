import { Box, Typography, TextField, IconButton } from '@mui/joy'
import { Menu } from './Menu'
import DarkMode from '../DarkMode'

import {
  SearchRounded,
  GridViewRounded,
  Menu as MenuIcon,
  BookRounded,
} from '@mui/icons-material'

export default function Header() {
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
          title="title here"
          onClick={() => console.error('set some state here')}
        >
          <MenuIcon />
        </IconButton>
        <Typography component="h1" fontWeight="xl">
          Files
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
        <IconButton
          size="sm"
          variant="outlined"
          color="primary"
          component="a"
          href="/blog/first-look-at-joy/"
        >
          <BookRounded />
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
              <GridViewRounded />
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
