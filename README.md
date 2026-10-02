# Origem Cafés na Lovable

Aplicação importada de EduardoM3ndess/origem-cafes. A estrutura TanStack Start e a conexão da Lovable foram preservadas.

## Onde editar

- `public/origem/index.html`: estrutura HTML original.
- `public/origem/style.css`: visual e responsividade.
- `public/origem/app.js`: telas e regras da demonstração.
- `src/routes/index.tsx`: entrada React que exibe a aplicação em um iframe de mesma origem, ocupando toda a tela.

O iframe preserva os estilos, navegação por hash e scripts originais sem conflito com React/Tailwind. Para alterar o sistema pela Lovable, solicite alterações nos arquivos em `public/origem/`. Os arquivos estáticos são incluídos no build pelo Vite.

## Executar

`npm install`, depois `npm run dev`. Para gerar o build: `npm run build`.

## Limitações preservadas

É um protótipo demonstrativo com dados fictícios, sem autenticação ou banco compartilhado. Alterações são salvas no localStorage, chave `origem-demo-v1`, apenas no navegador e domínio atuais. Dados de outro domínio não são transferidos automaticamente. Não há sincronização entre dispositivos.

Para publicar, aguarde a sincronização do GitHub no editor da Lovable, confira o Preview e use Publish.

