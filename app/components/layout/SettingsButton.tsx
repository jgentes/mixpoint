import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip
} from '@nextui-org/react'
import type { Key } from 'react'
import { appState } from '~/api/models/appState.client'
import { SettingsIcon } from '~/components/icons'

const buttonAction = (key: Key) => {
  const clearLocalStorage = () => {
    localStorage.removeItem('mixState')
    localStorage.removeItem('userState')
    // refresh the page
    window.location.reload()
  }

  switch (key) {
    case 'localstorage':
      clearLocalStorage()
      break
    case 'indexeddb':
      appState.modal = {
        openState: true,
        headerText: 'Are you sure?',
        bodyText:
          'Clearing IndexedDB will remove all tracks, resetting Mixpoint to a fresh state.',
        confirmColor: 'danger',
        confirmText: 'Remove everything',
        onConfirm: async () => {
          appState.modal.openState = false

          indexedDB.deleteDatabase('MixpointDb')
          clearLocalStorage()
        },
        onCancel: async () => {
          appState.modal.openState = false
        }
      }
      break
  }
}

const SettingsButton = ({ className }: { className?: string }) => (
  <Dropdown>
    <Tooltip color="default" size="sm" content="Settings">
      <div>
        <DropdownTrigger>
          <Button
            isIconOnly
            id="settings"
            size="sm"
            radius="sm"
            variant="light"
            color="primary"
            aria-label="Settings"
            className={`${className} border-1 border-primary-300 rounded text-primary-700`}
          >
            <SettingsIcon className="text-2xl" />
          </Button>
        </DropdownTrigger>
      </div>
    </Tooltip>
    <DropdownMenu
      variant="faded"
      aria-label="Settings dropdown"
      onAction={buttonAction}
    >
      <DropdownItem key="localstorage" description="Fix issues with mix state">
        Clear LocalStorage
      </DropdownItem>
      <DropdownItem
        key="indexeddb"
        className="text-danger"
        color="danger"
        description="Fix everything else"
      >
        Clear IndexedDB
      </DropdownItem>
    </DropdownMenu>
  </Dropdown>
)

export default SettingsButton
