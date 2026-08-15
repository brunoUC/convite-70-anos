/*
 * Dados e regras da festa, compartilhados entre o Convex e o navegador.
 *
 * A UI usa para dar retorno enquanto se digita e a mutation usa para recusar
 * a gravação. Módulo puro — sem API de Node e sem API de navegador — porque
 * roda nos dois lados.
 */

// ── A festa ────────────────────────────────────────────

export const PARTY = {
  /** Aniversariantes na ordem em que aparecem no convite. */
  hosts: [
    { name: "Daniel", age: 40 },
    { name: "Bruno", age: 30 },
  ],
  /** Data da festa. Trocar aqui muda o convite, a contagem e o painel. */
  date: "2026-11-14",
  /**
   * A casa abre às 19h. "a partir das" e não "às" porque ninguém chega em
   * ponto numa festa, e o convite não deve sugerir que quem chegar 20h
   * perdeu alguma coisa.
   */
  time: "a partir das 19h",
  place: "Em casa",
  /** Ainda vazio: sem endereço, o convidado não sabe em qual casa. */
  address: "",
  /** Até quando dá para confirmar. Vazio = sem prazo declarado. */
  rsvpBy: "",
} as const;

/** 40 + 30. Somado no código para nunca discordar das idades acima. */
export const TOTAL_AGE = PARTY.hosts.reduce((sum, h) => sum + h.age, 0);

/** "Daniel e Bruno" */
export const HOST_NAMES = PARTY.hosts.map((h) => h.name).join(" e ");

// ── Shows ──────────────────────────────────────────────

export type Effect =
  | "fogos"
  | "purpurina"
  | "supernova"
  | "discoteca"
  | "estrobo"
  | "confete"
  | "espiral"
  | "ondas"
  | "chuva-de-ouro"
  | "orbes"
  | "raios";

export type Show = {
  id: string;
  /** Nome do show, exibido ao convidado como "seu" show. */
  label: string;
  effect: Effect;
  /** Cores das partículas. A primeira também tinge o brilho do fundo. */
  palette: string[];
  song: {
    /** ID do vídeo no YouTube. Todos verificados em canal oficial. */
    youtubeId: string;
    title: string;
    artist: string;
    year: number;
  };
};

/**
 * Um show por convidado, escolhido pelo hash do slug.
 *
 * Só entram vídeos de canal oficial — VEVO, gravadora ou canal "- Topic",
 * que é upload automático da própria gravadora. Canal de fã some sem aviso e
 * o convite abriria com vídeo indisponível justamente na hora do "tchan".
 * Se algum cair mesmo assim, o player mostra o fallback e a festa continua;
 * para trocar, edite `youtubeId` aqui ou o vídeo do convidado no painel.
 */
export const SHOWS: Show[] = [
  {
    id: "stayin-alive",
    label: "Febre de Sábado à Noite",
    effect: "fogos",
    palette: ["#ffd166", "#ff5d8f", "#ff8c42"],
    song: { youtubeId: "fNFzfwLM72c", title: "Stayin' Alive", artist: "Bee Gees", year: 1977 },
  },
  {
    id: "dancing-queen",
    label: "Rainha da Pista",
    effect: "purpurina",
    palette: ["#ffb3d1", "#e0e0ff", "#fff1a8"],
    song: { youtubeId: "xFrGuyw1V8s", title: "Dancing Queen", artist: "ABBA", year: 1976 },
  },
  {
    id: "september",
    label: "Supernova de Setembro",
    effect: "supernova",
    palette: ["#ffa62b", "#ffe066", "#ff5714"],
    song: { youtubeId: "Gs069dndIYk", title: "September", artist: "Earth, Wind & Fire", year: 1978 },
  },
  {
    id: "i-will-survive",
    label: "Bola de Espelhos",
    effect: "discoteca",
    palette: ["#c8b6ff", "#e8e8ff", "#9d4edd"],
    song: { youtubeId: "6dYWe1c3OyU", title: "I Will Survive", artist: "Gloria Gaynor", year: 1978 },
  },
  {
    id: "le-freak",
    label: "Estrobo do Studio 54",
    effect: "estrobo",
    palette: ["#4cc9f0", "#f72585", "#ffffff"],
    song: { youtubeId: "aXgSHL7efKg", title: "Le Freak", artist: "CHIC", year: 1978 },
  },
  {
    id: "ymca",
    label: "Chuva de Confete",
    effect: "confete",
    palette: ["#ffd60a", "#4361ee", "#ef476f"],
    song: { youtubeId: "CS9OO0S5w2k", title: "Y.M.C.A.", artist: "Village People", year: 1978 },
  },
  {
    id: "dont-stop",
    label: "Espiral Cintilante",
    effect: "espiral",
    palette: ["#f8f0e3", "#ffd166", "#ff70a6"],
    song: {
      youtubeId: "yURRmWtbTbo",
      title: "Don't Stop 'Til You Get Enough",
      artist: "Michael Jackson",
      year: 1979,
    },
  },
  {
    id: "superstition",
    label: "Groove em Ondas",
    effect: "ondas",
    palette: ["#ffb703", "#fb8500", "#8ecae6"],
    song: { youtubeId: "ftdZ363R9kQ", title: "Superstition", artist: "Stevie Wonder", year: 1972 },
  },
  {
    id: "hot-stuff",
    label: "Chuva de Ouro",
    effect: "chuva-de-ouro",
    palette: ["#ffd700", "#ff7b00", "#fff3b0"],
    // O vídeo é a versão de 12 polegadas, mas o título fica sem essa nota:
    // aparece entre aspas no convite e viraria aspas dentro de aspas.
    song: { youtubeId: "tJxOXzE5A8w", title: "Hot Stuff", artist: "Donna Summer", year: 1979 },
  },
  {
    id: "nao-quero-dinheiro",
    label: "Só Quero Amar",
    effect: "orbes",
    palette: ["#ff9e00", "#ff0054", "#ffbd00"],
    song: {
      youtubeId: "FM2tZnIPZUk",
      title: "Não Quero Dinheiro (Só Quero Amar)",
      artist: "Tim Maia",
      year: 1971,
    },
  },
  {
    id: "taj-mahal",
    label: "Raios do Taj Mahal",
    effect: "raios",
    palette: ["#06d6a0", "#ffd166", "#118ab2"],
    song: { youtubeId: "PaBkFpYYeGU", title: "Taj Mahal", artist: "Jorge Ben", year: 1972 },
  },
];

