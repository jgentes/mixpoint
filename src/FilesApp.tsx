import { useState } from 'react'
import type { Theme } from '@mui/joy/styles'

import { GlobalStyles } from '@mui/system'
import { CssVarsProvider } from '@mui/joy/styles'

import {
  AspectRatio,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardOverflow,
  CardCover,
  CardContent,
  Typography,
  TextField,
  IconButton,
  ListDivider,
  Sheet,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
} from '@mui/joy'

import {
  SearchRounded,
  GridViewRounded,
  FindInPageRounded,
  Menu as MenuIcon,
  FolderOpen,
  EditOutlined,
  Close,
  BookRounded,
} from '@mui/icons-material'

// custom
import Layout from './components/Layout'
import { FilesTheme } from './theme'
import { Menu } from './components/Menu'
import { Navigation } from './components/Navigation'
import { DarkMode } from './components/DarkMode'

export default function Files() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <CssVarsProvider disableTransitionOnChange theme={FilesTheme}>
      <GlobalStyles<Theme>
        styles={theme => ({
          body: {
            margin: 0,
            fontFamily: theme.vars.fontFamily.body,
          },
        })}
      />
      {drawerOpen && (
        <Layout.SideDrawer onClose={() => setDrawerOpen(false)}>
          <Navigation />
        </Layout.SideDrawer>
      )}
      <Layout.Root
        sx={{
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'minmax(64px, 200px) minmax(450px, 1fr)',
            md: 'minmax(160px, 300px) minmax(600px, 1fr) minmax(300px, 420px)',
          },
          ...(drawerOpen && {
            height: '100vh',
            overflow: 'hidden',
          }),
        }}
      >
        <Layout.Header>
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
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <IconButton
              size="sm"
              variant="solid"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <FindInPageRounded />
            </IconButton>
            <Typography component="h1" fontWeight="xl">
              Files
            </Typography>
          </Box>
          <TextField
            size="sm"
            placeholder="Search anything…"
            startDecorator={<SearchRounded color="primary" />}
            endDecorator={
              <IconButton variant="outlined" size="sm" color="neutral">
                <Typography
                  fontWeight="lg"
                  fontSize="sm"
                  textColor="text.tertiary"
                >
                  /
                </Typography>
              </IconButton>
            }
            sx={{
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
        </Layout.Header>
        <Layout.SideNav>
          <Navigation />
        </Layout.SideNav>
        <Layout.Main>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 2,
            }}
          >
            <Sheet
              variant="outlined"
              sx={{
                borderRadius: 'sm',
                gridColumn: '1/-1',
                bgcolor: 'background.componentBg',
                display: { xs: 'none', sm: 'grid' },
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                '& > *': {
                  p: 2,
                  '&:nth-child(n):not(:nth-last-child(-n+4))': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                },
              }}
            >
              <Typography level="body3" fontWeight="md" noWrap>
                Folder name
              </Typography>
              <Typography level="body3" fontWeight="md" noWrap>
                Date modified
              </Typography>
              <Typography level="body3" fontWeight="md" noWrap>
                Size
              </Typography>
              <Typography level="body3" fontWeight="md" noWrap>
                Users
              </Typography>

              <Typography
                level="body2"
                startDecorator={<FolderOpen color="primary" />}
                sx={{ alignItems: 'flex-start' }}
              >
                Travel pictures
              </Typography>
              <Typography level="body2">21 October 2011, 3PM</Typography>
              <Typography level="body2" sx={{ color: 'success.600' }}>
                987.5MB
              </Typography>
              <Box>
                <AvatarGroup
                  size="sm"
                  sx={{ '--AvatarGroup-gap': '-8px', '--Avatar-size': '24px' }}
                >
                  <Avatar
                    src="https://i.pravatar.cc/24?img=6"
                    srcSet="https://i.pravatar.cc/48?img=6 2x"
                  />
                  <Avatar
                    src="https://i.pravatar.cc/24?img=7"
                    srcSet="https://i.pravatar.cc/48?img=7 2x"
                  />
                  <Avatar
                    src="https://i.pravatar.cc/24?img=8"
                    srcSet="https://i.pravatar.cc/48?img=8 2x"
                  />
                  <Avatar
                    src="https://i.pravatar.cc/24?img=9"
                    srcSet="https://i.pravatar.cc/48?img=9 2x"
                  />
                </AvatarGroup>
              </Box>
              <Typography
                level="body2"
                startDecorator={<FolderOpen color="primary" />}
                sx={{ alignItems: 'flex-start' }}
              >
                Important documents
              </Typography>
              <Typography level="body2">26 May 2010, 7PM</Typography>
              <Typography level="body2" sx={{ color: 'success.600' }}>
                123.3KB
              </Typography>
              <Box>
                <AvatarGroup
                  size="sm"
                  sx={{ '--AvatarGroup-gap': '-8px', '--Avatar-size': '24px' }}
                >
                  <Avatar
                    src="https://i.pravatar.cc/24?img=6"
                    srcSet="https://i.pravatar.cc/48?img=6 2x"
                  />
                  <Avatar
                    src="https://i.pravatar.cc/24?img=7"
                    srcSet="https://i.pravatar.cc/48?img=7 2x"
                  />
                  <Avatar
                    src="https://i.pravatar.cc/24?img=8"
                    srcSet="https://i.pravatar.cc/48?img=8 2x"
                  />
                  <Avatar
                    src="https://i.pravatar.cc/24?img=9"
                    srcSet="https://i.pravatar.cc/48?img=9 2x"
                  />
                </AvatarGroup>
              </Box>
            </Sheet>
            <Sheet
              variant="outlined"
              sx={{
                display: { xs: 'inherit', sm: 'none' },
                borderRadius: 'sm',
                bgcolor: 'background.componentBg',
                overflow: 'auto',
                '& > *': {
                  '&:nth-child(n):not(:nth-last-child(-n+4))': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  },
                },
              }}
            >
              <List
                aria-labelledby="table-in-list"
                sx={{
                  '& .JoyListItemButton-root': { p: '0px' },
                }}
              >
                <ListItem>
                  <ListItemButton
                    variant="soft"
                    sx={{ bgcolor: 'transparent' }}
                  >
                    <ListItemContent sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography
                          level="body2"
                          startDecorator={<FolderOpen color="primary" />}
                          sx={{ alignItems: 'flex-start' }}
                        >
                          Travel pictures
                        </Typography>
                        <Typography level="body2" sx={{ color: 'success.600' }}>
                          987.5MB
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 2,
                        }}
                      >
                        <Box>
                          <AvatarGroup
                            size="sm"
                            sx={{
                              '--AvatarGroup-gap': '-8px',
                              '--Avatar-size': '24px',
                            }}
                          >
                            <Avatar
                              src="https://i.pravatar.cc/24?img=6"
                              srcSet="https://i.pravatar.cc/48?img=6 2x"
                            />
                            <Avatar
                              src="https://i.pravatar.cc/24?img=7"
                              srcSet="https://i.pravatar.cc/48?img=7 2x"
                            />
                            <Avatar
                              src="https://i.pravatar.cc/24?img=8"
                              srcSet="https://i.pravatar.cc/48?img=8 2x"
                            />
                            <Avatar
                              src="https://i.pravatar.cc/24?img=9"
                              srcSet="https://i.pravatar.cc/48?img=9 2x"
                            />
                          </AvatarGroup>
                        </Box>
                        <Typography level="body2">
                          21 October 2011, 3PM
                        </Typography>
                      </Box>
                    </ListItemContent>
                  </ListItemButton>
                </ListItem>
                <ListDivider sx={{ m: 0 }} />
                <ListItem>
                  <ListItemButton
                    variant="soft"
                    sx={{ bgcolor: 'transparent' }}
                  >
                    <ListItemContent sx={{ p: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography
                          level="body2"
                          startDecorator={<FolderOpen color="primary" />}
                          sx={{ alignItems: 'flex-start' }}
                        >
                          Important documents
                        </Typography>
                        <Typography level="body2" sx={{ color: 'success.600' }}>
                          123.3KB
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 2,
                        }}
                      >
                        <Box>
                          <AvatarGroup
                            size="sm"
                            sx={{
                              '--AvatarGroup-gap': '-8px',
                              '--Avatar-size': '24px',
                            }}
                          >
                            <Avatar
                              src="https://i.pravatar.cc/24?img=6"
                              srcSet="https://i.pravatar.cc/48?img=6 2x"
                            />
                            <Avatar
                              src="https://i.pravatar.cc/24?img=7"
                              srcSet="https://i.pravatar.cc/48?img=7 2x"
                            />
                            <Avatar
                              src="https://i.pravatar.cc/24?img=8"
                              srcSet="https://i.pravatar.cc/48?img=8 2x"
                            />
                            <Avatar
                              src="https://i.pravatar.cc/24?img=9"
                              srcSet="https://i.pravatar.cc/48?img=9 2x"
                            />
                          </AvatarGroup>
                        </Box>
                        <Typography level="body2">26 May 2010, 7PM</Typography>
                      </Box>
                    </ListItemContent>
                  </ListItemButton>
                </ListItem>
              </List>
            </Sheet>
            <Card
              variant="outlined"
              sx={{
                '--Card-radius': theme => theme.vars.radius.sm,
                bgcolor: 'background.componentBg',
                boxShadow: 'none',
              }}
            >
              <CardOverflow
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'neutral.outlinedBorder',
                }}
              >
                <AspectRatio ratio="16/9" color="primary">
                  <Typography
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.plainColor',
                    }}
                  >
                    .zip
                  </Typography>
                </AspectRatio>
              </CardOverflow>
              <Box sx={{ pt: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography>photos-travel.zip</Typography>
                  <Typography level="body3" mt={0.5}>
                    Added 25 May 2011
                  </Typography>
                </Box>
                <IconButton variant="plain" color="neutral">
                  <EditOutlined />
                </IconButton>
              </Box>
            </Card>
            <Card
              sx={{
                '--Card-radius': theme => theme.vars.radius.sm,
                boxShadow: 'none',
              }}
            >
              <CardCover>
                <img
                  alt=""
                  src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=774"
                />
              </CardCover>
              <CardCover
                sx={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.12))',
                }}
              />
              <CardContent
                sx={{
                  mt: 'auto',
                  flexGrow: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography textColor="#fff">torres-del-paine.png</Typography>
                  <Typography
                    level="body3"
                    mt={0.5}
                    textColor="rgba(255,255,255,0.72)"
                  >
                    Added 5 Aug 2016
                  </Typography>
                </Box>
                <IconButton
                  variant="plain"
                  color="neutral"
                  sx={{ color: '#fff' }}
                >
                  <EditOutlined />
                </IconButton>
              </CardContent>
            </Card>
            <Card
              variant="outlined"
              sx={{
                '--Card-radius': theme => theme.vars.radius.sm,
                bgcolor: 'background.componentBg',
                boxShadow: 'none',
              }}
            >
              <CardOverflow
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'neutral.outlinedBorder',
                }}
              >
                <AspectRatio ratio="16/9" color="primary">
                  <Typography
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'primary.plainColor',
                    }}
                  >
                    .zip
                  </Typography>
                </AspectRatio>
              </CardOverflow>
              <Box sx={{ pt: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography>platform_ios.zip</Typography>
                  <Typography level="body3" mt={0.5}>
                    Added 26 May 2011
                  </Typography>
                </Box>
                <IconButton variant="plain" color="neutral">
                  <EditOutlined />
                </IconButton>
              </Box>
            </Card>
          </Box>
        </Layout.Main>
        <Sheet
          sx={{
            display: { xs: 'none', sm: 'initial' },
            borderLeft: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            bgcolor: 'background.componentBg',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ flex: 1 }}>torres-del-paine.png</Typography>
            <IconButton variant="outlined" color="neutral" size="sm">
              <Close />
            </IconButton>
          </Box>
          <ListDivider component="hr" />
          <Box sx={{ display: 'flex' }}>
            <Button
              variant="soft"
              sx={{
                borderRadius: 0,
                borderBottom: '2px solid',
                borderColor: 'primary.solidBg',
                flex: 1,
                py: '1rem',
              }}
            >
              Details
            </Button>
            <Button
              variant="plain"
              color="neutral"
              sx={{ borderRadius: 0, flex: 1, py: '1rem' }}
            >
              Activity
            </Button>
          </Box>
          <AspectRatio ratio="21/9">
            <img
              alt=""
              src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=774"
            />
          </AspectRatio>
          <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography level="body2" mr={1}>
              Shared with
            </Typography>
            <AvatarGroup size="sm" sx={{ '--Avatar-size': '24px' }}>
              <Avatar
                src="https://i.pravatar.cc/24?img=6"
                srcSet="https://i.pravatar.cc/48?img=6 2x"
              />
              <Avatar
                src="https://i.pravatar.cc/24?img=7"
                srcSet="https://i.pravatar.cc/48?img=7 2x"
              />
              <Avatar
                src="https://i.pravatar.cc/24?img=8"
                srcSet="https://i.pravatar.cc/48?img=8 2x"
              />
              <Avatar
                src="https://i.pravatar.cc/24?img=9"
                srcSet="https://i.pravatar.cc/48?img=9 2x"
              />
            </AvatarGroup>
          </Box>
          <ListDivider component="hr" />
          <Box
            sx={{
              gap: 2,
              p: 2,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              '& > *:nth-child(odd)': { color: 'text.secondary' },
            }}
          >
            <Typography level="body2">Type</Typography>
            <Typography level="body2" textColor="text.primary">
              Image
            </Typography>

            <Typography level="body2">Size</Typography>
            <Typography level="body2" textColor="text.primary">
              3,6 MB (3,258,385 bytes)
            </Typography>

            <Typography level="body2">Storage used</Typography>
            <Typography level="body2" textColor="text.primary">
              3,6 MB (3,258,385 bytes)
            </Typography>

            <Typography level="body2">Location</Typography>
            <Typography level="body2" textColor="text.primary">
              Travel pictures
            </Typography>

            <Typography level="body2">Owner</Typography>
            <Typography level="body2" textColor="text.primary">
              Michael Scott
            </Typography>

            <Typography level="body2">Modified</Typography>
            <Typography level="body2" textColor="text.primary">
              26 October 2016
            </Typography>

            <Typography level="body2">Created</Typography>
            <Typography level="body2" textColor="text.primary">
              5 August 2016
            </Typography>
          </Box>
          <ListDivider component="hr" />
          <Box sx={{ py: 2, px: 1 }}>
            <Button variant="plain" size="sm" endIcon={<EditOutlined />}>
              Add a description
            </Button>
          </Box>
        </Sheet>
      </Layout.Root>
    </CssVarsProvider>
  )
}
