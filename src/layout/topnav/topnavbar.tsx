import { db } from '../../db'
import React, { useState } from 'react'
import {
  EuiAvatar,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeader,
  EuiHeaderBreadcrumbs,
  EuiHeaderLogo,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiKeyPadMenu,
  EuiKeyPadMenuItem,
  EuiLink,
  EuiPopover,
  EuiPopoverFooter,
  EuiPopoverTitle,
  EuiSelectable,
  EuiSelectableMessage,
  EuiSelectableTemplateSitewide,
  EuiSpacer,
  EuiText,
  useGeneratedHtmlId,
} from '@elastic/eui'
//import { Link } from 'react-router-dom'
import favIcon32 from '../../assets/soundwave-32px.jpg'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

export const TopNavbar = () => {
  const renderLogo = () => (
    <EuiHeaderLogo
      iconType={favIcon32}
      href="#"
      onClick={e => e.preventDefault()}
      aria-label="Go to home page"
    >
      Mixpoint
    </EuiHeaderLogo>
  )

  const renderBreadcrumbs = () => {
    const breadcrumbs = [
      {
        text: 'Management',
        href: '#',
        onClick: e => {
          e.preventDefault()
        },
        'data-test-subj': 'breadcrumbsAnimals',
        className: 'customClass',
      },
      {
        text: 'Truncation test is here for a really long item',
        href: '#',
        onClick: e => {
          e.preventDefault()
        },
      },
      {
        text: 'Hidden',
        href: '#',
        onClick: e => {
          e.preventDefault()
        },
      },
      {
        text: 'Users',
        href: '#',
        onClick: e => {
          e.preventDefault()
        },
      },
      {
        text: 'Create',
      },
    ]

    return (
      <EuiHeaderBreadcrumbs
        aria-label="Header breadcrumbs example"
        breadcrumbs={breadcrumbs}
      />
    )
  }

  const search = (
    <EuiSelectableTemplateSitewide
      options={[]}
      searchProps={{
        compressed: true,
      }}
      popoverButton={
        <EuiHeaderSectionItemButton aria-label="Sitewide search">
          <EuiIcon type={MagnifyingGlassIcon} size="l" />
        </EuiHeaderSectionItemButton>
      }
      emptyMessage={
        <EuiSelectableMessage style={{ minHeight: 300 }}>
          <p>
            Please see the component page for{' '}
            <EuiLink href="/forms/selectable">
              <strong>EuiSelectableTemplateSitewide</strong>
            </EuiLink>{' '}
            on how to configure your sitewide search.
          </p>
        </EuiSelectableMessage>
      }
    />
  )

  return (
    <EuiHeader>
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem border="right">
          {renderLogo()}
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem border="right">
          <HeaderSpacesMenu />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      {renderBreadcrumbs()}

      <EuiHeaderSection side="right">
        <EuiHeaderSectionItem>{search}</EuiHeaderSectionItem>

        <EuiHeaderSectionItem>
          <HeaderAppMenu />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  )
}

const HeaderSpacesMenu = () => {
  const headerSpacesPopoverId = useGeneratedHtmlId({
    prefix: 'headerSpacesPopover',
  })
  const spacesValues = [
    {
      label: 'Sales team',
      prepend: <EuiAvatar type="space" name="Sales Team" size="s" />,
      checked: 'on',
    },
    {
      label: 'Engineering',
      prepend: <EuiAvatar type="space" name="Engineering" size="s" />,
    },
    {
      label: 'Security',
      prepend: <EuiAvatar type="space" name="Security" size="s" />,
    },
    {
      label: 'Default',
      prepend: <EuiAvatar type="space" name="Default" size="s" />,
    },
  ]

  const additionalSpaces = [
    {
      label: 'Sales team 2',
      prepend: <EuiAvatar type="space" name="Sales Team 2" size="s" />,
    },
    {
      label: 'Engineering 2',
      prepend: <EuiAvatar type="space" name="Engineering 2" size="s" />,
    },
    {
      label: 'Security 2',
      prepend: <EuiAvatar type="space" name="Security 2" size="s" />,
    },
    {
      label: 'Default 2',
      prepend: <EuiAvatar type="space" name="Default 2" size="s" />,
    },
  ]

  const [spaces, setSpaces] = useState(spacesValues)
  const [selectedSpace, setSelectedSpace] = useState(
    spaces.filter(option => option.checked)[0]
  )
  const [isOpen, setIsOpen] = useState(false)

  const isListExtended = () => {
    return spaces.length > 4 ? true : false
  }

  const onMenuButtonClick = () => {
    setIsOpen(!isOpen)
  }

  const closePopover = () => {
    setIsOpen(false)
  }

  const onChange = options => {
    setSpaces(options)
    setSelectedSpace(options.filter(option => option.checked)[0])
    setIsOpen(false)
  }

  const addMoreSpaces = () => {
    setSpaces(spaces.concat(additionalSpaces))
  }

  const button = (
    <EuiHeaderSectionItemButton
      aria-controls={headerSpacesPopoverId}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label="Spaces menu"
      onClick={onMenuButtonClick}
    >
      {selectedSpace.prepend}
    </EuiHeaderSectionItemButton>
  )

  return (
    <EuiPopover
      id={headerSpacesPopoverId}
      button={button}
      isOpen={isOpen}
      anchorPosition="downLeft"
      closePopover={closePopover}
      panelPaddingSize="none"
    >
      <EuiSelectable
        searchable={isListExtended()}
        searchProps={{
          placeholder: 'Find a space',
          compressed: true,
        }}
        options={spaces}
        singleSelection="always"
        style={{ width: 300 }}
        onChange={onChange}
        listProps={{
          rowHeight: 40,
          showIcons: false,
        }}
      >
        {(list, search) => (
          <>
            <EuiPopoverTitle paddingSize="s">
              {search || 'Your spaces'}
            </EuiPopoverTitle>
            {list}
            <EuiPopoverFooter paddingSize="s">
              <EuiButton
                size="s"
                fullWidth
                onClick={addMoreSpaces}
                disabled={isListExtended()}
              >
                Add more spaces
              </EuiButton>
            </EuiPopoverFooter>
          </>
        )}
      </EuiSelectable>
    </EuiPopover>
  )
}

