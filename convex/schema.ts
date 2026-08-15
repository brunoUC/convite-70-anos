import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /*
   * Um documento por convidado, com a resposta embutida em vez de uma tabela
   * separada de RSVPs. A festa tem uma casa de centenas de convidados e a
   * pergunta é sempre "qual a resposta atual desta pessoa" — histórico de
   * quem mudou de ideia não muda decisão nenhuma sobre bufê.
   */
  partyGuests: defineTable({
    slug: v.string(), // trecho do link pessoal
    name: v.string(),
    nameKey: v.string(), // normalizado, para casar nome digitado com cadastro
    showIndex: v.number(), // música + animação
    youtubeId: v.optional(v.string()), // sobrepõe a música do show

    status: v.union(v.literal("pending"), v.literal("yes"), v.literal("no")),
    plusOne: v.boolean(),
    plusOneName: v.optional(v.string()),
    kids: v.number(),
    kidsNames: v.optional(v.string()),
    note: v.optional(v.string()),

    createdAt: v.string(),
    respondedAt: v.optional(v.string()),
    // "anfitriao" = cadastrado no painel; "convidado" = se apresentou pelo
    // link aberto. Separa quem foi convidado de quem apareceu.
    source: v.union(v.literal("anfitriao"), v.literal("convidado")),
  })
    .index("by_slug", ["slug"])
    .index("by_nameKey", ["nameKey"])
    .index("by_status", ["status"]),
});
