import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { headcount, nameKey, showById, validateRsvp, type RsvpDraft } from "./lib/party";

/**
 * Backend do convite.
 *
 * ATENÇÃO — NÃO HÁ CONTROLE DE ACESSO AQUI. Foi decisão consciente: o painel
 * dos anfitriões é apenas um endereço pouco óbvio, `/festaadmin`, sem senha.
 *
 * O que isso significa na prática, para quem for mexer nisso depois: as
 * funções abaixo são públicas no deployment do Convex, e a URL do deployment
 * viaja no bundle do navegador (`NEXT_PUBLIC_CONVEX_URL`). Qualquer pessoa com
 * o link do convite consegue chamar `list` pelo console e ler a lista inteira
 * — nomes, recados e quem recusou —, e consegue chamar `removeGuest` para
 * apagar uma resposta. O endereço secreto esconde o painel, não os dados.
 *
 * Trate isto como uma lista de festa, que é o que é. Se um dia guardar aqui
 * qualquer coisa que não possa vazar, o controle de acesso precisa voltar.
 */

// ── Leitura pública ────────────────────────────────────

/**
 * Contagem exibida no convite ("já somos 43 na pista").
 *
 * Só números: quem confirmou é assunto dos anfitriões, e um convidado não
 * precisa descobrir pelo site que outro recusou.
 */
export const publicCount = query({
  args: {},
  handler: async (ctx) => {
    const guests = await ctx.db
      .query("partyGuests")
      .withIndex("by_status", (q) => q.eq("status", "yes"))
      .collect();
    let adults = 0;
    let kids = 0;
    for (const g of guests) {
      const h = headcount(g);
      adults += h.adults;
      kids += h.kids;
    }
    return { adults, kids, total: adults + kids };
  },
});

// ── Resposta do convidado ──────────────────────────────

/**
 * Grava a resposta.
 *
 * Casa pelo nome normalizado antes de inserir: responder de novo sobrescreve,
 * em vez de criar uma segunda linha. Mudar de ideia é normal, e com link único
 * a pessoa volta pelo mesmo endereço.
 */
export const respond = mutation({
  args: {
    name: v.string(),
    status: v.union(v.literal("yes"), v.literal("no")),
    plusOne: v.boolean(),
    plusOneName: v.string(),
    kids: v.number(),
    kidsNames: v.string(),
    note: v.string(),
    showId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft: RsvpDraft = {
      name: args.name,
      status: args.status,
      plusOne: args.plusOne,
      plusOneName: args.plusOneName,
      kids: args.kids,
      kidsNames: args.kidsNames,
      note: args.note,
    };
    // Mesma validação que a UI roda enquanto se digita. A do navegador é
    // conveniência; esta é a que vale.
    const errors = validateRsvp(draft);
    if (Object.keys(errors).length > 0) {
      throw new Error(Object.values(errors).join("; "));
    }

    const name = args.name.trim().replace(/\s+/g, " ");
    const key = nameKey(name);
    const now = new Date().toISOString();

    const fields = {
      name,
      nameKey: key,
      status: args.status,
      plusOne: args.status === "yes" && args.plusOne,
      plusOneName: args.plusOneName.trim() || undefined,
      kids: args.status === "yes" ? args.kids : 0,
      kidsNames: args.kidsNames.trim() || undefined,
      note: args.note.trim() || undefined,
      showId: args.showId,
      respondedAt: now,
    };

    const existing = await ctx.db
      .query("partyGuests")
      .withIndex("by_nameKey", (q) => q.eq("nameKey", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { atualizou: true };
    }

    await ctx.db.insert("partyGuests", { ...fields, createdAt: now });
    return { atualizou: false };
  },
});

// ── Painel dos anfitriões ──────────────────────────────

/** Lista completa e totais. Pública — ver o aviso no topo do arquivo. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const guests = await ctx.db.query("partyGuests").collect();
    guests.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const totals = { adults: 0, kids: 0, total: 0, yes: 0, no: 0, respostas: guests.length };
    for (const g of guests) {
      totals[g.status === "yes" ? "yes" : "no"]++;
      const h = headcount(g);
      totals.adults += h.adults;
      totals.kids += h.kids;
      totals.total += h.total;
    }

    return {
      totals,
      guests: guests.map((g) => ({
        id: g._id,
        name: g.name,
        status: g.status,
        plusOne: g.plusOne,
        plusOneName: g.plusOneName ?? "",
        kids: g.kids,
        kidsNames: g.kidsNames ?? "",
        note: g.note ?? "",
        showLabel: g.showId ? (showById(g.showId)?.label ?? "") : "",
        respondedAt: g.respondedAt,
      })),
    };
  },
});

/** Remove uma resposta da lista. */
export const removeGuest = mutation({
  args: { id: v.id("partyGuests") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { ok: true };
  },
});
