# Convite de 70 anos — Daniel e Bruno

Site de convite com RSVP para a festa de **70 anos somados**: o Daniel faz 40 e
o Bruno faz 30. A pessoa abre o link, leva um estouro de fogos com uma música
dos anos 70 e confirma presença ali mesmo.

**Sábado, 14 de novembro de 2026.**

---

## Como funciona

| Rota | Quem usa | O que faz |
|---|---|---|
| `/` | todos os convidados | Convite; a pessoa digita o nome e responde |
| `/festaadmin` | Bruno e Daniel | Dashboard, tabela de respostas e CSV — sem senha |

**O link é o mesmo para todo mundo.** Não há convite pessoal nem convidado
pré-cadastrado: o show é sorteado a cada visita, então duas pessoas abrindo o
mesmo endereço pegam trilha e animação diferentes. Some junto o estado "sem
resposta" — sem lista de quem foi convidado, não há como saber quem faltou, e
essa contagem não era necessária.

Quem responde duas vezes não vira duas linhas: o nome é casado por uma chave
normalizada (minúsculas, sem acento, espaços colapsados), então "maria
APARECIDA" atualiza a linha da "Maria Aparecida".

A abertura reproduz o save-the-date impresso, com um botão. No clique estouram
os fogos e entra a música; em seguida aparecem a data, a contagem regressiva e
o formulário — nome, vou/não vou, acompanhante e um contador de crianças.

**Por que existe um clique antes do estouro.** Navegador nenhum toca áudio sem
gesto do usuário; autoplay com som é bloqueado desde 2018. Como o clique é
inevitável, ele virou o momento do "tchan" em vez de um obstáculo.

**Como o som entra instantâneo mesmo assim.** Autoplay *mudo* é liberado, então
o player nasce junto com a página, mudo e já rodando, e o clique só chama
`unMute()` — desmutar algo que já toca não passa por checagem de gesto nenhuma.
Ver o comentário no topo de `app/Music.tsx`.

---

## Arquitetura

| Peça | Onde | Papel |
|---|---|---|
| `app/` | Vercel | Convite, convite pessoal e painel |
| `app/Show.tsx` | navegador | Fogos e animações, em canvas 2D |
| `app/Music.tsx` | navegador | Player do YouTube escondido, só o áudio |
| `convex/` | nuvem | Banco dos convidados e das respostas |
| `convex/lib/party.ts` | os dois lados | Dados da festa, shows e validação |

Convex é a fonte da verdade. A lista **nunca** entra no repositório — nem
mesmo como exemplo — então o repositório ser público não expõe convidado
nenhum.

> **O painel não tem senha.** `/festaadmin` é apenas um endereço pouco óbvio.
> Isso esconde a página, não os dados: as funções do Convex são públicas e a
> URL do deployment está no bundle do convite, então qualquer convidado com o
> link consegue ler a lista pelo console do navegador. Foi decisão consciente
> para uma lista de festa. Se um dia guardar aqui algo que não possa vazar, o
> controle de acesso precisa voltar — ver o aviso no topo de `convex/party.ts`.

`convex/lib/party.ts` é módulo puro, sem API de Node nem de navegador, porque
roda nos dois lados: a UI valida enquanto se digita e a mutation recusa a
gravação com exatamente o mesmo código. Uma regra que valesse só no navegador
não seria regra — bastaria uma chamada direta para furá-la.

---

## Instalação

Já está tudo provisionado. Esta seção existe para quem precisar refazer.

### Convex

O projeto é `convite-70-anos`, no time `bruno-toso`.

| Ambiente | URL |
|---|---|
| produção | `https://trustworthy-pig-428.convex.cloud` |
| dev | `https://trustworthy-gull-538.convex.cloud` |

A URL de produção está fixada em `.env.production`, versionado. Ela é pública
por definição — toda variável `NEXT_PUBLIC_*` é embutida no JavaScript que vai
para o navegador —, então escondê-la não protegeria nada. O que protege os
dados é o que está nas funções do Convex; ver o aviso no topo de
`convex/party.ts`.

Mexeu em `convex/`? Publique e recommite o que mudar:

```bash
npx convex deploy          # produção
git add convex/_generated && git commit -m "..."
```

O `convex/_generated/` **é versionado**, e é isso que permite à Vercel buildar
sabendo apenas a URL. A alternativa seria criar uma deploy key no painel do
Convex e trocar o build command por `npx convex deploy --cmd 'npm run build'`.

### Vercel

No ar em **https://convite-70-anos.vercel.app**, com deploy automático a cada
push na `main`.

Import do repositório e pronto: **sem variáveis de ambiente, sem build command
customizado, sem Root Directory**. Um clone limpo builda como está.

Se o site abrir pedindo login da Vercel, é a *Deployment Protection* da conta:
Settings → Deployment Protection → Vercel Authentication → Disable.

