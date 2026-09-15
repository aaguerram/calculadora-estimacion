import { Theme } from '@carbon/react'
import type { ReactNode } from 'react'

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * Provider de tema. El tema "warm light" se define en SCSS
 * (app/styles/_warm-light-theme.scss) y se aplica sobre la base `white`.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <Theme theme="white">{children}</Theme>
}
