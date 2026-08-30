"use client";

import { useEffect, useRef, useState } from "react";

/*
 * A música do convite, tocada por um player do YouTube escondido.
 *
 * O truque que faz o som entrar no mesmo instante do clique:
 *
 * Navegador nenhum deixa áudio começar sem gesto do usuário — isso não tem
 * como contornar. Mas autoplay **mudo** é liberado. Então o player nasce junto
 * com a página, mudo e já rodando, e o clique em "abrir o convite" só chama
 * `unMute()`. Tirar o mudo de algo que já está tocando não passa por nenhuma
 * checagem de gesto, então o som é instantâneo e não depende de sorte.
 *
 * A versão anterior fazia o contrário: criava o player depois do clique, e
 * dentro de um `await`. Quando a API do YouTube demorava, a permissão do
 * gesto já tinha expirado e o áudio era barrado — era esse o caso em que
 * aparecia o "toque para ouvir".
 *
 * Ainda restam dois casos de falha, os dois tratados: modos de economia que
 * barram até autoplay mudo (aparece o convite para tocar na mão) e vídeo que
 * proíbe embed ou sai do ar (aparece o link do YouTube).
 */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = "https://www.youtube.com/iframe_api";

/** Carrega a API uma vez só, mesmo com vários players na página. */
function loadApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("sem window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);

  return new Promise((resolve, reject) => {
    const done = () => {
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("API do YouTube carregou sem Player"));
    };

    // A API chama este global quando termina. Encadeamos para não pisar em
    // um handler que outra instância já tenha registrado.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      done();
    };

    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const tag = document.createElement("script");
      tag.src = API_SRC;
      tag.async = true;
      tag.onerror = () => reject(new Error("não consegui carregar o YouTube"));
      document.head.appendChild(tag);
    }

    // Rede ruim ou bloqueio de terceiros: não deixar a promessa pendurada
    // para sempre, senão o aviso de fallback nunca aparece.
    setTimeout(() => reject(new Error("YouTube demorou demais")), 7000);
  });
}

export function Music({
  videoId,
  start,
  active,
  title,
  artist,
}: {
  /** Vídeo do show. Fixo desde a abertura — trocar recomeça a faixa. */
  videoId: string;
  /** Segundo do refrão: onde a música deve entrar. */
  start: number;
  /** false = ainda na cortina, tocando mudo; true = convite aberto, com som. */
  active: boolean;
  title: string;
  artist: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  // Se está mesmo tocando, segundo o player — e não segundo a nossa torcida.
  const [tocando, setTocando] = useState(false);

  // Cria o player assim que a página carrega, mudo e tocando.
  useEffect(() => {
    if (!hostRef.current || playerRef.current) return;
    let cancelled = false;

    loadApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        playerRef.current = new YT.Player(hostRef.current, {
          videoId,
          playerVars: {
            start,
            autoplay: 1,
            mute: 1, // sem isto o autoplay é barrado e não há o que desmutar
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: () => !cancelled && setReady(true),
            // PLAYING = 1 no enum do YouTube.
            onStateChange: (e: any) => !cancelled && setTocando(e.data === 1),
            onError: () => !cancelled && setFailed(true),
          },
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // Monta uma vez. `videoId` não entra nas dependências de propósito: a
    // troca de vídeo recriaria o player e recomeçaria a música — e o vídeo é
    // travado na abertura justamente para isso não acontecer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O clique abriu o convite: volta ao refrão e tira o mudo.
  useEffect(() => {
    if (!active || !ready || muted) return;
    const p = playerRef.current;
    if (!p) return;
    // O seek não é redundante com o `start`: a faixa vem tocando mudinha desde
    // o carregamento, então quando a pessoa demora para clicar ela já passou
    // do refrão. Sem voltar, o som entraria no meio de um verso qualquer.
    p.seekTo(start, true);
    p.unMute();
    p.setVolume(65);
    p.playVideo();
  }, [active, ready, muted, start]);

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.playVideo();
    } else {
      p.mute();
    }
    setMuted(!muted);
  };

  const forcePlay = () => {
    playerRef.current?.seekTo?.(start, true);
    playerRef.current?.unMute?.();
    playerRef.current?.playVideo?.();
    setMuted(false);
  };

  return (
    <div className={active ? "music" : "music-oculto"}>
      {/* O iframe fica fora de tela: queremos a trilha, não o vídeo. Ele
          precisa existir já na cortina — é o que deixa a música pronta. */}
      <div className="music-host" aria-hidden="true">
        <div ref={hostRef} />
      </div>

      {/*
        O rótulo segue o estado real do player. Antes o caso padrão era
        "tocando", então quando o YouTube não carregava a página anunciava
        música que não existia — e o convidado só via silêncio, sem nada
        para clicar.
      */}
      {!active ? null : failed ? (
        <a
          className="music-btn"
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noreferrer"
        >
          ♪ tocar “{title}” no YouTube
        </a>
      ) : !ready ? (
        <span className="music-btn">♪ carregando a música…</span>
      ) : !tocando && !muted ? (
        <button className="music-btn" onClick={forcePlay}>
          ♪ toque para ouvir “{title}”
        </button>
      ) : (
        <button
          className="music-btn"
          onClick={toggleMute}
          aria-pressed={muted}
          title={`${title} — ${artist}`}
        >
          {muted ? "♪ som desligado" : "♪ tocando"} · <span className="music-song">{title}</span>
        </button>
      )}
    </div>
  );
}
