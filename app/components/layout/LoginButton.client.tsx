import { IconButton, Modal, ModalDialog } from '@mui/joy'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

const supabase = createClient(
	window.ENV.SUPABASE_URL || '',
	window.ENV.SUPABASE_ANON_KEY || ''
)
//{ openAuth }: { openAuth: boolean }
const LoginButton = () => {
	const [openAuth, setOpenAuth] = useState(false)
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
			<Modal
				open={openAuth}
				onClose={() => setOpenAuth(false)}
				sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
			>
				<ModalDialog variant="outlined">
					<Auth
						supabaseClient={supabase}
						appearance={{ theme: ThemeSupa }}
						theme="dark"
					/>
				</ModalDialog>
			</Modal>
		</>
	)
}

export default LoginButton
