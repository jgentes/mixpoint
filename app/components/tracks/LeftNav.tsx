import { Icon } from '@iconify-icon/react'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from '@mui/joy'

import { tableState } from '~/api/appState'
import Dropzone from '~/components/tracks/Dropzone'

const LeftNav = () => {
  const [openDrawer] = tableState.openDrawer()

  return (
    <Box
      component='nav'
      height='100%'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        backgroundColor: 'background.surface',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <List size='sm' sx={{ '--List-item-radius': '8px' }}>
        <ListItem nested sx={{ p: 0 }}>
          <Box
            sx={{
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              id='nav-list-browse'
              textColor='neutral.500'
              fontWeight={700}
              sx={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '.1rem',
              }}
            >
              Browse
            </Typography>
          </Box>
          <List
            aria-labelledby='nav-list-browse'
            sx={{
              '& .MuiListItemButton-root': { p: '8px' },
            }}
          >
            <ListItem>
              <ListItemButton
                variant={openDrawer ? 'soft' : undefined}
                color={openDrawer ? 'primary' : undefined}
              >
                <ListItemDecorator sx={{ color: 'inherit' }}>
                  <Icon
                    icon='material-symbols:lens-outline'
                    style={{
                      fontSize: '20px',
                      color: '#2ca3d6',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>Tracks</ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemDecorator sx={{ color: 'inherit' }}>
                  <img
                    src='/media/innerjoin32.png'
                    style={{ height: '22px', marginRight: '8px' }}
                  />
                </ListItemDecorator>
                <ListItemContent>
                  <ListItemContent>Mixes</ListItemContent>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemDecorator sx={{ color: 'inherit' }}>
                  <Icon
                    icon='material-symbols:animation'
                    style={{
                      fontSize: '22px',
                      transform: 'rotate(45deg)',
                      color: '#2ca3d6',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>Sets</ListItemContent>
              </ListItemButton>
            </ListItem>
          </List>
        </ListItem>
        <ListItem nested sx={{ p: 0 }}>
          <Box
            sx={{
              mt: 2,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              id='nav-list-playlists'
              textColor='neutral.500'
              fontWeight={700}
              sx={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '.1rem',
              }}
            >
              Playlists
            </Typography>
          </Box>
          <List
            aria-labelledby='nav-list-playlists'
            size='sm'
            sx={{
              '--List-decorator-size': '32px',
              '& .MuiListItemButton-root': { p: '8px' },
            }}
          >
            <ListItem>
              <ListItemButton>
                <ListItemDecorator>
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '99px',
                      backgroundColor: 'primary.300',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>Electro</ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemDecorator>
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '99px',
                      backgroundColor: 'danger.400',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>House</ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemDecorator>
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '99px',
                      backgroundColor: 'warning.500',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>Drum & Bass</ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemDecorator>
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '99px',
                      backgroundColor: 'success.400',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>Downtempo</ListItemContent>
              </ListItemButton>
            </ListItem>
          </List>
        </ListItem>
      </List>

      <Dropzone />
    </Box>
  )
}

export default LeftNav
