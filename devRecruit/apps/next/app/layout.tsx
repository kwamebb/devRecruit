import { StylesProvider } from './styles-provider'
import { Provider } from 'app/provider'
import './globals.css'

export const metadata = {
  title: 'DevRecruit - Developer Collaboration Platform',
  description: 'Connect with skilled developers for collaborations, code reviews, and project partnerships',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <StylesProvider>{children}</StylesProvider>
        </Provider>
      </body>
    </html>
  )
}
