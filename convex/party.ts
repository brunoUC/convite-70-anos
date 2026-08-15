import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  headcount,
  makeSlug,
  nameKey,
  showAt,
  showIndexFor,
  validateRsvp,
  type RsvpDraft,
} from "./lib/party";

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
 * apagar convidado. O endereço secreto esconde o painel, não os dados.
 *
 * Trate isto como uma lista de festa, que é o que é. Se um dia guardar aqui
 * qualquer coisa que não possa vazar, o controle de acesso precisa voltar.
 */

const statusValidator = v.union(v.literal("yes"), v.literal("no"));

// ── Leitura pública ────────────────────────────────────

/** O que o convidado pode ver sobre si mesmo. Nunca a lista. */
function publicView(g: any) {
  return {
    slug: g.slug,
    name: g.name,
    showIndex: g.showIndex,
    youtubeId: g.youtubeId ?? showAt(g.showIndex).song.youtubeId,
    status: g.status,
    plusOne: g.plusOne,
    plusOneName: g.plusOneName ?? "",
    kids: g.kids,
    kidsNames: g.kidsNames ?? "",
    note: g.note ?? "",
    respondedAt: g.respondedAt ?? null,
  };
}

/** Convite pessoal. `null` = link não existe (ou foi removido). */
export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const g = await ctx.db
      .query("partyGuests")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return g ? publicView(g) : null;
  },
});

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
 * Grava a resposta. Serve aos dois caminhos de entrada:
 *
 * - com `slug`: o convite pessoal, que já sabe quem é;
 * - sem `slug`: o link aberto, onde a pessoa digita o nome. Aí procuramos um
 *   convidado com o mesmo nome normalizado antes de criar outro — senão a
 *   "Ana Paula" cadastrada pelos anfitriões viraria uma segunda linha na lista
 *   assim que ela respondesse pelo link geral.
 *
 * Responder de novo sobrescreve: mudar de ideia é normal e o link é o mesmo.
 */
export const respond = mutation({
  args: {
    slug: v.optional(v.string()),
    name: v.string(),
    status: statusValidator,
    plusOne: v.boolean(),
    plusOneName: v.string(),
    kids: v.number(),
    kidsNames: v.string(),
    note: v.string(),
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
      respondedAt: now,
    };

    const existing = args.slug
      ? await ctx.db
          .query("partyGuests")
          .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
          .first()
      : await ctx.db
          .query("partyGuests")
          .withIndex("by_nameKey", (q) => q.eq("nameKey", key))
          .first();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return { slug: existing.slug, showIndex: existing.showIndex };
    }

    // Alguém que os anfitriões não cadastraram — respondeu pelo link aberto.
    const slug = await uniqueSlug(ctx, name);
    const showIndex = showIndexFor(slug);
    await ctx.db.insert("partyGuests", {
      ...fields,
      slug,
      showIndex,
      createdAt: now,
      source: "convidado",
    });
    return { slug, showIndex };
  },
});

async function uniqueSlug(ctx: { db: any }, name: string): Promise<string> {
  // O sufixo aleatório já torna a colisão improvável, mas "improvável" em
  // banco compartilhado ainda é um convidado abrindo o convite de outro.
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = makeSlug(name);
    const taken = await ctx.db
      .query("partyGuests")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    if (!taken) return slug;
  }
  throw new Error("não consegui gerar um link único; tente de novo");
}

// ── Painel dos anfitriões ──────────────────────────────

