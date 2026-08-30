import { ImageResponse } from "next/og";
import { HOST_NAMES, PARTY, TOTAL_AGE, longDate } from "../convex/lib/party";

/*
 * O card que aparece quando o link é colado no WhatsApp.
 *
 * É a primeira coisa que o convidado vê — antes de decidir se toca no link.
 * Sem isto, o WhatsApp mostra só o endereço cru e o convite parece spam.
 *
 * Fonte padrão de propósito: usar a Caveat aqui exigiria baixar o arquivo da
 * fonte no build, e o ganho não paga o risco de o build passar a depender de
 * uma requisição externa. O que carrega a marca aqui é a cor e o "70".
 */

export const alt = `${HOST_NAMES} — ${TOTAL_AGE} anos`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  // Satori exige `display` explícito em toda div com mais de um filho, e não
  // aceita dois nós de texto irmãos — daí cada linha ser uma string só.
  const linha = `${longDate(PARTY.date)} · ${PARTY.place}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f6f2e8",
          color: "#1b40c6",
          padding: "0 90px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 6 }}>SAVE THE DATE</div>

        <div style={{ display: "flex", alignItems: "flex-end", marginTop: 18 }}>
          <div style={{ display: "flex", fontSize: 210, fontWeight: 300, lineHeight: 0.9 }}>
            {String(TOTAL_AGE)}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 18,
              paddingBottom: 26,
            }}
          >
            <div style={{ display: "flex", fontSize: 92, fontWeight: 300, lineHeight: 1 }}>
              years
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 500 }}>Combined</div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 54, fontWeight: 600, marginTop: 24 }}>
          {HOST_NAMES}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#5f72b5", marginTop: 12 }}>
          {linha}
        </div>
      </div>
    ),
    size,
  );
}
