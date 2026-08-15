"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HOST_NAMES, PARTY, TOTAL_AGE, longDate } from "../../convex/lib/party";

/*
 * Painel do Daniel e do Bruno: quem confirmou, quem recusou, quem sumiu.
 *
 * Sem senha, por decisão do dono da festa: a proteção é só o endereço ser
 * pouco óbvio. Vale saber o que isso protege — a página, e nada além dela.
 * Os dados vêm do Convex, cujas funções são públicas e cuja URL está no
 * bundle do convite, então quem quiser a lista não precisa achar este
 * endereço. Ver o aviso no topo de `convex/party.ts`.
 */

type Guest = {
  id: string;
  slug: string;
  name: string;
  status: "pending" | "yes" | "no";
  plusOne: boolean;
  plusOneName: string;
  kids: number;
  kidsNames: string;
  note: string;
  showLabel: string;
  song: { title: string; artist: string; year: number; youtubeId: string };
  youtubeId: string | null;
  source: "anfitriao" | "convidado";
  respondedAt: string | null;
};

type Filtro = "todos" | "yes" | "no" | "pending";

export default function ListaPage() {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [novos, setNovos] = useState("");
  const [aviso, setAviso] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [origem, setOrigem] = useState("");

  const data = useQuery(api.party.list, {});
  const addGuests = useMutation(api.party.addGuests);
  const removeGuest = useMutation(api.party.removeGuest);
  const resetGuest = useMutation(api.party.resetGuest);

  // `location` só existe no navegador, e a página é pré-renderizada no build.
  useEffect(() => setOrigem(location.origin), []);

  const guests = (data?.guests ?? []) as Guest[];
  const totals = data?.totals ?? null;

  const filtrados = useMemo(
    () => (filtro === "todos" ? guests : guests.filter((g) => g.status === filtro)),
    [guests, filtro],
  );

  const linkDe = (slug: string) => `${origem}/c/${slug}`;

  async function copiar(slug: string) {
    const url = linkDe(slug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard exige contexto seguro e permissão; sem ele, o prompt ao
      // menos deixa a pessoa copiar com Ctrl+C em vez de não fazer nada.
      prompt("Copie o link:", url);
    }
    setCopiado(slug);
    setTimeout(() => setCopiado((s) => (s === slug ? null : s)), 1800);
  }

  async function adicionar() {
    const names = novos
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    try {
      const r = await addGuests({ names });
      setNovos("");
      setAviso(
        `${r.added} ${r.added === 1 ? "convidado adicionado" : "convidados adicionados"}` +
          (r.skipped ? ` · ${r.skipped} ignorado(s) por repetição ou nome inválido` : ""),
      );
    } catch (e: any) {
      setAviso(String(e?.message ?? e).split("\n")[0]);
    }
  }

  function exportarCsv() {
    const linhas = [
      ["nome", "resposta", "acompanhante", "nome do acompanhante", "criancas", "nomes das criancas", "recado", "link", "cadastro", "respondeu em"],
      ...guests.map((g) => [
        g.name,
        g.status === "yes" ? "sim" : g.status === "no" ? "nao" : "sem resposta",
        g.plusOne ? "sim" : "nao",
        g.plusOneName,
        String(g.kids),
        g.kidsNames,
        g.note,
        linkDe(g.slug),
        g.source,
        g.respondedAt ?? "",
      ]),
    ];
    // Aspas dobradas e campo sempre entre aspas: recado com vírgula ou quebra
    // de linha é o caso comum, não o excepcional.
    const csv = linhas
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    // BOM: sem ele o Excel em português abre "José" como "JosÃ©".
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `convidados-${PARTY.date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (data === undefined) {
    return (
      <main className="painel">
        <p className="painel-aviso">carregando…</p>
      </main>
    );
  }

  return (
    <main className="painel">
      <header className="painel-head">
        <div>
          <h1>lista da festa</h1>
          <p className="painel-sub">
            {longDate(PARTY.date)} · {HOST_NAMES} · {TOTAL_AGE} anos
          </p>
        </div>
      </header>

      {totals && (
        <section className="painel-totais">
          <div className="total destaque">
            <strong>{totals.total}</strong>
            <span>pessoas na festa</span>
          </div>
          <div className="total">
            <strong>{totals.adults}</strong>
            <span>adultos</span>
          </div>
          <div className="total">
            <strong>{totals.kids}</strong>
            <span>crianças</span>
          </div>
          <div className="total ok">
            <strong>{totals.yes}</strong>
            <span>confirmaram</span>
          </div>
          <div className="total nao">
            <strong>{totals.no}</strong>
            <span>não vão</span>
          </div>
          <div className="total pend">
            <strong>{totals.pending}</strong>
            <span>sem resposta</span>
          </div>
        </section>
      )}

      <section className="painel-add">
        <h2>adicionar convidados</h2>
        <p className="painel-hint">um nome por linha — cada um ganha um link só dele</p>
        <textarea
          value={novos}
          onChange={(e) => setNovos(e.target.value)}
          rows={4}
          placeholder={"Maria Silva\nJoão Pereira\nAna Costa"}
        />
        <div className="painel-acoes">
          <button onClick={adicionar} disabled={!novos.trim()}>
            adicionar
          </button>
          <button className="ghost" onClick={exportarCsv} disabled={guests.length === 0}>
            baixar CSV
          </button>
        </div>
        {aviso && <p className="painel-aviso">{aviso}</p>}
      </section>

      <div className="painel-filtros" role="group" aria-label="filtrar">
        {(
          [
            ["todos", `todos (${guests.length})`],
            ["yes", `confirmados (${totals?.yes ?? 0})`],
            ["no", `não vão (${totals?.no ?? 0})`],
            ["pending", `sem resposta (${totals?.pending ?? 0})`],
          ] as [Filtro, string][]
        ).map(([k, rotulo]) => (
          <button
            key={k}
            className={`chip ${filtro === k ? "on" : ""}`}
            onClick={() => setFiltro(k)}
            aria-pressed={filtro === k}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="painel-vazio">
          {guests.length === 0
            ? "nenhum convidado ainda — cole a lista de nomes acima"
            : "ninguém neste filtro"}
        </p>
      ) : (
        <ul className="painel-lista">
          {filtrados.map((g) => (
            <li key={g.id} className={`convidado ${g.status}`}>
              <div className="convidado-topo">
                <span className={`selo ${g.status}`}>
                  {g.status === "yes" ? "vai" : g.status === "no" ? "não vai" : "—"}
                </span>
                <strong className="convidado-nome">{g.name}</strong>
                {g.source === "convidado" && (
                  <span className="tagzinha" title="respondeu pelo link aberto, não estava na lista">
                    novo
                  </span>
                )}
              </div>

              <p className="convidado-detalhe">
                {g.status === "yes" && (
                  <>
                    {g.plusOne ? `+1 ${g.plusOneName ? `(${g.plusOneName})` : ""}` : "sem acompanhante"}
                    {g.kids > 0 && ` · ${g.kids} ${g.kids === 1 ? "criança" : "crianças"}`}
                    {g.kidsNames && ` (${g.kidsNames})`}
                    {" · "}
                  </>
                )}
                {g.showLabel} — “{g.song.title}”, {g.song.artist}
                {g.youtubeId && " (vídeo trocado)"}
              </p>

              {g.note && <blockquote className="convidado-recado">{g.note}</blockquote>}

              <div className="convidado-acoes">
                <button className="mini" onClick={() => copiar(g.slug)}>
                  {copiado === g.slug ? "copiado ✓" : "copiar link"}
                </button>
                <a className="mini" href={`/c/${g.slug}`} target="_blank" rel="noreferrer">
                  abrir
                </a>
                {g.status !== "pending" && (
                  <button
                    className="mini"
                    onClick={() => resetGuest({ id: g.id as any })}
                  >
                    limpar resposta
                  </button>
                )}
                <button
                  className="mini perigo"
                  onClick={() => {
                    if (confirm(`Remover ${g.name}? O link dela para de funcionar.`)) {
                      removeGuest({ id: g.id as any });
                    }
                  }}
                >
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
