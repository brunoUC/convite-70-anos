"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  HOST_NAMES,
  MAX_KIDS,
  MAX_NOTE,
  PARTY,
  TOTAL_AGE,
  daysUntil,
  longDate,
  randomShow,
  shortDate,
  validateRsvp,
  type RsvpDraft,
} from "../convex/lib/party";
import { Show } from "./Show";
import { Music } from "./Music";
import { CheckerRule, Pour, Toast } from "./Art";

/**
 * O convite. Um só, para todo mundo: o link é o mesmo e o show é sorteado a
 * cada visita, então duas pessoas abrindo o mesmo endereço pegam trilhas e
 * animações diferentes.
 */
export function Invite() {
  const [open, setOpen] = useState(false);
  const count = useQuery(api.party.publicCount, {});
  const respond = useMutation(api.party.respond);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"yes" | "no" | "">("");
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState("");
  const [kids, setKids] = useState(0);
  const [kidsNames, setKidsNames] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  /**
   * Sorteado uma vez e fixo daí em diante.
   *
   * `useState` com função inicial, e não `Math.random()` solto no corpo: solto,
   * ele sortearia de novo a cada re-render — e como o vídeo acompanha o show, a
   * música recomeçaria a cada letra digitada no campo de nome.
   */
  const [show] = useState(randomShow);

  const dias = daysUntil(PARTY.date);

  const draft: RsvpDraft = {
    name,
    status,
    plusOne,
    plusOneName,
    kids,
    kidsNames,
    note,
  };
  const errors = validateRsvp(draft);
  const showErr = (f: string) => (touched ? errors[f] : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (Object.keys(errors).length > 0 || !status) return;

    setSending(true);
    try {
      await respond({
        showId: show.id,
        name: name.trim(),
        status,
        plusOne,
        plusOneName,
        kids,
        kidsNames,
        note,
      });
      setSent(true);
    } catch (err: any) {
      // A mensagem do Convex vem com moldura de stack; fica ilegível na tela.
      setError(
        String(err?.message ?? err).replace(/^.*Uncaught Error:\s*/s, "").split("\n")[0] ||
          "não consegui salvar; tente de novo",
      );
    } finally {
      setSending(false);
    }
  }

  /*
   * Cortina e convite dividem a mesma <main>, e não duas árvores separadas.
   * Dois `return` diferentes fariam o React desmontar tudo na abertura,
   * inclusive o player — que perderia a música já engatilhada, que é
   * justamente o que faz o som entrar junto com o clique.
   */
  const palco = (
    <>
      <Show effect={show.effect} palette={show.palette} running={open} />
      <Music
        videoId={show.song.youtubeId}
        start={show.song.start}
        active={open}
        title={show.song.title}
        artist={show.song.artist}
      />
    </>
  );

  // ── Cortina ──
  if (!open) {
    return (
      <main className="festa-root curtain">
        {palco}
        <div className="curtain-inner">
          {/* A escada do cartaz impresso, na mesma ordem e no mesmo recuo. */}
          <p className="std-1">Save the date</p>
          <p className="std-2">Birthday party</p>
          <p className="std-3">{PARTY.hosts.map((h) => h.name).join(" & ")}</p>

          <p className="lockup">
            <span className="lockup-num">{TOTAL_AGE}</span>
            <span className="lockup-col">
              <span className="lockup-word">years</span>
              <span className="lockup-tag">Combined</span>
            </span>
          </p>

          <Toast className="curtain-art" />

          <p className="curtain-date">{longDate(PARTY.date)}</p>

          <p className="curtain-acao">
            <button className="curtain-btn" onClick={() => setOpen(true)}>
              abrir o convite
            </button>
          </p>
          <p className="curtain-warn">♪ com som — aumente o volume</p>
        </div>
      </main>
    );
  }

  // ── Convite aberto ──
  return (
    <main className="festa-root">
      {palco}

      <div className="festa-wrap">
        <header className="festa-hero">
          <p className="festa-kicker">
            você está convidado para
          </p>

          <h1 className="lockup">
            <span className="lockup-num">{TOTAL_AGE}</span>
            <span className="lockup-col">
              <span className="lockup-word">years</span>
              <span className="lockup-tag">Combined</span>
            </span>
          </h1>

          <p className="festa-math">
            {PARTY.hosts.map((h, i) => (
              <span key={h.name}>
                {i > 0 && <span className="festa-plus"> + </span>}
                {h.name} faz {h.age}
              </span>
            ))}
          </p>

          <p className="festa-lead">
            A festa de {TOTAL_AGE} anos do {HOST_NAMES}. Não é erro de conta: são{" "}
            {PARTY.hosts.map((h) => h.age).join(" + ")} somados, e a gente decidiu
            comemorar tudo de uma vez.
          </p>

          <dl className="festa-facts">
            <div>
              <dt>quando</dt>
              <dd>
                <strong>{longDate(PARTY.date)}</strong>
              </dd>
            </div>
            {/* Linha própria: junto da data, o horário quebrava deixando o
                "·" órfão no começo da segunda linha. */}
            {PARTY.time && (
              <div>
                <dt>horário</dt>
                <dd>
                  <strong>{PARTY.time}</strong>
                </dd>
              </div>
            )}
            {PARTY.place && (
              <div>
                <dt>onde</dt>
                <dd>
                  <strong>{PARTY.place}</strong>
                  {PARTY.address && <> · {PARTY.address}</>}
                </dd>
              </div>
            )}
            {PARTY.food && (
              <div>
                <dt>comida</dt>
                <dd>
                  <strong>{PARTY.food}</strong>
                </dd>
              </div>
            )}
            {PARTY.drinks && (
              <div>
                <dt>bebida</dt>
                <dd>
                  <strong>{PARTY.drinks}</strong>
                </dd>
              </div>
            )}
            <div>
              <dt>faltam</dt>
              <dd>
                {dias > 1 ? (
                  <strong>{dias} dias</strong>
                ) : dias === 1 ? (
                  <strong>1 dia</strong>
                ) : dias === 0 ? (
                  <strong>é hoje!</strong>
                ) : (
                  <strong>já rolou</strong>
                )}
              </dd>
            </div>
          </dl>

          <Toast className="festa-art" />

          <p className="festa-show">
            seu show é <strong>{show.label}</strong> — “{show.song.title}”,{" "}
            {show.song.artist}
          </p>

          <CheckerRule className="regua" />
        </header>

        {sent ? (
          <section className="festa-card festa-done">
            <h2>{status === "yes" ? "confirmado! 🪩" : "que pena 💔"}</h2>
            {status === "yes" ? (
              <p>
                Anotamos {name.trim()}
                {plusOne && ` + ${plusOneName.trim() || "acompanhante"}`}
                {kids > 0 && ` + ${kids} ${kids === 1 ? "criança" : "crianças"}`}. Nos vemos
                em {shortDate(PARTY.date)}.
              </p>
            ) : (
              <p>Avisamos o {HOST_NAMES}. Se mudar de ideia, é só voltar neste link.</p>
            )}
            <button className="ghost-btn" onClick={() => setSent(false)}>
              mudar minha resposta
            </button>
          </section>
        ) : (
          <form className="festa-card" onSubmit={submit} noValidate>
            <h2>confirme sua presença</h2>

            <div className="festa-field">
              <label htmlFor="nome">seu nome</label>
              <input
                id="nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="nome e sobrenome"
                autoComplete="name"
                aria-invalid={!!showErr("name")}
              />
              {showErr("name") && <span className="festa-err">{showErr("name")}</span>}
            </div>

            <div className="festa-choice" role="group" aria-label="você vai?">
              <button
                type="button"
                className={`choice yes ${status === "yes" ? "on" : ""}`}
                onClick={() => setStatus("yes")}
                aria-pressed={status === "yes"}
              >
                eu vou 🕺
              </button>
              <button
                type="button"
                className={`choice no ${status === "no" ? "on" : ""}`}
                onClick={() => {
                  setStatus("no");
                  // Zerar aqui evita o "não vou, levo 2 crianças" que o
                  // servidor recusaria depois, já com o formulário preenchido.
                  setPlusOne(false);
                  setKids(0);
                }}
                aria-pressed={status === "no"}
              >
                não vou 😢
              </button>
            </div>
            {touched && !status && <span className="festa-err">escolha uma opção</span>}

            {status === "yes" && (
              <>
                <label className="festa-check">
                  <input
                    type="checkbox"
                    checked={plusOne}
                    onChange={(e) => setPlusOne(e.target.checked)}
                  />
                  <span>vou levar um acompanhante</span>
                </label>

                {plusOne && (
                  <div className="festa-field">
                    <label htmlFor="acomp">nome do acompanhante</label>
                    <input
                      id="acomp"
                      value={plusOneName}
                      onChange={(e) => setPlusOneName(e.target.value)}
                      placeholder="opcional"
                    />
                  </div>
                )}

                <div className="festa-field">
                  <label htmlFor="criancas">crianças</label>
                  <div className="festa-stepper">
                    <button
                      type="button"
                      onClick={() => setKids(Math.max(0, kids - 1))}
                      aria-label="menos uma criança"
                      disabled={kids === 0}
                    >
                      −
                    </button>
                    <output id="criancas">{kids}</output>
                    <button
                      type="button"
                      onClick={() => setKids(Math.min(MAX_KIDS, kids + 1))}
                      aria-label="mais uma criança"
                      disabled={kids === MAX_KIDS}
                    >
                      +
                    </button>
                  </div>
                </div>

                {kids > 0 && (
                  <div className="festa-field">
                    <label htmlFor="criancas-nomes">nome e idade das crianças</label>
                    <input
                      id="criancas-nomes"
                      value={kidsNames}
                      onChange={(e) => setKidsNames(e.target.value)}
                      placeholder="ex.: Alice (4), Tomás (7)"
                    />
                  </div>
                )}
              </>
            )}

            <div className="festa-field">
              <label htmlFor="recado">recado para os aniversariantes</label>
              <textarea
                id="recado"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
                rows={3}
                placeholder="opcional"
              />
              <span className="festa-hint">
                {note.length}/{MAX_NOTE}
              </span>
            </div>

            {error && <p className="festa-banner">{error}</p>}

            <button className="festa-submit" disabled={sending}>
              {sending ? "enviando…" : "enviar resposta"}
            </button>
          </form>
        )}

        <footer className="festa-foot">
          <Pour className="foot-art" />
          {count && count.total > 0 && (
            <p>
              já somos <strong>{count.total}</strong> na pista
              {count.kids > 0 && ` (${count.kids} ${count.kids === 1 ? "criança" : "crianças"})`}
            </p>
          )}
          <p className="festa-stamp">
            {shortDate(PARTY.date)} · {HOST_NAMES} · {TOTAL_AGE} anos
          </p>
        </footer>
      </div>
    </main>
  );
}