/** Lista completa e totais. Pública — ver o aviso no topo do arquivo. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const guests = await ctx.db.query("partyGuests").collect();
    guests.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const totals = { adults: 0, kids: 0, total: 0, yes: 0, no: 0, pending: 0 };
    for (const g of guests) {
      totals[g.status === "yes" ? "yes" : g.status === "no" ? "no" : "pending"]++;
      const h = headcount(g);
      totals.adults += h.adults;
      totals.kids += h.kids;
      totals.total += h.total;
    }

    return {
      totals,
      guests: guests.map((g) => ({
        id: g._id,
        slug: g.slug,
        name: g.name,
        status: g.status,
        plusOne: g.plusOne,
        plusOneName: g.plusOneName ?? "",
        kids: g.kids,
        kidsNames: g.kidsNames ?? "",
        note: g.note ?? "",
        showIndex: g.showIndex,
        showLabel: showAt(g.showIndex).label,
        song: showAt(g.showIndex).song,
        youtubeId: g.youtubeId ?? null,
        source: g.source,
        respondedAt: g.respondedAt ?? null,
      })),
    };
  },
});

/**
 * Cadastra convidados em lote a partir de um nome por linha.
 *
 * Ignora nome repetido em vez de recusar o lote inteiro: colar de novo uma
 * lista com dois nomes novos no fim é exatamente como isso vai ser usado.
 */
export const addGuests = mutation({
  args: { names: v.array(v.string()) },
  handler: async (ctx, { names }) => {
    const now = new Date().toISOString();
    let added = 0;
    let skipped = 0;

    for (const raw of names) {
      const name = raw.trim().replace(/\s+/g, " ");
      if (name.length < 2 || name.length > 80) {
        skipped++;
        continue;
      }
      const key = nameKey(name);
      const dup = await ctx.db
        .query("partyGuests")
        .withIndex("by_nameKey", (q) => q.eq("nameKey", key))
        .first();
      if (dup) {
        skipped++;
        continue;
      }

      const slug = await uniqueSlug(ctx, name);
      await ctx.db.insert("partyGuests", {
        slug,
        name,
        nameKey: key,
        showIndex: showIndexFor(slug),
        status: "pending",
        plusOne: false,
        kids: 0,
        createdAt: now,
        source: "anfitriao",
      });
      added++;
    }

    return { added, skipped };
  },
});

/** Troca o nome ou a música de um convidado. Campo ausente = não mexe. */
export const updateGuest = mutation({
  args: {
    id: v.id("partyGuests"),
    name: v.optional(v.string()),
    youtubeId: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, youtubeId }) => {
    const patch: Record<string, unknown> = {};
    if (name !== undefined) {
      const clean = name.trim().replace(/\s+/g, " ");
      if (clean.length < 2 || clean.length > 80) throw new Error("nome inválido");
      patch.name = clean;
      patch.nameKey = nameKey(clean);
    }
    if (youtubeId !== undefined) {
      const clean = youtubeId.trim();
      // Aceita o link inteiro ou só o ID: colar da barra do YouTube é o
      // gesto natural, e exigir o ID puro seria pedir edição manual.
      const id11 = extractYoutubeId(clean);
      if (clean && !id11) throw new Error("link ou ID do YouTube inválido");
      patch.youtubeId = id11 ?? undefined;
    }
    if (Object.keys(patch).length > 0) await ctx.db.patch(id, patch);
    return { ok: true };
  },
});

/** IDs do YouTube têm 11 caracteres da mesma classe usada em base64url. */
function extractYoutubeId(input: string): string | null {
  if (!input) return null;
  if (/^[\w-]{11}$/.test(input)) return input;
  const m = input.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Remove um convidado. Some da lista e o link dele deixa de abrir. */
export const removeGuest = mutation({
  args: { id: v.id("partyGuests") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { ok: true };
  },
});

/**
 * Desfaz a resposta de alguém, devolvendo para "não respondeu".
 *
 * Existe porque a alternativa, quando alguém responde no lugar errado pelo
 * link aberto, seria apagar o convidado e recriá-lo com outro link.
 */
export const resetGuest = mutation({
  args: { id: v.id("partyGuests") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "pending",
      plusOne: false,
      plusOneName: undefined,
      kids: 0,
      kidsNames: undefined,
      respondedAt: undefined,
    });
    return { ok: true };
  },
});
