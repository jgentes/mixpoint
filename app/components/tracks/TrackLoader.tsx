import { keyframes } from '@emotion/react'
import { styled } from '@mui/joy'

const delay = keyframes`
  0%,
  40%,
  100% {
    transform: scaleY(0.05);
    -webkit-transform: scaleY(0.05);
  }
  20% {
    transform: scaleY(1);
    -webkit-transform: scaleY(1);
  }
`
const LoaderWrapper = styled('div')`
  width: 60px;
  height: 25px;
  text-align: center;
  font-size: 10px;
`
const LoaderDiv = styled('div')`
  height: 100%;
  width: 8px;
  float: left;
  margin-left: 2px;
  -webkit-animation: ${delay} 0.8s infinite ease-in-out;
  animation: ${delay} 0.8s infinite ease-in-out;

  &.bar1 {
    background-color: #754fa0;
  }
  &.bar2 {
    background-color: #09b7bf;
    -webkit-animation-delay: -0.7s;
    animation-delay: -0.7s;
  }
  &.bar3 {
    background-color: #90d36b;
    -webkit-animation-delay: -0.6s;
    animation-delay: -0.6s;
  }
  &.bar4 {
    background-color: #f2d40d;
    -webkit-animation-delay: -0.5s;
    animation-delay: -0.5s;
  }
  &.bar5 {
    background-color: #fcb12b;
    -webkit-animation-delay: -0.4s;
    animation-delay: -0.4s;
  }
  &.bar6 {
    background-color: #ed1b72;
    -webkit-animation-delay: -0.3s;
    animation-delay: -0.3s;
  }
`

const TrackLoader = (props: {
	className?: string
	style?: Record<string, unknown>
}): JSX.Element => (
	<LoaderWrapper
		style={{ height: '3px', ...props.style }}
		className={`loader ${props.className}`}
	>
		<LoaderDiv className="bar1" />
		<LoaderDiv className="bar2" />
		<LoaderDiv className="bar3" />
		<LoaderDiv className="bar4" />
		<LoaderDiv className="bar5" />
		<LoaderDiv className="bar6" />
	</LoaderWrapper>
)

export default TrackLoader
