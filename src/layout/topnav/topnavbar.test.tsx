import { render, screen } from '../../test-setup'
import '@testing-library/jest-dom/extend-expect'
import { TopNavbar } from './topnavbar'

test('Logo must have proper src and alt text', () => {
  render(<TopNavbar />)
  const logo = screen.getByRole('img', { name: 'DJ Set Editor Logo' })

  expect(logo).toBeVisible
})

test('Site title must appear in header', () => {
  render(<TopNavbar />)
  const headerText = screen.getByRole('heading', { name: 'site title' })

  // match whole content
  expect(headerText).toHaveTextContent(/^DJ Set Editor$/)
})

test('Nav links must exist', () => {
  render(<TopNavbar />)

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
