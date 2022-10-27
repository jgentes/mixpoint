import { styled } from '@mui/joy'
import { NavLink } from '@remix-run/react'

const LogoText = styled('span')`
  font-family: 'Public Sans', Menlo, Courier, monospace;
  font-feature-settings: 'calt' 1, 'kern' 1, 'liga' 1;
  font-weight: 400;
  font-size: 22px;
  margin: 0;
  display: 'inline-block';
  background: linear-gradient(
    60deg,
    hsl(0, 75%, 50%) 5%,
    hsl(260, 75%, 50%) 35%,
    hsl(200, 75%, 50%) 65%,
    hsl(220, 75%, 50%) 95%
  );
  color: #fff;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke-width: thin;
  -webkit-text-stroke-color: rgb(255 255 255 / 35%);
`

const MixpointLogo = () => (
  <NavLink to="/" style={{ textDecoration: 'none' }}>
    <LogoText>Mixpoint</LogoText>
  </NavLink>
)

export default MixpointLogo
