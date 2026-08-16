"use client";

import { useEffect, useRef } from "react";
import type { Effect } from "../convex/lib/party";

/*
 * O show de abertura: um canvas em tela cheia atrás do convite.
 *
 * Repintado para a marca do save-the-date: tinta azul sobre creme. Não foi só
 * trocar cores. A versão anterior compunha as partículas somando luz, o que
 * sobre fundo claro dá branco — elas simplesmente sumiriam. Agora tudo é
 * desenhado como tinta opaca por cima, que é a linguagem de traço e respingo
 * das ilustrações do convite.
 *
 * Todo convidado ganha fogos de artifício — é o pedido, e é o que faz a
 * abertura ser estrondosa. Por cima vem a assinatura do show sorteado, que é
 * o que muda de pessoa para pessoa.
 *
 * Duas restrições que moldaram o código:
 *
 * - Nada de flash de tela cheia em frequência alta. Piscar acima de ~3 Hz é
 *   gatilho documentado de convulsão fotossensível, e um convite que a pessoa
 *   abre sem aviso é o pior lugar possível para descobrir isso. O "estrobo"
 *   aqui é lavagem de cor suave abaixo de 2 Hz.
 * - `prefers-reduced-motion` corta os fogos e deixa só um brilho lento. Quem
 *   liga essa opção costuma ter enjoo com movimento, não falta de vontade
 *   de festa.
 */

type Kind = "faisca" | "foguete" | "confete" | "orbe" | "purpurina" | "salgueiro";

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: Kind;
  grav: number;
  drag: number;
  rot: number;
  spin: number;
};

const MAX_PARTICLES = 900;
const BG = "#f6f2e8";

