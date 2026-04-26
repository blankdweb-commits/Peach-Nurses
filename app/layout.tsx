import './globals.css'
import type { Metadata } from 'next'
import { UserProvider } from './context/UserContext'
import { AdminProvider } from './context/AdminContext'

export const metadata: Metadata = {
  title: 'Peach - AI Matchmaker',
  description: 'Personal AI Matchmaker for serious singles',
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
          </AdminProvider>
        </UserProvider>
      </body>
    </html>
  )
}
