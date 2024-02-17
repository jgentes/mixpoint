import {
	Button,
	Checkbox,
	Divider,
	Input,
	Link,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader
} from '@nextui-org/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { AppwriteService, account } from '~/AppwriteService'
import { appState, setAppState } from '~/api/db/appState.client'
import { GithubIcon, GoogleIcon } from '~/components/icons'
import { errorHandler } from '~/utils/notifications'

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

	const useOAuth = async (provider: 'google' | 'github') => {
		try {
			account.createOAuth2Session(
				provider,
				window.location.origin,
				window.location.origin
			)
		} catch (err) {
			errorHandler(err as Error)
		}
		// this code below never runs on successful auth because it redirects back to the app
		// the loggged in logic should be in root useeffect
		try {
			const session = await account.getSession('current')
			console.log('session:', session)
			//setAppState.loggedIn(session.email)
		} catch (err) {
			console.error('not authorized:', err)
		}
	}
	console.log('logged in:', loggedIn)

	// async function onCreateSession(event: any) {
	// 	event.preventDefault()
	// 	const dialog: any = document.getElementById('dialog')

	// 	setLoading(true)
	// 	try {
	// 		await fetch('/login', {
	// 			method: 'POST',
	// 			body: ''
	// 		})

	// 		setAppState.loggedIn(email || 'test@test.com')

	// 		setModalType('success')
	// 		setModalMessage(
	// 			'Session created! Refresh page to run SSR check, or re-fetch to run CSR cehck.'
	// 		)
	// 		dialog.showModal()
	// 	} catch (err: any) {
	// 		setModalType('error')
	// 		setModalMessage(err.message)
	// 		dialog.showModal()
	// 	} finally {
	// 		setLoading(false)
	// 	}
	// }

	async function deleteSession() {
		try {
			await AppwriteService.signOut()

			console.log(
				'Session deleted! Refresh page to run SSR check, or re-fetch to run CSR cehck.'
			)
		} catch (err) {
			console.log(err)
		}
	}

	return (
		<>
			<Button
				id="logout-button"
				size="sm"
				radius="sm"
				className="border-1 border-primary-300 rounded text-primary-700 font-semibold"
				variant="light"
				color="primary"
				aria-label={loggedIn || buttonText}
				onClick={deleteSession}
			>
				Log Out
			</Button>
			<Button
				id="login-button"
				size="sm"
				radius="sm"
				className="border-1 border-primary-300 rounded text-primary-700 font-semibold"
				variant="light"
				color="primary"
				aria-label={loggedIn || buttonText}
				onClick={async () => {
					loggedIn ? deleteSession : setModalState(true)
				}}
			>
				{buttonText}
			</Button>
			<Modal isOpen={modalState} size="lg" onClose={() => setModalState(false)}>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">Log in</ModalHeader>
					<ModalBody>
						<div className="flex justify-between items-center">
							<Button
								className="flex-1 mr-6 border-1 border-primary-300"
								radius="sm"
								variant="flat"
								color="default"
								size="md"
								startContent={<GoogleIcon />}
								onPress={() => useOAuth('google')}
							>
								Log in with Google
							</Button>
							<Button
								className="flex-1 ml-6 border-1 border-primary-300"
								radius="sm"
								variant="flat"
								color="default"
								size="md"
								startContent={<GithubIcon />}
								onPress={() => useOAuth('github')}
							>
								Log in with GitHub
							</Button>
						</div>
						<div className="flex justify-between items-center">
							<Divider className="flex-1" />
							<div className="px-4">OR</div>
							<Divider className="flex-1" />
						</div>
						<Input
							autoFocus
							label="Email"
							placeholder="Enter your email"
							variant="bordered"
							radius="sm"
						/>
						<Input
							label="Password"
							placeholder="Enter your password"
							type="password"
							variant="bordered"
							radius="sm"
						/>
						<div className="flex py-2 px-1 justify-between">
							<Checkbox
								radius="sm"
								classNames={{
									label: 'text-small'
								}}
							>
								Remember me
							</Checkbox>
							<Link color="primary" href="#" size="sm">
								Forgot password?
							</Link>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button
							variant="faded"
							color="default"
							size="sm"
							radius="sm"
							onPress={() => setModalState(false)}
						>
							Close
						</Button>
						<Button
							size="sm"
							radius="sm"
							variant="flat"
							color="success"
							onPress={() => {}}
						>
							Sign in
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	)
}

export default LoginButton
