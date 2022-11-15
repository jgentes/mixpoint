import '@testing-library/jest-dom'
import { waitFor } from '@testing-library/react'
import { expect, assert, test } from 'vitest'
import Dropzone from '~/components/Dropzone'
import { render, screen } from '~/tests/testSetup'

test('Dropzone is visible', () => {
  render(<Dropzone />)
  const dropzone = waitFor(() => screen.getByText(/Add Tracks/))

  expect(dropzone).toBeVisible
})
