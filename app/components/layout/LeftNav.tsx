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
  FolderOpen,
  JoinInner,
  KeyboardArrowDownRounded,
  ListAlt,
} from '@mui/icons-material'
import { NavLink, useMatches } from '@remix-run/react'

import Dropzone from '~/components/Dropzone'

const LeftNav = () => {
  const path = useMatches()
  const pathname = path[path.length - 1].pathname

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <IconButton
              size="sm"
              variant="plain"
              color="primary"
              sx={{ '--IconButton-size': '24px' }}
            >
              <KeyboardArrowDownRounded fontSize="small" color="primary" />
            </IconButton>
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
                    <FolderOpen sx={{ fontSize: '22px' }} />
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
                    <JoinInner
                      sx={{
                        fontSize: '22px',
                      }}
                    />
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
                    <ListAlt sx={{ fontSize: '22px' }} />
                  </ListItemDecorator>
                  <ListItemContent>Sets</ListItemContent>
                </ListItemButton>
              </ListItem>
            </NavLink>
          </List>
        </ListItem>
        <ListItem nested>
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
              id="nav-list-tags"
              textColor="neutral.500"
              fontWeight={700}
              sx={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '.1rem',
              }}
            >
              Tags
            </Typography>
            <IconButton
              size="sm"
              variant="plain"
              color="primary"
              sx={{ '--IconButton-size': '24px' }}
            >
              <KeyboardArrowDownRounded fontSize="small" color="primary" />
            </IconButton>
          </Box>
          <List
            aria-labelledby="nav-list-tags"
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
                <ListItemContent>Personal</ListItemContent>
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
                <ListItemContent>Work</ListItemContent>
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
                <ListItemContent>Travels</ListItemContent>
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
                <ListItemContent>Concert tickets</ListItemContent>
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
