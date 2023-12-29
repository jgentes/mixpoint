import {
	Button,
	Divider,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader
} from '@nextui-org/react'
import { modalState } from '~/api/db/appState'
import { WarningIcon } from '~/components/icons'

const ConfirmModal = () => {
	const [confirmModal] = modalState()
	const [openState, setOpenState] = modalState.openState()

	const closeModal = () => setOpenState(false)

	const {
		headerText = 'Are you sure?',
		bodyText = '',
		confirmColor = 'danger',
		confirmText = 'Confirm',
		onConfirm = () => closeModal(),
		onCancel = () => closeModal()
	} = confirmModal

	return (
		<Modal
			aria-labelledby="alert-dialog-modal-title"
			aria-describedby="alert-dialog-modal-description"
			isOpen={openState || false}
			className="flex items-normal border-1 border-divider"
			onClose={() => closeModal()}
			backdrop="opaque"
		>
			<ModalContent
				role="alertdialog"
				//sx={{ borderColor: 'action.focus' }}
			>
				<ModalHeader
					id="alert-dialog-modal-title"
					//sx={{ display: 'flex', alignItems: 'normal' }}
				>
					<WarningIcon className="self-center text-xl mr-2" />
					{headerText}
				</ModalHeader>
				<Divider className="my-1" />
				<ModalBody id="alert-dialog-modal-description">{bodyText}</ModalBody>
				<div className="flex gap-2 justify-end m-3">
					<Button
						variant="faded"
						color="default"
						size="sm"
						radius="sm"
						onClick={() => onCancel()}
					>
						Cancel
					</Button>
					<Button
						size="sm"
						radius="sm"
						variant="flat"
						color={confirmColor}
						onClick={() => onConfirm()}
					>
						{confirmText}
					</Button>
				</div>
			</ModalContent>
		</Modal>
	)
}

export { ConfirmModal as default }
