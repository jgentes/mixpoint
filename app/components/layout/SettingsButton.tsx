import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip
} from '@nextui-org/react'
import type { Key } from 'react'
import { clearAppState, uiState } from '~/api/models/appState.client'
import { SettingsIcon } from '~/components/icons'

const buttonAction = (key: Key) => {
  const clearLocalStorage = async () => {
    await clearAppState()
    // refresh the page
    window.location.reload()
  }

  switch (key) {
    case 'appstate':
      clearLocalStorage()
      break
    case 'indexeddb':
      uiState.modal = {
        openState: true,
        headerText: 'Are you sure?',
        bodyText:
          'Clearing IndexedDB will remove all tracks, resetting Mixpoint to a fresh state. No files will be deleted from your computer.',
        confirmColor: 'danger',
        confirmText: 'Remove everything',
        onConfirm: async () => {
          uiState.modal.openState = false

          indexedDB.deleteDatabase('MixpointDb')
          clearLocalStorage()
        },
        onCancel: async () => {
          uiState.modal.openState = false
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
      <DropdownItem key="appstate" description="Fix issues with mix state">
        Clear Mixpoint State
      </DropdownItem>
      <DropdownItem
        key="indexeddb"
        className="text-danger"
        color="danger"
        description="Remove Mixpoint data from IndexedDB"
      >
        Clear Mixpoint Data
      </DropdownItem>
    </DropdownMenu>
  </Dropdown>
)

export default SettingsButton
