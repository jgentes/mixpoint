import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from '@mui/joy'

import {
  Animation,
  JoinInner,
  KeyboardArrowDownRounded,
  RadioButtonUnchecked,
  TripOrigin,
} from '@mui/icons-material'
import { NavLink, useMatches } from '@remix-run/react'

import Dropzone from '~/components/Dropzone'

const LeftNav = () => {
  const path = useMatches()
  const pathname = path[path.length - 1].pathname

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <List size="sm" sx={{ '--List-item-radius': '8px' }}>
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
              id="nav-list-browse"
              textColor="neutral.500"
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
            aria-labelledby="nav-list-browse"
            sx={{
              '& .JoyListItemButton-root': { p: '8px' },
            }}
          >
            <NavLink to="/tracks" style={{ textDecoration: 'none' }}>
              <ListItem>
                <ListItemButton
                  variant={pathname == '/tracks' ? 'soft' : undefined}
                  color={pathname == '/tracks' ? 'primary' : undefined}
                >
                  <ListItemDecorator sx={{ color: 'inherit' }}>
                    <RadioButtonUnchecked
                      sx={{ fontSize: '20px', color: '#1e87c1' }}
                    />
                  </ListItemDecorator>
                  <ListItemContent>Tracks</ListItemContent>
                </ListItemButton>
              </ListItem>
            </NavLink>
            <NavLink to="/mixes" style={{ textDecoration: 'none' }}>
              <ListItem>
                <ListItemButton
                  variant={pathname == '/mixes' ? 'soft' : undefined}
                  color={pathname == '/mixes' ? 'primary' : undefined}
                >
                  <ListItemDecorator sx={{ color: 'inherit' }}>
                    <img src="/media/innerjoin32.png" width={20} />
                  </ListItemDecorator>
                  <ListItemContent>
                    <ListItemContent>Mixes</ListItemContent>
                  </ListItemContent>
                </ListItemButton>
              </ListItem>
            </NavLink>
            <NavLink to="/sets" style={{ textDecoration: 'none' }}>
              <ListItem>
                <ListItemButton
                  variant={pathname == '/sets' ? 'soft' : undefined}
                  color={pathname == '/sets' ? 'primary' : undefined}
                >
                  <ListItemDecorator sx={{ color: 'inherit' }}>
                    <Animation
                      sx={{
                        fontSize: '22px',
                        transform: 'rotate(45deg)',
                        color: '#1e87c1',
                      }}
                    />
                  </ListItemDecorator>
                  <ListItemContent>Sets</ListItemContent>
                </ListItemButton>
              </ListItem>
            </NavLink>
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
              id="nav-list-playlists"
              textColor="neutral.500"
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
            aria-labelledby="nav-list-playlists"
            size="sm"
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
