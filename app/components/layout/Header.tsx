import { Box, IconButton } from '@mui/joy'

import DarkMode from '~/components/DarkMode'
import Logo from '~/components/MixpointLogo'

import { GitHub, Settings } from '@mui/icons-material'

const Header = () => (
  <Box
    component="header"
    sx={{
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
    }}
  >
    <Logo />
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
      <IconButton
        size="sm"
        variant="outlined"
        color="primary"
        aria-label="Github"
        title="Discuss on Github"
        onClick={() =>
          window.open('https://github.com/jgentes/mixpoint/discussions')
        }
      >
        <GitHub />
      </IconButton>
      <DarkMode />
    </Box>
  </Box>
)

export default Header
