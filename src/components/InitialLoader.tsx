import { styled } from '@mui/joy'
import { keyframes } from '@emotion/react'

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
  color: #212529;
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

const spinKeyframes = keyframes`
  100% {
    transform: rotate(360deg);
  }
`

const LoaderCircle = styled('svg')`
  transform-origin: 50% 50%;
  animation: ${spinKeyframes} 0.5s linear infinite;
`

export const InitialLoader: React.FunctionComponent = () => (
  <LoaderWrapDiv>
    <LoaderDiv>
      <LoaderRow>
        <LoaderText>Mixpoint</LoaderText>
        <LoaderCircle
          version="1.1"
          id="loader-circle"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="30px"
          height="30px"
          viewBox="0 0 40 40"
          enableBackground="new 0 0 40 40"
          xmlSpace="preserve"
        >
          <g>
            <path
              fill="#e7e7e7"
              d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"
            />
            <path
              fill="#1EB7FF"
              d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z"
            ></path>
          </g>
        </LoaderCircle>
      </LoaderRow>
      <LoaderRow style={{ borderTop: '1px solid #e2e2e2' }}>
        <LoaderSubtext>Please Wait. Loading...</LoaderSubtext>
      </LoaderRow>
    </LoaderDiv>
  </LoaderWrapDiv>
)
