import { ThemeLoader } from '#/app/root'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import 'fake-indexeddb/auto'

const customRender = (ui: React.ReactElement) =>
  render(ui, { wrapper: () => <ThemeLoader noSplash={true} /> })

export { screen } from '@testing-library/react'
export { customRender as render }
