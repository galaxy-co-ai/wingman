import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wingman - A Claude Code GUI with Live Preview',
  description: 'A native desktop app that wraps Claude CLI with a beautiful GUI, live code preview, and project management.',
  openGraph: {
    title: 'Wingman - A Claude Code GUI with Live Preview',
    description: 'A native desktop app that wraps Claude CLI with a beautiful GUI, live code preview, and project management.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
