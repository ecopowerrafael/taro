---
name: git-push
description: 'Fazer push pro Git com seguranca e criterio. Use quando precisar revisar alteracoes, selecionar arquivos, criar commit, resolver rejeicao de push, configurar upstream e publicar branch no remoto.'
argument-hint: 'Descreva o objetivo do push, a branch e se quer incluir todos os arquivos ou apenas alguns'
user-invocable: true
---

# Git Push

## O que este skill produz

Um fluxo reproduzivel para publicar alteracoes no Git sem empurrar arquivos errados, sem sobrescrever trabalho alheio e com validacoes minimas antes do push.

## Quando usar

- Quando o pedido for fazer push pro Git, subir branch ou publicar alteracoes no remoto
- Quando houver duvida sobre o que deve entrar no commit
- Quando o push falhar por falta de upstream, divergencia com o remoto ou branch protegida
- Quando for preciso confirmar rapidamente se o repositorio esta pronto para publicar

## Procedimento

1. Identificar o repositorio correto e a branch atual com `git status --short --branch`.
2. Listar os arquivos alterados e separar o que faz parte da tarefa do que e incidental.
3. Revisar o diff antes de stagear. Priorizar `git diff` e, se necessario, `git diff --staged`.
4. Bloquear arquivos que nao devem ir para o remoto: segredos, credenciais, arquivos locais de ambiente, binarios gerados e mudancas irrelevantes para a tarefa.
5. Fazer stage de forma intencional. Preferir caminhos explicitos, por exemplo `git add src/App.jsx api/push.mjs`, em vez de stage amplo sem revisao.
6. Confirmar o stage com `git status --short`.
7. Criar um commit objetivo e curto, alinhado ao escopo real das mudancas.
8. Sincronizar com o remoto antes de publicar quando houver risco de divergencia. Preferir `git pull --rebase` na branch atual se isso fizer sentido para o fluxo do repositorio.
9. Fazer o push. Se a branch nao tiver upstream, usar `git push -u origin <branch>`; caso contrario, usar `git push`.
10. Validar o resultado com a saida do comando e, se util, `git status --short --branch` para confirmar que a branch ficou limpa e sincronizada.

## Decisoes e desvios

### Ha arquivos nao relacionados?

- Sim: nao incluir por padrao. Confirmar o escopo e stagear apenas os caminhos necessarios.
- Nao: seguir com stage e commit.

### Ha arquivos sensiveis ou de ambiente?

- Sim: parar, remover do stage se necessario e orientar ajuste de `.gitignore` ou uso de placeholders.
- Nao: continuar.

### A branch ainda nao existe no remoto?

- Sim: usar `git push -u origin <branch>`.
- Nao: usar `git push`.

### O push foi rejeitado?

- Se for non-fast-forward: buscar o estado remoto, integrar com rebase ou merge conforme o padrao do repositorio, revisar conflitos e tentar novamente.
- Se for branch protegida: nao forcar. Orientar abertura de PR ou uso da branch correta.
- Se for falha de autenticacao: validar remoto, credenciais e permissao de escrita.

## Criterios de qualidade

- O commit contem apenas mudancas relacionadas ao objetivo pedido.
- Nenhum segredo, arquivo local ou artefato descartavel foi enviado.
- A mensagem de commit descreve o efeito real da mudanca.
- O push terminou sem erro e a branch local ficou alinhada ao remoto.

## Checklist de conclusao

- `git status --short --branch` revisado antes do commit
- Diff revisado antes do push
- Stage feito de forma intencional
- Commit criado com mensagem coerente
- Push concluido para a branch esperada

## Como aplicar

Quando este skill for invocado, conduza o trabalho na ordem acima e relate ao usuario apenas o que importa:

- qual repositorio e branch estao em uso
- quais arquivos entraram no commit
- qual mensagem de commit foi usada
- se houve necessidade de upstream, rebase, conflito ou PR
- qual foi o resultado final do push