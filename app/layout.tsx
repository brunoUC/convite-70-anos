import type { Metadata, Viewport } from "next";
import { Caveat, Poppins } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { HOST_NAMES, PARTY, TOTAL_AGE, longDate } from "../convex/lib/party";
import "./globals.css";

/*
 * As duas vozes tipográficas do save-the-date.
 *
 * Caveat faz o letreiro manuscrito ("SAVE THE DATE", os nomes, a data).
 * Poppins Light carrega o lockup "70 years", que no impresso é uma geométrica
 * fina e larga, e também o texto corrido.
 *
 * Auto-hospedadas pelo next/font: baixadas no build e servidas do mesmo
 * domínio, sem requisição a fonts.googleapis.com antes do primeiro texto.
 */
const mao = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-mao",
  display: "swap",
});

const corpo = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-corpo",
  display: "swap",
});

export const metadata: Metadata = {
  // Base absoluta para o card de compartilhamento: o WhatsApp não resolve
  // caminho relativo, e sem isto a imagem não aparece na prévia do link.
  metadataBase: new URL("https://convite-70-anos.vercel.app"),
  title: `${HOST_NAMES} · ${TOTAL_AGE} anos`,
  description: `Save the date — birthday party do ${HOST_NAMES}. ${longDate(PARTY.date)}. Confirme sua presença.`,
  // Sem indexação: o convite é para quem recebeu o link, não para quem
  // procurar o nome dos dois no Google.
  robots: { index: false, follow: false },
  openGraph: {
    title: `${HOST_NAMES} · ${TOTAL_AGE} years combined`,
    description: `${longDate(PARTY.date)}. Abra o convite — com som.`,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  // Barra do navegador no creme da marca: a faixa branca padrão cortava o
  // topo da página no celular.
  themeColor: "#f6f2e8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${mao.variable} ${corpo.variable}`}>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
