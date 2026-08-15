"use client";

import { useEffect, useRef, useState } from "react";

/*
 * A música do convite, tocada por um player do YouTube escondido.
 *
 * Três coisas que o navegador impõe e que o código precisa respeitar:
 *
 * 1. Som não começa sozinho. Autoplay com áudio só é liberado depois de um
 *    gesto do usuário — por isso o player só é criado depois do clique em
 *    "abrir o convite", e nunca no carregamento da página.
 * 2. Mesmo assim pode falhar. Alguns navegadores e modos de economia bloqueiam
 *    de qualquer jeito; se em 3 s não estiver tocando, aparece o convite para
 *    tocar manualmente em vez de silêncio inexplicado.
 * 3. O dono do vídeo pode proibir embed, e o vídeo pode sair do ar. Nesse caso
 *    o `onError` mostra o link para abrir no YouTube — a festa continua, só
 *    a trilha muda de lugar.
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
    setTimeout(() => reject(new Error("YouTube demorou demais")), 12000);
  });
}

export function Music({
  videoId,
  playing,
  title,
  artist,
}: {
  videoId: string;
  playing: boolean;
  title: string;
  artist: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsNudge, setNeedsNudge] = useState(false);

  useEffect(() => {
    if (!playing || !hostRef.current || playerRef.current) return;
    let cancelled = false;
    let nudgeTimer: ReturnType<typeof setTimeout>;

    loadApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        playerRef.current = new YT.Player(hostRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              e.target.unMute();
              e.target.setVolume(65);
              e.target.playVideo();
              // Se em 3 s não estiver tocando, o autoplay foi barrado.
              nudgeTimer = setTimeout(() => {
                if (cancelled) return;
                const state = playerRef.current?.getPlayerState?.();
                if (state !== 1) setNeedsNudge(true);
              }, 3000);
            },
            onStateChange: (e: any) => {
              if (e.data === 1) setNeedsNudge(false);
            },
            onError: () => setFailed(true),
          },
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      clearTimeout(nudgeTimer);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [playing, videoId]);

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
    playerRef.current?.unMute?.();
    playerRef.current?.playVideo?.();
    setNeedsNudge(false);
    setMuted(false);
  };

  if (!playing) return null;

  return (
    <div className="music">
      {/* O iframe fica fora de tela: queremos a trilha, não o vídeo. */}
      <div className="music-host" aria-hidden="true">
        <div ref={hostRef} />
      </div>

      {failed ? (
        <a
          className="music-btn"
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noreferrer"
        >
          ♪ tocar “{title}” no YouTube
        </a>
      ) : needsNudge ? (
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
