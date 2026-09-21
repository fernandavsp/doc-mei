# Gerador de contrato · MEI

App React (Vite + Tailwind) para gerar contratos de prestação de serviços entre MEI e cliente, com preview ao vivo do documento e opção de imprimir/salvar como PDF.

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/` com os arquivos estáticos prontos para deploy.

## Deploy

O front-end é estático, mas a cobrança por Pix usa funções serverless na pasta `api/`, então a hospedagem precisa suportá-las. **Use a Vercel** (é o caminho documentado abaixo):

**Vercel**
```bash
npm i -g vercel
vercel
```
(ou importe o repositório diretamente pelo painel da Vercel — o framework Vite é detectado automaticamente)

(Netlify/Cloudflare exigiriam mover `api/` para o formato de funções de cada plataforma.)

## Estrutura

```
├── index.html
├── src/
│   ├── main.jsx      # ponto de entrada
│   ├── App.jsx        # componente principal (formulário + preview do contrato)
│   ├── index.css      # diretivas do Tailwind + estilo das páginas legais
│   ├── Legal.jsx      # página de Termos de Uso / Política de Privacidade
│   └── legal/         # textos em Markdown (edite aqui)
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Cobrança por Pix (Mercado Pago)

Sem passe ativo, o contrato aparece com marca d'água e os botões de copiar/imprimir ficam travados. Um pagamento Pix libera o gerador por 24 horas.

Fluxo: `POST /api/create-pix` cria a cobrança → o navegador consulta `GET /api/pix-status?id=...` a cada 3 s → quando o Mercado Pago marca como `approved`, o passe é ativado. Os dados do contrato nunca saem do navegador; o servidor só vê o e-mail e o pagamento.

### Configurar

1. Crie uma aplicação em https://www.mercadopago.com.br/developers e copie o **Access Token de produção**.
2. Na Vercel: *Project → Settings → Environment Variables* → `MP_ACCESS_TOKEN` = seu token.
3. Faça o deploy. Nunca coloque o token no código nem em variáveis com prefixo `VITE_`.

### Testar

- Para ver a interface sem API: crie `.env.local` com `VITE_DEV_UNLOCK=true` e rode `npm run dev`.
- Para testar o fluxo completo: `npx vercel dev` (roda o front e o `api/`), com `MP_ACCESS_TOKEN` e `PRICE_BRL=1` em `.env.local`; pague o Pix real de R$ 1,00 e depois estorne pelo painel do Mercado Pago.

### Alterar o preço

Mude `PRICE_BRL` em `api/_config.js` (ou a variável de ambiente `PRICE_BRL`) **e** `PRICE_LABEL` em `src/config.js`. O valor cobrado é sempre o do servidor.

### Limitações conhecidas (MVP)

- O bloqueio é feito no navegador: quem quiser pode ler o texto na tela (o passe garante o documento limpo, sem marca d'água, e a impressão/cópia). É atrito, não proteção total.
- O passe fica guardado no navegador de quem pagou; o servidor revalida e expira em 24 h, mas não impede compartilhar o mesmo navegador/ID. Para controle rígido, o próximo passo é login ou um banco de dados com passes de uso único.

## Termos de Uso e Política de Privacidade

Ficam nas rotas `/termos` e `/privacidade` e são linkados no rodapé do app e no checkout. O texto está em Markdown, em `src/legal/termos.md` e `src/legal/privacidade.md`; para alterar, edite esses arquivos.

**Antes de publicar**, preencha tudo o que está entre [COLCHETES] (nome/razão social, CPF/CNPJ, cidade, e-mail de contato, endereço do site, data). Em `npm run dev`, as páginas mostram um aviso amarelo enquanto houver campos pendentes. Se não for usar ferramentas de medição/anúncios, apague o trecho opcional do item 9 da política.

O arquivo `vercel.json` faz `/termos` e `/privacidade` abrirem o app (sem ele, esses endereços dariam 404 na Vercel).
