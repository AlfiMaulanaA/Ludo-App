import './globals.css';

export const metadata = {
  title: 'Ludo App — Developed by maul.dev',
  description:
    'Game Ludo modern yang colorful oleh maul.dev: Local Pass & Play, lawan Bot AI, dan multiplayer online real-time. Gratis dimainkan di browser.',
  keywords: ['Ludo', 'game ludo online', 'board game', 'multiplayer', 'Next.js', 'maul.dev'],
  icons: {
    icon: '/icon.jpeg',
    shortcut: '/icon.jpeg',
    apple: '/app-logo.jpeg'
  },
  openGraph: {
    title: 'Ludo App — Developed by maul.dev',
    description: 'Main Ludo bareng teman — offline maupun online.',
    type: 'website',
    images: ['/app-logo.jpeg']
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="bg-scene" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
