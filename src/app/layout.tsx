import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Store | Master Directory',
  description: 'The world\'s most curated directory of AI tools. Filter by capability, explore deep-dive tutorials, and optimize your API costs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
