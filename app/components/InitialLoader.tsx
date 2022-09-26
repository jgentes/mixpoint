import { styled } from '@mui/joy'
import { CircularProgress } from '@mui/material'

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
`

const LoaderRow = styled('div')`
  font-family: 'Roboto Mono', Menlo, Courier, monospace;
  line-height: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const LoaderSubtext = styled('span')(({ theme }) => ({
  color: theme.palette.text.primary,
}))

const LoaderText = styled('p')`
  font-feature-settings: 'calt' 1, 'kern' 1, 'liga' 1;
  font-weight: 400;
  font-size: 22px;
  margin: 0;
  background: linear-gradient(
    60deg,
    hsl(0, 75%, 50%) 5%,
    hsl(260, 75%, 50%) 35%,
    hsl(200, 75%, 50%) 65%,
    hsl(220, 75%, 50%) 95%
  );
  color: #fff;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke-width: thin;
  -webkit-text-stroke-color: rgb(255 255 255 / 35%);
`

export const InitialLoader: React.FunctionComponent<{ message?: string }> = ({
  message,
}) => {
  return (
    <LoaderWrapDiv>
      <LoaderDiv>
        <LoaderRow style={{ paddingBottom: '4px' }}>
          <LoaderText>Mixpoint</LoaderText>
          {message ? null : <CircularProgress color="primary" size="18px" />}
        </LoaderRow>
        <LoaderRow style={{ borderTop: '1px solid #e2e2e2' }}>
          <LoaderSubtext>{message || 'Please Wait. Loading...'}</LoaderSubtext>
        </LoaderRow>
      </LoaderDiv>
    </LoaderWrapDiv>
  )
}
