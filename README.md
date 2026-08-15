# Convite de 70 anos — Daniel e Bruno

Site de convite com RSVP para a festa de **70 anos somados**: o Daniel faz 40 e
o Bruno faz 30. A pessoa abre o link, leva um estouro de fogos com uma música
dos anos 70 e confirma presença ali mesmo.

**Sábado, 14 de novembro de 2026.**

---

## Como funciona

| Rota | Quem usa | O que faz |
|---|---|---|
| `/` | quem cai sem link pessoal | Convite; a pessoa digita o nome |
| `/c/<slug>` | cada convidado | Convite pessoal, com show próprio |
| `/festaadmin` | Daniel e Bruno | Lista, totais, links e CSV — sem senha |

A abertura é uma cortina com "70" em neon e um botão. No clique estouram os
fogos e começa a música; em seguida aparecem a data, a contagem regressiva e o
formulário — nome, vou/não vou, acompanhante e um contador de crianças.

**Por que existe um clique antes do estouro.** Navegador nenhum toca áudio sem
gesto do usuário; autoplay com som é bloqueado desde 2018. Como o clique é
inevitável, ele virou o momento do "tchan" em vez de um obstáculo.

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

### 1. Convex

```bash
npm install
npx convex dev          # cria o projeto e gera convex/_generated/
```

Anote a URL do deployment (`https://SEU-DEPLOYMENT.convex.cloud`) — é o valor
de `NEXT_PUBLIC_CONVEX_URL` no passo seguinte.

Não há variável de senha a definir: o painel é aberto.

### 2. Vercel

Importe o repositório e configure a variável de ambiente:

- `NEXT_PUBLIC_CONVEX_URL` = a URL `.convex.cloud`

Não há Root Directory a ajustar — o app está na raiz.

---

## Uso

1. Entre em `/festaadmin` e cole a lista de nomes, um por linha.
2. Cada nome ganha um link `/c/<slug>`. Copie e mande por WhatsApp.
3. As respostas aparecem na hora: o Convex é reativo, sem recarregar a página.
4. `baixar CSV` exporta tudo com BOM, para o Excel em português não transformar
   "José" em "JosÃ©".

O slug leva um sufixo aleatório de propósito. Sem ele, `/c/maria-silva` seria
adivinhável e o vizinho responderia pela Maria.

Quem responde pelo link aberto e já estava cadastrado **não** vira linha nova:
o nome digitado é casado com o cadastro por uma chave normalizada — minúsculas,
sem acento, espaços colapsados —, então "José Da Silva" encontra o "Jose da
Silva" da lista.

---

## Os shows

São 11 combinações de música + animação em `convex/lib/party.ts`, sorteadas
pelo hash do slug. Todas incluem fogos de artifício; o que muda é a camada por
cima:

| Show | Música | Animação |
|---|---|---|
| Febre de Sábado à Noite | Stayin' Alive — Bee Gees | fogos |
| Rainha da Pista | Dancing Queen — ABBA | purpurina |
| Supernova de Setembro | September — Earth, Wind & Fire | supernova |
| Bola de Espelhos | I Will Survive — Gloria Gaynor | feixes girando |
| Estrobo do Studio 54 | Le Freak — CHIC | barras de luz |
| Chuva de Confete | Y.M.C.A. — Village People | confete |
| Espiral Cintilante | Don't Stop 'Til You Get Enough — Michael Jackson | espiral |
| Groove em Ondas | Superstition — Stevie Wonder | ondas |
| Chuva de Ouro | Hot Stuff — Donna Summer | salgueiro dourado |
| Só Quero Amar | Não Quero Dinheiro — Tim Maia | orbes |
| Raios do Taj Mahal | Taj Mahal — Jorge Ben | raios |

Só entraram vídeos de **canal oficial** — VEVO, gravadora, ou canal `- Topic`,
que é upload automático da própria gravadora — e cada ID foi conferido pela API
de oEmbed do YouTube antes de entrar no código. Isso não é zelo excessivo: na
primeira leva de candidatos, o "Le Freak" era o *Pump It* do Black Eyed Peas e
dois outros eram upload de fã. Canal de fã sai do ar sem aviso, e o convite
abriria com "vídeo indisponível" justamente na hora do estouro.

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
