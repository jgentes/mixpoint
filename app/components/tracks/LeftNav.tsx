import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from '@mui/joy'

import { Animation, JoinInner, RadioButtonUnchecked } from '@mui/icons-material'

import { tableState } from '~/api/appState'
import Dropzone from '~/components/tracks/Dropzone'

const LeftNav = () => {
  const [openDrawer, setOpenDrawer] = tableState.openDrawer()

  return (
    <Box
      component='nav'
      height='100%'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
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
              '& .JoyListItemButton-root': { p: '8px' },
            }}
          >
            <ListItem>
              <ListItemButton
                variant={openDrawer ? 'soft' : undefined}
                color={openDrawer ? 'primary' : undefined}
              >
                <ListItemDecorator sx={{ color: 'inherit' }}>
                  <RadioButtonUnchecked
                    sx={{
                      fontSize: '20px',
                      color: '#3399FF',
                    }}
                  />
                </ListItemDecorator>
                <ListItemContent>Tracks</ListItemContent>
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemDecorator sx={{ color: 'inherit' }}>
                  <JoinInner
                    sx={{
                      fontSize: '20px',
                      color: '#3399FF',
                    }}
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
                  <Animation
                    sx={{
                      fontSize: '22px',
                      transform: 'rotate(45deg)',
                      color: '#3399FF',
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
              '& .JoyListItemButton-root': { p: '8px' },
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
                      bgcolor: 'primary.300',
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
                      bgcolor: 'danger.400',
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
                      bgcolor: 'warning.500',
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
                      bgcolor: 'success.400',
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
