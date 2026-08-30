"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { HOST_NAMES, PARTY, TOTAL_AGE, longDate, stamp } from "../../convex/lib/party";

/*
 * Painel do Bruno e do Daniel: totais em cima, tabela de respostas embaixo.
 *
 * Sem senha, por decisão do dono da festa: a proteção é só o endereço ser
 * pouco óbvio. Vale saber o que isso protege — a página, e nada além dela.
 * Os dados vêm do Convex, cujas funções são públicas e cuja URL está no
 * bundle do convite. Ver o aviso no topo de `convex/party.ts`.
 *
 * Não há cadastro de convidados nem lista de pendentes: o link é o mesmo para
 * todos, então quem aparece aqui é exatamente quem respondeu.
 */

type Guest = {
  id: string;
  name: string;
  status: "yes" | "no";
  plusOne: boolean;
  plusOneName: string;
  kids: number;
  kidsNames: string;
  note: string;
  showLabel: string;
  respondedAt: string;
};

type Filtro = "todos" | "yes" | "no";

export default function PainelPage() {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const data = useQuery(api.party.list, {});
  const removeGuest = useMutation(api.party.removeGuest);

  const guests = (data?.guests ?? []) as Guest[];
  const totals = data?.totals ?? null;

  const filtrados = useMemo(
    () => (filtro === "todos" ? guests : guests.filter((g) => g.status === filtro)),
    [guests, filtro],
  );

  function exportarCsv() {
    const linhas = [
      ["nome", "resposta", "acompanhante", "nome do acompanhante", "criancas", "nomes das criancas", "recado", "show", "respondeu em"],
      ...guests.map((g) => [
        g.name,
        g.status === "yes" ? "sim" : "nao",
        g.plusOne ? "sim" : "nao",
        g.plusOneName,
        String(g.kids),
        g.kidsNames,
        g.note,
        g.showLabel,
        g.respondedAt,
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
    a.download = `respostas-${PARTY.date}.csv`;
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
            {longDate(PARTY.date)} · {PARTY.place} · {HOST_NAMES} · {TOTAL_AGE} anos
          </p>
        </div>
      </header>

      {/* ── Dashboard ── */}
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
          <div className="total">
            <strong>{totals.respostas}</strong>
            <span>respostas</span>
          </div>
        </section>
      )}

      {/* ── Tabela ── */}
      <div className="painel-barra">
        <div className="painel-filtros" role="group" aria-label="filtrar">
          {(
            [
              ["todos", `todos (${guests.length})`],
              ["yes", `vão (${totals?.yes ?? 0})`],
              ["no", `não vão (${totals?.no ?? 0})`],
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
        <button className="ghost" onClick={exportarCsv} disabled={guests.length === 0}>
          baixar CSV
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className="painel-vazio">
          {guests.length === 0
            ? "ninguém respondeu ainda — mande o link do convite"
            : "ninguém neste filtro"}
        </p>
      ) : (
        // A tabela rola sozinha no celular em vez de espremer as colunas:
        // nome e status ficam legíveis, o resto vem com o arrasto.
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>nome</th>
                <th>status</th>
                <th className="num">+1</th>
                <th className="num">crianças</th>
                <th>recado</th>
                <th>show</th>
                <th>quando</th>
                <th aria-label="ações" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((g) => (
                <tr key={g.id} className={g.status}>
                  <td className="col-nome">{g.name}</td>
                  <td>
                    <span className={`selo ${g.status}`}>
                      {g.status === "yes" ? "vai" : "não vai"}
                    </span>
                  </td>
                  <td className="num">{g.plusOne ? (g.plusOneName || "sim") : "—"}</td>
                  <td className="num">
                    {g.kids > 0 ? (
                      <span title={g.kidsNames || undefined}>
                        {g.kids}
                        {g.kidsNames && " *"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="col-recado">{g.note || "—"}</td>
                  <td className="col-fraca">{g.showLabel || "—"}</td>
                  <td className="col-fraca">{stamp(g.respondedAt)}</td>
                  <td>
                    <button
                      className="mini perigo"
                      onClick={() => {
                        if (confirm(`Remover a resposta de ${g.name}?`)) {
                          removeGuest({ id: g.id as any });
                        }
                      }}
                    >
                      remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="painel-hint" style={{ marginTop: 18 }}>
        O asterisco na coluna de crianças indica que há nomes anotados — passe o
        mouse para ver, ou baixe o CSV.
      </p>
    </main>
  );
}
