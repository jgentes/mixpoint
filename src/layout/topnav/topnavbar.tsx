import { db } from '../../db'
import {
  EuiHeader,
  EuiHeaderBreadcrumbs,
  EuiHeaderLogo,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiLink,
  EuiSelectableMessage,
  EuiSelectableTemplateSitewide,
  useEuiTheme,
} from '@elastic/eui'

import Logo from '../../assets/soundwave-24.png'
const SEARCH_ICON = '../../../node_modules/@tabler/icons/icons/search.svg'
const SUN_ICON = '../../../node_modules/@tabler/icons/icons/sun.svg'

const light = new URL('../../assets/light.mp3', import.meta.url)

export const TopNavbar = () => {
  const theme = useEuiTheme()

  const renderLogo = () => (
    <EuiHeaderLogo
      iconType={Logo}
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
        <EuiHeaderSectionItemButton aria-label="Search">
          <EuiIcon type={SEARCH_ICON} />
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
      </EuiHeaderSection>

      {renderBreadcrumbs()}

      <EuiHeaderSection side="right">
        <EuiHeaderSectionItem>{search}</EuiHeaderSectionItem>

        <EuiHeaderSectionItem>
          <EuiHeaderSectionItemButton
            onClick={() => {
              new Audio(light.href).play()
              db.appState.put(
                theme.colorMode == 'DARK' ? 'LIGHT' : 'DARK',
                'colorMode'
              )
            }}
          >
            <EuiIcon type={SUN_ICON} />
          </EuiHeaderSectionItemButton>
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  )
}
