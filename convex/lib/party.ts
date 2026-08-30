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
    { name: "Bruno", age: 30 },
    { name: "Daniel", age: 40 },
  ],
  /** Data da festa. Trocar aqui muda o convite, a contagem e o painel. */
  date: "2026-11-14",
  time: "a partir das 19h",
  place: "Casa Open",
  /** Rua e número, quando houver. Vazio não aparece no convite. */
  address: "",
  /** O que vai ter. Vazios não aparecem, como o endereço. */
  food: "Churrasco tradicional",
  drinks: "Open bar de chopp e drinks",
} as const;

/** 30 + 40. Somado no código para nunca discordar das idades acima. */
export const TOTAL_AGE = PARTY.hosts.reduce((sum, h) => sum + h.age, 0);

/** "Bruno e Daniel" */
export const HOST_NAMES = PARTY.hosts.map((h) => h.name).join(" e ");

// ── Shows ──────────────────────────────────────────────

export type Effect =
  | "fogos"
  | "purpurina"
  | "supernova"
  | "discoteca"
  | "estrobo"
  | "confete"
  | "ondas"
  | "salgueiro"
  | "orbes"
  | "raios";

export type Show = {
  id: string;
  label: string;
  effect: Effect;
  /** Cores das partículas. A primeira também tinge o brilho do fundo. */
  palette: string[];
  song: {
    /** ID do vídeo no YouTube. Todos verificados em canal oficial. */
    youtubeId: string;
    title: string;
    artist: string;
    /**
     * Segundo em que a música começa a tocar no convite.
     *
     * O convite dura poucos segundos de atenção, e clipe oficial costuma ter
     * introdução, vinheta ou falação antes do som entrar — começar em zero
     * era abrir a festa no silêncio. Aqui cai direto no refrão.
     *
     * **São estimativas.** Conferi os vídeos, não os cronômetros: não tive
     * como ouvir nada daqui. Se alguma entrar no lugar errado, é só ajustar
     * este número — nada mais depende dele.
     */
    start: number;
  };
};

/**
 * Um show por visita, sorteado.
 *
 * Rock brasileiro. Só entram vídeos de canal oficial — VEVO, gravadora, canal
 * da própria banda ou canal "- Topic", que é upload automático da gravadora.
 * Canal de fã some sem aviso e o convite abriria com vídeo indisponível
 * justamente na hora do "tchan".
 */
export const SHOWS: Show[] = [
  {
    id: "bom-brasileiro",
    label: "Bom Brasileiro",
    effect: "fogos",
    palette: ["#1b40c6", "#4a6ede", "#0d2a8f"],
    song: {
      youtubeId: "toLHh5MWQIc",
      title: "Bom Brasileiro",
      artist: "Cachorro Grande",
      start: 48,
    },
  },
  {
    id: "que-loucura",
    label: "Que Loucura",
    effect: "estrobo",
    palette: ["#1b40c6", "#8ea4ec", "#0d2a8f"],
    song: {
      youtubeId: "Sc4zAXr0kd0",
      title: "Que Loucura!",
      artist: "Cachorro Grande",
      start: 42,
    },
  },
  {
    id: "um-minuto",
    label: "Um Minuto",
    effect: "supernova",
    palette: ["#1b40c6", "#0d2a8f", "#6b88e4"],
    song: {
      youtubeId: "x7UHl9Kf2CI",
      title: "Um Minuto Para o Fim do Mundo",
      artist: "CPM 22",
      start: 52,
    },
  },
  {
    id: "sonifera-ilha",
    label: "Sonífera",
    effect: "orbes",
    palette: ["#1b40c6", "#4a6ede", "#8ea4ec"],
    song: {
      youtubeId: "_yL-mT4y9No",
      title: "Sonífera Ilha",
      artist: "Titãs",
      start: 22,
    },
  },
  {
    id: "mulher-de-fases",
    label: "Fases",
    effect: "confete",
    palette: ["#1b40c6", "#4a6ede", "#0d2a8f"],
    song: {
      youtubeId: "FkXWfreN2QA",
      title: "Mulher de Fases",
      artist: "Raimundos",
      start: 46,
    },
  },
  {
    id: "garota-nacional",
    label: "Garota Nacional",
    effect: "discoteca",
    palette: ["#6b88e4", "#1b40c6", "#0d2a8f"],
    song: {
      youtubeId: "DjPtwYunRq4",
      title: "Garota Nacional",
      artist: "Skank",
      start: 58,
    },
  },
  {
    id: "zoio-de-lula",
    label: "Zóio de Lula",
    effect: "ondas",
    palette: ["#1b40c6", "#6b88e4", "#0d2a8f"],
    song: {
      youtubeId: "Df_gGM1h9No",
      title: "Zóio de Lula",
      artist: "Charlie Brown Jr.",
      start: 38,
    },
  },
  {
    id: "anna-julia",
    label: "Anna Júlia",
    effect: "purpurina",
    palette: ["#4a6ede", "#1b40c6", "#8ea4ec"],
    song: {
      youtubeId: "umMIcZODm2k",
      title: "Anna Júlia",
      artist: "Los Hermanos",
      start: 46,
    },
  },
  {
    // O efeito é o salgueiro, aquele fogo que desce devagar como chuva — daí
    // o nome sair da própria música.
    id: "chove",
    label: "Chove",
    effect: "salgueiro",
    palette: ["#0d2a8f", "#1b40c6", "#6b88e4"],
    song: {
      youtubeId: "qiU_XXucYBE",
      title: "Primeiros Erros (Chove)",
      artist: "Capital Inicial",
      start: 55,
    },
  },
  {
    id: "oculos",
    label: "Óculos",
    effect: "raios",
    palette: ["#0d2a8f", "#4a6ede", "#1b40c6"],
    song: {
      youtubeId: "IltVPNqYybw",
      title: "Óculos",
      artist: "Os Paralamas do Sucesso",
      start: 40,
    },
  },
];

/** Sorteia um show. Cada visita ganha o seu — o link é o mesmo para todos. */
export function randomShow(): Show {
  return SHOWS[Math.floor(Math.random() * SHOWS.length)];
}

export function showById(id: string): Show | undefined {
  return SHOWS.find((s) => s.id === id);
}

// ── Nomes ──────────────────────────────────────────────

/**
 * Chave de comparação de nomes: minúsculas, sem acento, espaços colapsados.
 *
 * É o que faz "José Da Silva" encontrar o "Jose da Silva" já gravado, em vez
 * de criar uma segunda linha na lista quando a pessoa muda de ideia e
 * responde de novo.
 */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas de acento soltas pelo NFD
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ── RSVP ───────────────────────────────────────────────

/**
 * Só "vai" ou "não vai".
 *
 * Não existe mais "sem resposta": com link único não há convidado
 * pré-cadastrado, então quem está na base é exatamente quem respondeu.
 */
export type RsvpStatus = "yes" | "no";

export type RsvpDraft = {
  name: string;
  status: RsvpStatus | "";
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

/** Quantas pessoas aquela resposta leva à festa. */
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
  // UTC de propósito: ler com getDay() local jogaria a data para 13/11 em
  // qualquer fuso a oeste de Greenwich — ou seja, no Brasil inteiro.
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

/** "14/11/2026 21:30" para a coluna de quando respondeu. */
export function stamp(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
