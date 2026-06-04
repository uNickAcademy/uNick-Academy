export const metadata = {
  title: 'uNick Academy',
  description: 'Angielski, który naprawdę działa.',
}
export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body style={{ margin:0, padding:0 }}>{children}</body>
    </html>
  )
}