/**
 * Hash estável de string (FNV-1a de 32 bits).
 *
 * Precisa ser determinístico e igual nos dois lados: o servidor grava o índice
 * na criação do convidado, mas a página aberta escolhe o show antes de existir
 * documento. Se as duas contas divergissem, a pessoa veria um show ao abrir o
 * link e outro depois de confirmar.
 */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function showIndexFor(seed: string): number {
  return hashString(seed) % SHOWS.length;
}

export function showAt(index: number): Show {
  // Índice fora da faixa acontece de verdade: basta remover um show do array
  // depois que convidados já foram criados com o índice antigo gravado.
  return SHOWS[((index % SHOWS.length) + SHOWS.length) % SHOWS.length];
}

// ── Nomes ──────────────────────────────────────────────

/**
 * Chave de comparação de nomes: minúsculas, sem acento, espaços colapsados.
 *
 * É o que faz "José Da Silva" digitado no link aberto encontrar o "Jose da
 * Silva" que os anfitriões cadastraram, em vez de criar um convidado duplicado.
 */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // marcas de acento soltas pelo NFD
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Primeiro nome, para os cumprimentos. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // sem l, o, 0, 1

/**
 * Trecho do link de cada convidado: base do nome + sufixo aleatório.
 *
 * O nome no slug é conveniência para os anfitriões conferirem a lista de links.
 * O sufixo é o que impede adivinhar o link de outra pessoa a partir do nome —
 * sem ele, quem recebesse `/c/maria-silva` responderia pelo vizinho.
 */
export function makeSlug(name: string, random: () => number = Math.random): string {
  const base =
    nameKey(name)
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 24)
      .replace(/^-+|-+$/g, "") || "convidado";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += SLUG_ALPHABET[Math.floor(random() * SLUG_ALPHABET.length)];
  }
  return `${base}-${suffix}`;
}

// ── RSVP ───────────────────────────────────────────────

export type RsvpStatus = "pending" | "yes" | "no";

export type RsvpDraft = {
  name: string;
  status: RsvpStatus;
  plusOne: boolean;
  plusOneName: string;
  kids: number;
  kidsNames: string;
  note: string;
};

export const MAX_KIDS = 6;
export const MAX_NOTE = 400;

/** Erros por campo: { name: "mensagem" }. Vazio = válido. */
export function validateRsvp(d: RsvpDraft): Record<string, string> {
  const e: Record<string, string> = {};

  const name = d.name.trim();
  if (name.length < 2) e.name = "escreva seu nome";
  else if (name.length > 80) e.name = "nome longo demais";

  if (d.status !== "yes" && d.status !== "no") e.status = "escolha sim ou não";

  // Acompanhante e crianças só existem para quem vai. Recusar em vez de
  // ignorar em silêncio: um "não vou, levo 2 crianças" gravado pela metade
  // vira discussão sobre a contagem do bufê.
  if (d.status === "no") {
    if (d.plusOne) e.plusOne = "sem acompanhante para quem não vai";
    if (d.kids > 0) e.kids = "sem crianças para quem não vai";
  }

  if (d.kids < 0 || d.kids > MAX_KIDS || !Number.isInteger(d.kids)) {
    e.kids = `de 0 a ${MAX_KIDS} crianças`;
  }
  if (d.plusOneName.trim().length > 80) e.plusOneName = "nome longo demais";
  if (d.kidsNames.trim().length > 200) e.kidsNames = "texto longo demais";
  if (d.note.length > MAX_NOTE) e.note = `no máximo ${MAX_NOTE} caracteres`;

  return e;
}

/** Quantas pessoas aquele convite leva à festa. */
export function headcount(g: {
  status: RsvpStatus;
  plusOne: boolean;
  kids: number;
}): { adults: number; kids: number; total: number } {
  if (g.status !== "yes") return { adults: 0, kids: 0, total: 0 };
  const adults = 1 + (g.plusOne ? 1 : 0);
  return { adults, kids: g.kids, total: adults + g.kids };
}

// ── Datas ──────────────────────────────────────────────

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const DIAS = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
];

/** "sábado, 14 de novembro de 2026" a partir de "2026-11-14". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  // UTC de propósito: `new Date("2026-11-14")` já é UTC, e ler com getDay()
  // local jogaria a data para 13/11 em qualquer fuso a oeste de Greenwich —
  // ou seja, no Brasil inteiro.
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DIAS[dt.getUTCDay()]}, ${d} de ${MESES[m - 1]} de ${y}`;
}

/** "14.11" para o carimbo do convite. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/** Dias inteiros de hoje até a festa. Negativo = já passou. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}
