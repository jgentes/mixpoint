import { expect } from 'vitest'
import MixpointLogo from '~/components/layout/MixpointLogo'
import { render, screen } from '~/tests/testSetup'

beforeAll(() => render(<MixpointLogo />))

test('Logo must be visible and link to /', () => {
  const logoText = screen.getByText('Mixpoint')
  expect(logoText).toBeVisible
})

test('Logo must link to /', () => {
  const logoText = screen.getByText('Mixpoint')
  const link = logoText.getAttribute('href')
  expect(link).toEqual('/')
})
