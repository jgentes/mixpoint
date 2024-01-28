import { Button, Input, Modal, ModalContent } from '@nextui-org/react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { AppwriteService } from '~/AppwriteService'
import { appState, setAppState } from '~/api/db/appState.client'

const LoginButton = () => {
	const [openAuth, setOpenAuth] = useState(false)
	const { theme } = useTheme()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [modalType, setModalType] = useState('success')
	const [modalMessage, setModalMessage] = useState('')
	const [modalState, setModalState] = useState(false)

	const [loggedIn] = appState.loggedIn()
	const buttonText = loggedIn ? 'Log Out' : 'Log In'

	async function onCreateSession(event: any) {
		event.preventDefault()
		const dialog: any = document.getElementById('dialog')

		setLoading(true)
		try {
			await fetch('/login', {
				method: 'POST',
				body: ''
			})

			setAppState.loggedIn(email || 'test@test.com')

			setModalType('success')
			setModalMessage(
				'Session created! Refresh page to run SSR check, or re-fetch to run CSR cehck.'
			)
			dialog.showModal()
		} catch (err: any) {
			setModalType('error')
			setModalMessage(err.message)
			dialog.showModal()
		} finally {
			setLoading(false)
		}
	}

	async function onDeleteSession(event: any) {
		event.preventDefault()

		const dialog: any = document.getElementById('dialog')

		setLoading(true)
		try {
			await AppwriteService.signOut()

			setModalType('success')
			setModalMessage(
				'Session deleted! Refresh page to run SSR check, or re-fetch to run CSR cehck.'
			)
			dialog.showModal()
		} catch (err: any) {
			setModalType('error')
			setModalMessage(err.message)
			dialog.showModal()
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<Button
				id="login-button"
				size="sm"
				radius="sm"
				className="border-1 border-primary-300 rounded text-primary-700 font-semibold"
				variant="light"
				color="primary"
				aria-label={loggedIn || buttonText}
				onClick={async () => {
					loggedIn ? onDeleteSession : setModalState(true)
				}}
			>
				{buttonText}
			</Button>
			<Modal
				isOpen={openAuth}
				className="p-6"
				size="xs"
				onClose={() => setModalState(false)}
			>
				<ModalContent className="bg-primary-50">
					<Input id="email" color="default" placeholder="Email" />
					<Input id="password" color="default" placeholder="Password" />
					<Button
						size="sm"
						radius="sm"
						variant="flat"
						color="success"
						onSubmit={onCreateSession}
					>
						Log In
					</Button>
					{/* <Auth
						supabaseClient={supabase}
						appearance={{
							theme: ThemeSupa,
							variables: {
								default: {
									colors: {
										brand: '#0059b2',
										brandAccent: '#003fb2'
									}
								}
							}
						}}
						providers={['google', 'github']}
						socialLayout="horizontal"
						theme={theme === 'dark' ? 'dark' : 'light'}
					/> */}
				</ModalContent>
			</Modal>
		</>
	)
}

export default LoginButton
