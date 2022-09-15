import { render, screen, waitFor } from '../../test-setup'
import '@testing-library/jest-dom/extend-expect'
import { Tracks } from './tracks'

test('Dropzone is visible', () => {
  render(<Tracks />)
  const dropzone = waitFor(() => screen.getByText(/Add Tracks/))

  expect(dropzone).toBeVisible
})
