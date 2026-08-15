"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { HOST_NAMES } from "../../../convex/lib/party";
import { Invite } from "../../Invite";

/**
 * Busca o convidado do slug e monta o convite.
 *
 * Link inválido cai no convite aberto em vez de num 404. Alguém que recebeu o
 * endereço truncado pelo WhatsApp — acontece o tempo todo com link comprido —
 * ainda consegue confirmar digitando o nome, que é o que a festa precisa.
 */
export function GuestInvite({ slug }: { slug: string }) {
  const guest = useQuery(api.party.bySlug, { slug });

  if (guest === undefined) {
    return (
      <main className="festa-root curtain">
        <div className="curtain-inner">
          <p className="curtain-kicker">abrindo…</p>
        </div>
      </main>
    );
  }

  if (guest === null) {
    return (
      <main className="festa-root curtain">
        <div className="curtain-inner">
          <p className="curtain-kicker">este link não existe mais</p>
          <p className="curtain-names">{HOST_NAMES}</p>
          <a className="curtain-btn" href="/">
            confirmar pelo nome
          </a>
        </div>
      </main>
    );
  }

  return <Invite slug={slug} guest={guest} />;
}
