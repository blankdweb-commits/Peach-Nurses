import './globals.css'
import type { Metadata } from 'next'
import { UserProvider } from './context/UserContext'
import { AdminProvider } from './context/AdminContext'
import DevToolbar from './components/DevToolbar'

export const metadata: Metadata = {
  title: 'Peach - AI Matchmaker',
  description: 'Personal AI Matchmaker for serious singles',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <AdminProvider>
            {children}
            <DevToolbar />
          </AdminProvider>
        </UserProvider>
      </body>
    </html>
  )
}
