import { Accordion, AccordionItem } from '@nextui-org/react'
import { useSnapshot } from 'valtio'
import { uiState } from '~/api/models/appState.client'
import { ChevronIcon } from '~/components/icons'
import TrackTable from '~/components/tracks/TrackTable'

const TrackDrawer = () => {
  const { openDrawer } = useSnapshot(uiState)

  return (
    <Accordion
      isCompact
      hideIndicator
      className="absolute bottom-0 p-0"
      disableAnimation
      selectedKeys={openDrawer ? 'all' : []}
    >
      <AccordionItem
        key="track-drawer"
        aria-label="track-drawer"
        onPress={() => {
          uiState.openDrawer = !openDrawer
        }}
        title={
          <ChevronIcon
            className={`text-3xl text-default-600 ${
              openDrawer ? 'rotate-90' : '-rotate-90'
            }`}
          />
        }
        classNames={{
          base: 'border-t-1 border-primary-300 bg-default-50',
          trigger: 'p-0',
          titleWrapper: 'flex-row justify-center',
          content: 'px-4 pb-4 pt-1'
        }}
      >
        <TrackTable />
      </AccordionItem>
    </Accordion>
  )
}

export { TrackDrawer as default }
