# Instalação no Android e iPhone

## Objetivo
Permitir que o site Origem seja adicionado à tela inicial e aberto como aplicativo no Android e no iPhone, sem alterar o painel ou seus dados.

## Implementação
- Criar o manifesto do aplicativo com nome, cores, tela inicial e modo independente.
- Criar ícones compatíveis para Android, iPhone e navegador, usando a identidade visual atual do Origem.
- Vincular manifesto, ícones e cor do aplicativo na página principal e no conteúdo incorporado.
- Manter o funcionamento atual conectado à internet; não adicionar cache ou modo offline.
- Verificar instalação, carregamento do painel e ausência de erros no Preview.

## Detalhes técnicos
- Suporte de instalação somente por manifesto, sem service worker.
- `start_url` e `scope` apontam para `/`, preservando a página TanStack que hospeda o painel Origem.