export function Show({
  effect,
  palette,
  running,
}: {
  effect: Effect;
  palette: string[];
  running: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Refs e não estado: mudar de show não deve remontar o canvas nem zerar as
  // partículas que já estão no ar.
  const effectRef = useRef(effect);
  const paletteRef = useRef(palette);
  const runningRef = useRef(running);
  effectRef.current = effect;
  paletteRef.current = palette;
  runningRef.current = running;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    // Tipo declarado não-nulo: `spawn` e `paint` são funções aninhadas, e
    // dentro delas o TypeScript descarta o estreitamento feito aqui fora.
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    const resize = () => {
      // DPR limitado a 2: em telas 3x o ganho visual de partícula borrada é
      // nulo e o custo por quadro é o dobro, justo no celular.
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);

    const ps: P[] = [];
    const pick = () => {
      const p = paletteRef.current;
      return p[Math.floor(Math.random() * p.length)];
    };

    const push = (p: P) => {
      // Descartar o mais antigo em vez de recusar o novo mantém o show vivo
      // quando lota: o que interessa é sempre o que acabou de estourar.
      if (ps.length >= MAX_PARTICLES) ps.shift();
      ps.push(p);
    };

    const spark = (
      x: number,
      y: number,
      opts: Partial<P> & { speed?: number } = {},
    ) => {
      const a = Math.random() * Math.PI * 2;
      const s = (opts.speed ?? 3) * (0.4 + Math.random() * 0.8);
      push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        max: 45 + Math.random() * 45,
        size: 1.6 + Math.random() * 1.8,
        color: pick(),
        kind: "faisca",
        grav: 0.045,
        drag: 0.985,
        rot: 0,
        spin: 0,
        ...opts,
      });
    };

    /** Estouro redondo. É a unidade básica de "fogo de artifício". */
    const burst = (x: number, y: number, n = 60, speed = 4.2) => {
      const color = pick();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
        const s = speed * (0.55 + Math.random() * 0.6);
        push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0,
          max: 55 + Math.random() * 50,
          size: 1.7 + Math.random() * 1.6,
          // Metade na cor do estouro, metade sorteada: dá liga sem virar
          // monocromático.
          color: Math.random() < 0.5 ? color : pick(),
          kind: "faisca",
          grav: 0.05,
          drag: 0.982,
          rot: 0,
          spin: 0,
        });
      }
    };

    /** Foguete que sobe e estoura no fim da vida. */
    const rocket = () => {
      const x = w * (0.15 + Math.random() * 0.7);
      push({
        x,
        y: h + 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(8 + Math.random() * 3.5),
        life: 0,
        max: 38 + Math.random() * 18,
        size: 2.2,
        color: pick(),
        kind: "foguete",
        grav: 0.09,
        drag: 0.995,
        rot: 0,
        spin: 0,
      });
    };

    /** Salgueiro: cai devagar, rastro longo e dourado. */
    const willow = (x: number, y: number) => {
      for (let i = 0; i < 70; i++) {
        const a = (i / 70) * Math.PI * 2;
        const s = 2 + Math.random() * 2.4;
        push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 0.6,
          life: 0,
          max: 120 + Math.random() * 70,
          size: 1.5 + Math.random() * 1.4,
          color: pick(),
          kind: "salgueiro",
          grav: 0.03,
          drag: 0.975,
          rot: 0,
          spin: 0,
        });
      }
    };

    let frame = 0;
    let raf = 0;

    const step = () => {
      raf = requestAnimationFrame(step);
      frame++;

      const on = runningRef.current;
      const eff = effectRef.current;

      // Rastro: em vez de limpar, pinta o fundo semitransparente por cima.
      // É o que dá cauda às faíscas sem guardar posições antigas.
      ctx.globalCompositeOperation = "source-over";
      // Rastro curto de propósito. Sobre fundo escuro, a soma de luz mantinha
      // a cauda brilhante; aqui cada quadro de creme por cima dessatura o
      // azul, e um rastro longo transformava os fogos em poeira acinzentada.
      // Apagando quase tudo a cada quadro, a partícula fica tinta viva.
      ctx.fillStyle = reduced ? BG : `${BG}5a`;
      ctx.fillRect(0, 0, w, h);

      if (on && !reduced) {
        spawn(eff, frame);
      } else if (on && reduced) {
        // Versão calma: brilho pulsante, sem nada voando.
        const t = frame / 90;
        const r = Math.min(w, h) * (0.32 + Math.sin(t) * 0.03);
        const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, r);
        g.addColorStop(0, `${paletteRef.current[0]}1c`);
        g.addColorStop(1, "#f6f2e800");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Camadas desenhadas por quadro (não são partículas).
      if (on && !reduced) paint(eff, frame);

      // ── Partículas ──
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.grav;
        p.rot += p.spin;

        if (p.life >= p.max || p.y > h + 60) {
          if (p.kind === "foguete") {
            // Chegou ao topo: é aqui que o foguete vira estouro.
            if (eff === "salgueiro") willow(p.x, p.y);
            else burst(p.x, p.y, eff === "supernova" ? 90 : 62);
          }
          ps.splice(i, 1);
          continue;
        }

        const fade = 1 - p.life / p.max;
        // Opaca quase até o fim, caindo rápido só no último terço.
        // Sobre fundo escuro, meia opacidade ainda lia como brilho; sobre
        // creme, azul a 50% vira cinza sujo e o fogo parece poeira.
        ctx.globalAlpha = Math.max(0, Math.min(1, fade * 3));
        ctx.fillStyle = p.color;
        // Confete é papel, não brasa: somar luz deixava cada pedaço brilhando
        // e o rastro virava um borrão claro por cima do texto.
        // Sempre tinta opaca — ver a nota no topo do arquivo.
        ctx.globalCompositeOperation = "source-over";

        if (p.kind === "confete") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          // Escala horizontal senoidal: o retângulo "vira de lado" como
          // papel caindo, sem custo de 3D.
          ctx.scale(Math.cos(p.rot * 1.7), 1);
          ctx.fillRect(-p.size, -p.size * 1.8, p.size * 2, p.size * 3.6);
          ctx.restore();
        } else if (p.kind === "orbe") {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
          g.addColorStop(0, p.color);
          g.addColorStop(1, "#f6f2e800");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "purpurina") {
          // Cintilância: o brilho oscila em fase própria de cada partícula.
          ctx.globalAlpha *= 0.45 + 0.55 * Math.abs(Math.sin(p.life * 0.22 + p.rot));
          ctx.fillRect(p.x, p.y, p.size, p.size * 2.2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    /** Quem nasce a cada quadro, por show. */
    function spawn(eff: Effect, f: number) {
      // Base comum: foguetes. É o "estrondante" de todo convite.
      const every = eff === "fogos" ? 22 : eff === "supernova" ? 30 : 42;
      if (f % every === 0) rocket();
      if (f % every === 11 && eff === "fogos") rocket();

      switch (eff) {
        // Chuvas contínuas nascem em quadros alternados. A três por quadro,
        // com 260 de vida, chegavam a ~780 partículas simultâneas e a tela
        // fechava — no teste dava para ver a chuva, não o convite.
        case "purpurina":
          if (f % 2) break;
          for (let i = 0; i < 2; i++) {
            push({
              x: Math.random() * w,
              y: -10,
              vx: (Math.random() - 0.5) * 0.6,
              vy: 0.9 + Math.random() * 1.5,
              life: 0,
              max: 190,
              size: 1.4 + Math.random() * 1.6,
              color: pick(),
              kind: "purpurina",
              grav: 0.004,
              drag: 1,
              rot: Math.random() * 6.28,
              spin: 0,
            });
          }
          break;

        case "supernova":
          if (f % 150 === 0) {
            burst(w / 2, h * 0.42, 160, 7.5);
            burst(w / 2, h * 0.42, 80, 3.4);
          }
          break;

        case "confete":
          if (f % 2) break;
          for (let i = 0; i < 2; i++) {
            push({
              x: Math.random() * w,
              y: -20,
              vx: (Math.random() - 0.5) * 2.4,
              vy: 1.4 + Math.random() * 1.8,
              life: 0,
              max: 190,
              size: 2.6 + Math.random() * 2,
              color: pick(),
              kind: "confete",
              grav: 0.012,
              drag: 0.999,
              rot: Math.random() * 6.28,
              spin: (Math.random() - 0.5) * 0.22,
            });
          }
          break;

        case "espiral": {
          // Dois braços opostos girando: sozinho, um braço lê como rabisco.
          const t = f * 0.09;
          const r = 30 + ((f * 2.4) % (Math.min(w, h) * 0.42));
          for (const arm of [0, Math.PI]) {
            spark(w / 2 + Math.cos(t + arm) * r, h * 0.42 + Math.sin(t + arm) * r, {
              speed: 0.7,
              max: 60,
              grav: 0.004,
              drag: 0.99,
            });
          }
          break;
        }

        case "orbes":
          if (f % 7 === 0) {
            push({
              x: Math.random() * w,
              y: h + 30,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -(0.5 + Math.random() * 0.9),
              life: 0,
              max: 300,
              size: 2 + Math.random() * 3.5,
              color: pick(),
              kind: "orbe",
              grav: -0.002,
              drag: 1,
              rot: 0,
              spin: 0,
            });
          }
          break;

        case "discoteca":
          if (f % 4 === 0) {
            spark(Math.random() * w, Math.random() * h * 0.9, {
              speed: 0.35,
              max: 42,
              grav: 0.002,
              size: 1.4,
            });
          }
          break;

        case "ondas":
          if (f % 3 === 0) {
            const n = 9;
            for (let i = 0; i < n; i++) {
              const x = (i / (n - 1)) * w;
              const y = h * 0.5 + Math.sin(f * 0.05 + i * 0.7) * h * 0.16;
              spark(x, y, { speed: 0.5, max: 55, grav: 0.001, drag: 0.995 });
            }
          }
          break;

        default:
          break;
      }
    }

    /** Camadas contínuas: feixes, lavagens e raios. */
    function paint(eff: Effect, f: number) {
      const p0 = paletteRef.current[0];
      const p1 = paletteRef.current[1] ?? p0;

      if (eff === "discoteca") {
        // Feixes girando a partir da bola, no alto e ao centro.
        ctx.globalCompositeOperation = "source-over";
        const cx = w / 2;
        const cy = h * 0.1;
        const t = f * 0.012;
        for (let i = 0; i < 8; i++) {
          const a = t + (i / 8) * Math.PI * 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, `${i % 2 ? p0 : p1}44`);
          g.addColorStop(1, "#f6f2e800");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-h * 0.13, h * 1.2);
          ctx.lineTo(h * 0.13, h * 1.2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      if (eff === "estrobo") {
        // ~1,7 Hz a 60 fps. Bem abaixo do limiar fotossensível de 3 Hz, e a
        // opacidade máxima é 0.10 — lavagem de cor, não flash.
        const phase = Math.sin(f * 0.18);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = phase > 0 ? p0 : p1;
        ctx.globalAlpha = Math.abs(phase) * 0.1;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;

        const bars = 7;
        for (let i = 0; i < bars; i++) {
          const x = ((f * 2.2 + (i * w) / bars) % (w + 160)) - 80;
          const g = ctx.createLinearGradient(x, 0, x + 80, 0);
          g.addColorStop(0, "#f6f2e800");
          g.addColorStop(0.5, `${i % 2 ? p0 : p1}33`);
          g.addColorStop(1, "#f6f2e800");
          ctx.fillStyle = g;
          ctx.fillRect(x, 0, 80, h);
        }
      }

      if (eff === "raios") {
        ctx.globalCompositeOperation = "source-over";
        const cx = w / 2;
        const cy = h * 0.42;
        const t = f * 0.008;
        for (let i = 0; i < 12; i++) {
          const a = t + (i / 12) * Math.PI * 2;
          const pulse = 0.5 + 0.5 * Math.sin(f * 0.04 + i);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a);
          const g = ctx.createLinearGradient(0, 0, Math.max(w, h), 0);
          g.addColorStop(0, `${p0}${Math.round(pulse * 60).toString(16).padStart(2, "0")}`);
          g.addColorStop(1, "#f6f2e800");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.max(w, h), -14);
          ctx.lineTo(Math.max(w, h), 14);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Abertura: não esperar o primeiro foguete subir. O convite tem que
    // estourar no instante do clique.
    if (running && !reduced) {
      burst(w * 0.3, h * 0.35, 80, 5);
      burst(w * 0.7, h * 0.3, 80, 5);
      setTimeout(() => burst(w * 0.5, h * 0.45, 130, 6.5), 260);
      setTimeout(() => {
        rocket();
        rocket();
      }, 520);
    }

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
    // Monta uma vez. As mudanças de show entram pelos refs acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className="show-canvas" aria-hidden="true" />;
}
