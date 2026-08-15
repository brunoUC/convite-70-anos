"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

// Sem a variável o app subiria e quebraria só ao renderizar, com uma mensagem
// que não explica nada. Falhar aqui aponta direto para a configuração.
if (!url) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL não definida. Configure-a no projeto da Vercel " +
      "(e em .env.local para rodar localmente).",
  );
}

const convex = new ConvexReactClient(url);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
