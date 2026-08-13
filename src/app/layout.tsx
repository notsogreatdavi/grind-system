import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Mono é a regra e Geist é a exceção (§10.1) — o inverso do design system,
 * porque o GRIND é a única superfície da identidade cujo conceito é o terminal.
 *
 * Os woff2 vêm do pacote @fontsource/victor-mono, copiados para o repo em vez
 * de instalados: 53 KB de arquivo versionado pesa menos que uma dependência
 * para servir três arquivos estáticos. O VictorMono Nerd Font do sistema não
 * serve para web (~2 MB por peso, e os ícones Nerd não são usados aqui).
 */
const victorMono = localFont({
  variable: "--font-mono-victor",
  display: "swap",
  src: [
    { path: "../fontes/victor-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fontes/victor-mono-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fontes/victor-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GRIND",
  description: "Sistema pessoal de organização e progressão com gramática de RPG.",
  manifest: "/manifest.webmanifest",
};

/** O celular precisa abrir isto como app, não como página (§9). */
export const viewport: Viewport = {
  themeColor: "#0C1018",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${victorMono.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
