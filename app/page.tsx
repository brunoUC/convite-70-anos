import { Invite } from "./Invite";

/**
 * Convite aberto: quem chega sem link pessoal se apresenta digitando o nome.
 *
 * Vale porque nem todo convidado vai receber o link individual — alguém
 * repassa o endereço da festa no grupo da família e a pessoa cai aqui. O
 * `respond` casa o nome digitado com o cadastro, então responder por aqui
 * não duplica quem já estava na lista.
 */
export default function Home() {
  return <Invite />;
}
