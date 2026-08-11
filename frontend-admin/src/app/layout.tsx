import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'La Anónima Admin - Control Center',
  description: 'Panel de control de scraping y monitoreo de precios por sucursales',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
