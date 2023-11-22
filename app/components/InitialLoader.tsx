// InitialLoader is used to hide the flash of unstyled content

import { Icon } from '@iconify-icon/react'
import { CircularProgress, styled } from '@mui/joy'
import Logo from '~/components/layout/MixpointLogo'

const LoaderWrapDiv = styled('div')`
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  position: fixed;
  z-index: 99999;
  background-color: 'background.appBody';
  transition: opacity 200ms cubic-bezier(0.215, 0.61, 0.355, 1);
`

const LoaderDiv = styled('div')`
  min-width: 190px;
  max-width: 30%;
`

const LoaderRow = styled('div')`
  line-height: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const LoaderSubtext = styled('span')(({ theme }) => ({
	color: theme.palette.text.primary
}))

const InitialLoader = ({ message }: { message?: string }) => (
	<LoaderWrapDiv>
		<LoaderDiv>
			<LoaderRow style={{ paddingBottom: '4px' }}>
				<Logo />
				{message ? (
					<Icon
						icon="material-symbols:warning"
						height="20px"
						style={{ alignSelf: 'center', color: 'action', paddingTop: '4px' }}
					/>
				) : (
					<CircularProgress color="primary" size="sm" variant="soft" />
				)}
			</LoaderRow>
			<LoaderRow style={{ borderTop: '1px solid #e2e2e2' }}>
				<LoaderSubtext>{message || 'Please Wait. Loading...'}</LoaderSubtext>
			</LoaderRow>
		</LoaderDiv>
	</LoaderWrapDiv>
)

export default InitialLoader