const HeaderAppMenu = () => {
  const headerAppPopoverId = useGeneratedHtmlId({ prefix: 'headerAppPopover' })
  const headerAppKeyPadMenuId = useGeneratedHtmlId({
    prefix: 'headerAppKeyPadMenu',
  })

  const [isOpen, setIsOpen] = useState(false)

  const onMenuButtonClick = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const button = (
    <EuiHeaderSectionItemButton
      aria-controls={headerAppKeyPadMenuId}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label="Apps menu with 1 new app"
      notification="1"
      onClick={onMenuButtonClick}
    >
      <EuiIcon type="plus" size="m" />
    </EuiHeaderSectionItemButton>
  )

  return (
    <EuiPopover
      id={headerAppPopoverId}
      button={button}
      isOpen={isOpen}
      anchorPosition="downRight"
      closePopover={closeMenu}
    >
      <EuiKeyPadMenu id={headerAppKeyPadMenuId} style={{ width: 288 }}>
        <EuiKeyPadMenuItem label="Discover">
          <EuiIcon type="discoverApp" size="l" />
        </EuiKeyPadMenuItem>

        <EuiKeyPadMenuItem label="Dashboard">
          <EuiIcon type="dashboardApp" size="l" />
        </EuiKeyPadMenuItem>

        <EuiKeyPadMenuItem label="Dev Tools">
          <EuiIcon type="devToolsApp" size="l" />
        </EuiKeyPadMenuItem>

        <EuiKeyPadMenuItem label="Machine Learning">
          <EuiIcon type="machineLearningApp" size="l" />
        </EuiKeyPadMenuItem>

        <EuiKeyPadMenuItem label="Graph">
          <EuiIcon type="graphApp" size="l" />
        </EuiKeyPadMenuItem>

        <EuiKeyPadMenuItem label="Visualize">
          <EuiIcon type="visualizeApp" size="l" />
        </EuiKeyPadMenuItem>

        <EuiKeyPadMenuItem label="Timelion" betaBadgeLabel="Beta">
          <EuiIcon type="timelionApp" size="l" />
        </EuiKeyPadMenuItem>
      </EuiKeyPadMenu>
    </EuiPopover>
  )
}
/*
//@ts-ignore
const light = new URL('../../assets/light.mp3', import.meta.url)
const logo = new URL('../../assets/soundwave-596x419.png', import.meta.url)

const navLinks = ['tracks', 'mixes', 'sets']

export const TopNavbar = (props: { layoutStyle: object }) => {
  const darkMode = document.body.classList.contains('bp4-dark')

  const darkSwitch = (
    <div style={{ paddingTop: '10px', paddingRight: '5px' }}>
      <EuiButton
        onClick={() => {
          new Audio(light).play()
          db.appState.put(!darkMode, 'darkMode')
        }}
      >
        <EuiIcon type="apps" size="m" />
        </EuiButton>
    </div>
  )

  return (
    <Navbar
      style={{ height: '70px', padding: '10px 0' }}
      className="navbar-shadow"
    >
      <div style={props.layoutStyle}>
        <Navbar.Group>
          <EuiLink href="/">
            <img
              src={logo}
              height="48px"
              alt="MixPoint Logo"
              style={{ marginRight: '5px' }}
              id="headerLogo"
            />
          </EuiLink>
          <div className="initial-loader__row initial-loader">
            <h1>MixPoint</h1>
          </div>
          <Tabs
            animate={true}
            id="navbar"
            large={true}
            selectedTabId={location.pathname?.split('/')[1]}
          >
            {navLinks.map(target => (
              <Tab
                className="header-nav-text"
                key={target}
                id={target}
                title={
                  <NavLink to={`/${target}`} style={{ padding: '0 15px' }}>
                    {target.charAt(0).toUpperCase() + target.slice(1)}
                  </NavLink>
                }
              />
            ))}
          </Tabs>
        </Navbar.Group>

        <Navbar.Group align="right">{darkSwitch}</Navbar.Group>
      </div>
    </Navbar>
  )
}
*/
