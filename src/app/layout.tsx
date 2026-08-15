import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import './globals.css';

/**
 * Tres roles, tres familias (Playbook §3):
 *   Source Serif 4 → titulares. La serif dice documento y oficio.
 *   Inter          → interfaz y cuerpo. Legible en pantallas malas.
 *   JetBrains Mono → certificado. Dice "lo produjo una máquina y se verifica".
 *
 * Van por next/font para que no parpadeen al cargar.
 */

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--fuente-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fuente-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--fuente-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AMPARO · Justicia al alcance de todos',
  description:
    'Motor de decisión auditable aplicado a la acción de tutela. Entra una nota de voz. Sale una tutela lista para radicar — o un no, con razones y con ruta.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
