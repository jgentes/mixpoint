import Dropzone from '#/app/components/Dropzone'
import { render, screen } from '#/app/tests/testSetup'
import '@testing-library/jest-dom'
import { waitFor } from '@testing-library/react'
import { assert, expect, test } from 'vitest'

test('Dropzone is visible', () => {
  render(<Dropzone />)
  const dropzone = waitFor(() => screen.getByText(/Add Tracks/))

  expect(dropzone).toBeVisible
})
