import { useState } from 'react'
import type { Theme } from '@mui/joy/styles'
import { TrackTable } from './TrackTable'
import { GlobalStyles } from '@mui/system'

import { Box, Typography, TextField, IconButton } from '@mui/joy'

import {
  SearchRounded,
  GridViewRounded,
  FindInPageRounded,
  Menu as MenuIcon,
  BookRounded,
} from '@mui/icons-material'

// custom
import Layout from './Layout'
import { Menu } from './Menu'
import { Navigation } from './Navigation'
import { DarkMode } from '../components/DarkMode'

export default function Files() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <>
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
            variant="soft"
            placeholder="Search..."
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
        </Layout.Header>
        <Layout.SideNav>
          <Navigation />
        </Layout.SideNav>
        <Layout.Main>
          <Box>
            <TrackTable />
          </Box>
        </Layout.Main>
      </Layout.Root>
    </>
  )
}
