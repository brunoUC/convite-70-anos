import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /*
   * Uma linha por pessoa que respondeu.
   *
   * Não há convidado pré-cadastrado: o link é o mesmo para todo mundo, então
   * quem está aqui é exatamente quem respondeu. Some com isso o estado "sem
   * resposta" — não dá para saber quem faltou quando não existe lista de
   * quem foi convidado, e essa contagem não é necessária para a festa.
   */
  partyGuests: defineTable({
    name: v.string(),
    /** Normalizado: casa quem responde de novo com a linha que já existe. */
    nameKey: v.string(),

    status: v.union(v.literal("yes"), v.literal("no")),
    plusOne: v.boolean(),
    plusOneName: v.optional(v.string()),
    kids: v.number(),
    kidsNames: v.optional(v.string()),
    note: v.optional(v.string()),

    /** Qual show a pessoa pegou. Só curiosidade, exibida no painel. */
    showId: v.optional(v.string()),

    createdAt: v.string(),
    respondedAt: v.string(),
  })
    .index("by_nameKey", ["nameKey"])
    .index("by_status", ["status"]),
});
