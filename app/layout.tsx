import type { Metadata, Viewport } from "next";
import { Monoton, Space_Grotesk } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { HOST_NAMES, PARTY, TOTAL_AGE, longDate } from "../convex/lib/party";
import "./globals.css";

/*
 * Fontes auto-hospedadas pelo next/font: baixadas no build e servidas do
 * mesmo domínio, sem requisição a fonts.googleapis.com antes do primeiro
 * texto. Numa página cuja graça é abrir rápido e estourar, isso conta.
 *
 * Monoton é a fonte do "70" em neon — desenhada com traços vazados, ela já
 * é o letreiro; Space Grotesk carrega o resto.
 */
const display = Monoton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-festa",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${HOST_NAMES} · ${TOTAL_AGE} anos`,
  description: `Festa de ${TOTAL_AGE} anos do ${HOST_NAMES} — ${longDate(PARTY.date)}. Confirme sua presença.`,
  // Sem indexação: o convite é para quem recebeu o link, não para quem
  // procurar o nome dos dois no Google.
  robots: { index: false, follow: false },
  openGraph: {
    title: `${HOST_NAMES} · ${TOTAL_AGE} anos`,
    description: `${longDate(PARTY.date)}. Abra o convite — com som.`,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  // Barra do navegador no tom da página: no celular, a faixa branca padrão
  // cortava o topo da noite.
  themeColor: "#0b0614",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${grotesk.variable}`}>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
