import { IconButton, Modal, ModalDialog } from '@mui/joy'
import { useColorScheme } from '@mui/joy'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

const supabase = createClient(
	window.ENV.SUPABASE_URL,
	window.ENV.SUPABASE_ANON_KEY
)

const LoginButton = () => {
	const [openAuth, setOpenAuth] = useState(false)
	const { mode } = useColorScheme()

	return (
		<>
			<IconButton
				id="login-button"
				size="sm"
				sx={{ px: 1 }}
				variant="outlined"
				color="primary"
				aria-label="Log In"
				onClick={() => setOpenAuth(true)}
			>
				Log In
			</IconButton>
			<Modal open={openAuth} onClose={() => setOpenAuth(false)}>
				<ModalDialog sx={{ backgroundColor: 'background.surface' }}>
					<Auth
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
						providers={['google']}
						theme={mode}
					/>
				</ModalDialog>
			</Modal>
		</>
	)
}

export default LoginButton
