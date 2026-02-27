import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/components/common/QueryProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ML-Ecommerce — Mua sắm thông minh với AI',
    template: '%s | ML-Ecommerce',
  },
  description: 'Nền tảng thương mại điện tử tích hợp AI gợi ý sản phẩm thông minh. Khám phá hàng nghìn sản phẩm được cá nhân hóa cho bạn.',
  keywords: ['ecommerce', 'mua sắm online', 'AI recommendation', 'machine learning', 'gợi ý sản phẩm'],
  authors: [{ name: 'ML-Ecommerce Team' }],
  creator: 'ML-Ecommerce',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://ml-ecommerce.com',
    title: 'ML-Ecommerce — Mua sắm thông minh với AI',
    description: 'Nền tảng thương mại điện tử tích hợp AI gợi ý sản phẩm thông minh',
    siteName: 'ML-Ecommerce',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ML-Ecommerce',
    description: 'Mua sắm thông minh với AI',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