---

## Uso

1. Mande **https://convite-70-anos.vercel.app** para todo mundo. É só isso.
2. Acompanhe em `/festaadmin`: os totais em cima, a tabela de respostas
   embaixo. As respostas aparecem na hora — o Convex é reativo, sem recarregar.
3. `baixar CSV` exporta tudo com BOM, para o Excel em português não transformar
   "José" em "JosÃ©".

---

## Os shows

São 11 combinações de rock brasileiro + animação em `convex/lib/party.ts`,
sorteadas pelo hash do slug. Todas incluem fogos de artifício; o que muda é a
camada por cima:

| Show | Música | Animação |
|---|---|---|
| Bom Brasileiro | Bom Brasileiro — Cachorro Grande | fogos |
| Que Loucura | Que Loucura! — Cachorro Grande | barras de luz |
| Um Minuto | Um Minuto Para o Fim do Mundo — CPM 22 | supernova |
| Sonífera | Sonífera Ilha — Titãs | orbes |
| Fases | Mulher de Fases — Raimundos | confete |
| Garota Nacional | Garota Nacional — Skank | feixes girando |
| Zóio de Lula | Zóio de Lula — Charlie Brown Jr. | ondas |
| Anna Júlia | Anna Júlia — Los Hermanos | purpurina |
| Chove | Primeiros Erros (Chove) — Capital Inicial | salgueiro |
| Óculos | Óculos — Os Paralamas do Sucesso | raios |

Cada faixa tem um campo `start`: o segundo em que ela entra. Clipe oficial
costuma ter introdução antes do som, e o convite tem poucos segundos de
atenção — começar em zero era abrir a festa no silêncio. **Esses números são
estimativas**, conferi os vídeos e não os cronômetros; se alguma entrar no
lugar errado, ajuste o `start` e nada mais.

Só entraram vídeos de **canal oficial** — VEVO, gravadora, canal da própria
banda ou canal `- Topic`, que é upload automático da gravadora — e cada ID foi
conferido pela API de oEmbed do YouTube antes de entrar no código. Isso não é
zelo excessivo: em levas anteriores de candidatos apareceram um vídeo que era
de outra banda inteiramente e vários uploads de fã. Canal de fã sai do ar sem
aviso, e o convite abriria com "vídeo indisponível" justamente na hora do
estouro.

Não há ano de lançamento nos dados. Eu não tinha o ano conferido de cada faixa,
e ano errado impresso no convite é pior que ano nenhum.

Ainda assim não dá para garantir embed para sempre — o dono pode desativar
depois. Por isso o player trata o erro: se o vídeo não tocar, aparece um botão
para abrir no YouTube e o resto do convite segue funcionando.

Para trocar a música de alguém, edite `youtubeId` no show em
`convex/lib/party.ts`, ou o vídeo daquele convidado pelo painel.

---

## Acessibilidade

Duas decisões que não são detalhe de acabamento:

- **Nada de flash rápido em tela cheia.** Piscar acima de ~3 Hz é gatilho
  documentado de convulsão fotossensível, e um convite que a pessoa abre sem
  aviso é o pior lugar possível para descobrir isso. O show "Estrobo do Studio
  54" é lavagem de cor a ~1,7 Hz com opacidade máxima de 10%.
- **`prefers-reduced-motion` corta os fogos** e deixa só um brilho lento. Quem
  liga essa opção costuma ter enjoo com movimento, não falta de vontade
  de festa.

O canvas é `aria-hidden`: para quem usa leitor de tela ele é decoração, e
anunciar partículas seria ruído. O convite inteiro é legível sem ele.

---

## Onde mexer

Data, horário, local e nomes ficam no topo de `convex/lib/party.ts`.

O **endereço** ainda está vazio, e por isso não aparece no convite: o campo só
é renderizado quando tem conteúdo, então melhor omitir do que anunciar
"local: a definir". Preencher `address` é o que falta para o convite ficar
completo — hoje ele diz "Em casa · a partir das 19h", sem dizer qual casa.

O total de 70 é **somado em código** a partir das idades, nunca escrito à mão:
mudar uma idade sem mudar o título daria um convite que se contradiz.

---

## Detalhes que custaram teste

Foram achados abrindo o site num navegador de verdade, não deduzidos:

- As chuvas contínuas — purpurina e confete — fechavam a tela e apagavam o
  texto. Agora nascem em quadros alternados, e há um véu radial entre o show e
  a coluna de leitura: escuro no miolo, transparente nas bordas, onde os fogos
  continuam aparecendo. Cobrir tudo de preto resolveria a leitura matando o
  show, que é o que o convite tem de melhor.
- O confete deixou de somar luz (`lighter`), que o transformava num borrão
  claro. Confete é papel, não brasa.
- O rodapé sumia dentro das barras claras do estrobo, então o véu ganhou uma
  faixa escura na base.
