import MixpointLogo from '#/app/components/MixpointLogo'
import { render, screen } from '#/app/tests/testSetup'
import { expect } from 'vitest'

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
