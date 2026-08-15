import { GuestInvite } from "./GuestInvite";

/**
 * Convite pessoal: `/festa/c/<slug>`.
 *
 * `params` é Promise no App Router do Next 16, então a página é server
 * component só para desembrulhar o slug e entregar ao cliente, que é quem
 * consulta o Convex e reage a mudanças.
 */
export default async function ConvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GuestInvite slug={slug} />;
}
