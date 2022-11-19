import { expect } from 'vitest'
import Header from '~/components/Header'
import { render, screen } from '~/tests/testSetup'

test('Logo must have proper src and alt text', () => {
  render(<Header />)
  const logo = screen.getByRole('img', { name: 'Mixpoint Logo' })

  expect(logo).toBeVisible
})

test('Site title must appear in header', () => {
  render(<Header />)
  const headerText = screen.getByRole('heading', { name: 'site title' })

  // match whole content
  expect(headerText).toHaveTextContent(/^Mixpoint$/)
})

test('Nav links must exist', () => {
  render(<Header />)

  const tracks = screen.getByRole('link', { name: 'Tracks' })
  const mixes = screen.getByRole('link', { name: 'Mixes' })
  const sets = screen.getByRole('link', { name: 'Sets' })

  expect(tracks).toHaveAttribute('href', '/tracks')
  expect(tracks).toHaveClass('nav-link')

  expect(mixes).toHaveAttribute('href', '/mixes')
  expect(mixes).toHaveClass('nav-link')

  expect(sets).toHaveAttribute('href', '/sets')
  expect(sets).toHaveClass('nav-link')
})
