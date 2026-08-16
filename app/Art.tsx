/*
 * Ilustrações em traço, na linguagem do save-the-date: linha azul sobre creme,
 * taças, respingos e o punho xadrez.
 *
 * São SVG inline e não imagem por dois motivos: acompanham a cor do texto
 * (`currentColor`), então não há um azul que possa sair do tom da marca; e não
 * custam requisição nenhuma numa página cuja graça é abrir rápido.
 *
 * Mãos com anatomia ficaram de fora de propósito. O desenho original tem mãos
 * bem resolvidas; mão mal desenhada é pior que taça nenhuma, então aqui o
 * punho xadrez faz o papel de sugerir o braço e a taça carrega a cena.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Punho xadrez: a assinatura gráfica do convite. */
function Cuff({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  const sq = 7;
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      // Xadrez de verdade é alternado; o preenchido sai em (linha+coluna) par.
      if ((r + c) % 2 === 0) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * sq} y={r * sq} width={sq} height={sq} fill="currentColor" />,
        );
      }
    }
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {cells}
      <rect x="0" y="0" width={sq * 4} height={sq * 3} {...stroke} strokeWidth={2} />
    </g>
  );
}

/** Respingo: gota com rabinho, igual às do convite. */
function Drop({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <path
      d="M0 0 C 3.4 4.2, 5 6.4, 5 8.6 A 5 5 0 0 1 -5 8.6 C -5 6.4, -3.4 4.2, 0 0 Z"
      fill="currentColor"
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
    />
  );
}

/**
 * O brinde: duas taças inclinadas uma para a outra, com respingos saltando.
 * É o motivo central do convite impresso.
 */
export function Toast({ className }: { className?: string }) {
  // Uma taça desenhada na origem do grupo, com a base do bojo em (0,0): assim
  // o rotate() gira em torno do ponto onde a mão segura, e o brinde fecha no
  // alto. Girando pelo centro do bojo, as taças abriam para fora.
  const glass = (
    <>
      <path d="M-26 -34 A26 34 0 0 0 26 -34 Z" fill="currentColor" />
      {/* A boca da taça: sem esta elipse o bojo lê como casquinha de sorvete. */}
      <ellipse cx="0" cy="-34" rx="26" ry="6.5" {...stroke} />
      {/* A haste entra direto no punho: no desenho original a mão cobre o pé
          da taça, e desenhar o pé encostado no xadrez virava um tamborzinho. */}
      <path d="M0 0 V40" {...stroke} />
    </>
  );

  return (
    <svg className={className} viewBox="0 0 300 150" role="img" aria-label="duas taças brindando">
      <g transform="translate(110 84) rotate(26)">
        {glass}
        <Cuff x={-14} y={38} />
      </g>
      <g transform="translate(190 84) rotate(-26)">
        {glass}
        <Cuff x={-14} y={38} />
      </g>

      {/* respingos saltando do encontro das bocas */}
      <Drop x={150} y={12} s={1.1} rot={6} />
      <Drop x={121} y={24} s={0.72} rot={-30} />
      <Drop x={179} y={22} s={0.82} rot={26} />
    </svg>
  );
}

/** Garrafa servindo — usada como selo menor, no rodapé. */
export function Pour({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 190 130" role="img" aria-label="garrafa servindo uma taça">
      <g transform="translate(30 22) rotate(38)">
        <path d="M0 0 h30 v34 q0 8 6 12 l10 7 q5 4 5 11 v34 q0 6 -6 6 h-60 q-6 0 -6 -6 v-34 q0 -7 5 -11 l10 -7 q6 -4 6 -12 v-34 z" {...stroke} />
        <path d="M-15 66 h60" {...stroke} strokeWidth={2} />
      </g>
      {/* o filete caindo na taça */}
      <path d="M96 44 C 100 60, 102 70, 104 80" {...stroke} strokeWidth={2.2} />
      <g transform="translate(112 104)">
        <path d="M-24 -30 H24 A24 30 0 0 1 -24 -30 Z" fill="currentColor" />
        <path d="M-24 -30 H24" {...stroke} />
        <path d="M0 0 V20" {...stroke} />
        <path d="M-15 20 H15" {...stroke} />
      </g>
      <Drop x={132} y={62} s={0.75} rot={18} />
    </svg>
  );
}

/** Fita xadrez: divisor entre as seções, no lugar de um filete simples. */
export function CheckerRule({ className }: { className?: string }) {
  const sq = 8;
  const cols = 40;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols * sq} ${sq * 2}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: cols }).map((_, c) =>
        [0, 1].map((r) =>
          (r + c) % 2 === 0 ? (
            <rect key={`${r}-${c}`} x={c * sq} y={r * sq} width={sq} height={sq} fill="currentColor" />
          ) : null,
        ),
      )}
    </svg>
  );
}
