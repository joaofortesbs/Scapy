# Autenticação local-first do Scapy

## Contexto

O Scapy já persiste a sessão ativa em `localStorage`, mas o cadastro e o login
da tela de autenticação ainda dependem exclusivamente das rotas
`/api/usuarios/register` e `/api/usuarios/login`. Essas rotas consultam a tabela
externa `usuarios`, que pode estar indisponível no ambiente de desenvolvimento.

O objetivo é tornar a autenticação local o caminho principal sem remover a
compatibilidade com contas existentes no servidor.

## Decisões aprovadas

- A conta local é a fonte de autenticação quando o e-mail já existe neste
  navegador.
- O servidor só é consultado quando não existe uma conta local para o e-mail.
- Um login remoto bem-sucedido é convertido em uma conta local para os acessos
  seguintes.
- Um cadastro local deve permitir o uso do app mesmo quando a sincronização
  remota falhar.
- O logout encerra apenas a sessão ativa; não remove as contas locais salvas.
- Contas locais são específicas deste navegador/dispositivo. Não há promessa
  de sincronização entre dispositivos.
- Senhas nunca serão armazenadas em texto puro. A implementação local usará
  hash produzido no navegador e comparação assíncrona.

## Arquitetura

### Armazenamento local

Será usado um namespace versionado e separado dos dados de sessão existentes:

- `scapy_auth_accounts_v1`: lista de contas locais com identificador, e-mail
  normalizado, nome, hash da senha, origem (`local` ou `server`), datas e
  dados de perfil compatíveis com o dashboard.
- `scapy_auth_session_v1`: sessão ativa com o identificador local e o perfil
  normalizado que o `App` precisa para roteamento.

Os campos antigos `user` e `isAuthenticated` serão mantidos como uma camada de
compatibilidade durante a transição, mas a nova rotina de autenticação será a
fonte única para criar, ler e encerrar sessões. Tokens remotos, quando
existirem, não serão exibidos em logs nem tratados como senha.

### Serviço de autenticação do cliente

Um módulo pequeno, sem dependência de React, concentrará:

1. normalização de e-mail e nome;
2. validação e hash de senha;
3. cadastro e busca de contas no `localStorage`;
4. login local;
5. fallback às rotas remotas quando não houver conta local;
6. conversão da resposta remota em conta e sessão locais;
7. logout e limpeza segura da sessão.

Assim, `AuthPage` cuidará somente do formulário e das mensagens, enquanto
`App` cuidará do estado de sessão e do roteamento.

## Fluxo de dados

### Cadastro

1. Validar nome, e-mail, senha e confirmação no cliente.
2. Normalizar o e-mail e verificar duplicidade local.
3. Se já existir localmente, interromper sem chamar o servidor.
4. Criar a conta local com senha em hash e iniciar a sessão.
5. Tentar registrar a mesma conta no servidor de forma oportunista.
6. Se a sincronização falhar, manter a sessão local e mostrar uma mensagem
   informativa sem transformar o cadastro em erro.
7. Encaminhar novos usuários ao quiz, preservando o comportamento atual.

### Login

1. Validar e normalizar os campos.
2. Procurar o e-mail na lista local.
3. Se encontrado, comparar a senha localmente; senha incorreta encerra com
   erro e não chama o servidor.
4. Se não encontrado, chamar `/api/usuarios/login`.
5. Em resposta bem-sucedida, salvar o perfil e o hash da senha como uma conta
   local e iniciar a sessão.
6. Em indisponibilidade ou erro da API, mostrar uma mensagem acionável e
   manter a tela de login utilizável.

### Logout e restauração

- Ao abrir a aplicação, restaurar apenas uma sessão válida do namespace novo.
- Se a sessão estiver corrompida, removê-la e exibir o formulário de login.
- Ao sair, remover a sessão ativa e os aliases de compatibilidade, preservando
  as contas para o próximo login local.

## UX e estados de erro

- O botão deve permanecer desabilitado durante a operação atual, sem `setTimeout`
  artificial para navegação.
- Erros de validação devem aparecer junto ao formulário.
- Conta local duplicada deve informar que o e-mail já está cadastrado neste
  navegador.
- Senha local incorreta deve usar a mesma mensagem genérica de credencial
  inválida, sem revelar se um e-mail existe.
- Falha no servidor para um e-mail desconhecido deve informar que não foi
  possível concluir o login e sugerir criar a conta localmente.
- O fluxo não deve expor senha, hash, token ou resposta interna no console.
- A tela atual, o tema escuro, o layout mobile-first e os textos existentes
  devem ser preservados salvo ajustes necessários para comunicar o modo local.

## Compatibilidade com o restante do app

- O formato de usuário entregue ao `App` continuará contendo `id`, `email`,
  `username`, `full_name`, `quizCompleted` e os campos de timer/quiz usados
  pelas telas existentes.
- IDs locais serão estáveis e distintos de IDs remotos para evitar colisões.
- Dados de progresso já associados ao `user.id` continuarão isolados por conta.
- Nenhum JWT falso será criado para contas locais. Chamadas remotas que exigem
  autenticação devem continuar reconhecendo a ausência de token e tratar a
  falha de forma explícita, sem derrubar a renderização da aplicação.
- As rotas de servidor serão preservadas para compatibilidade com contas
  remotas; remover a dependência delas da tela de autenticação é o objetivo
  desta mudança.

## Validação

1. Criar uma conta sem servidor de autenticação disponível e confirmar que a
   sessão local inicia e sobrevive a um reload.
2. Sair, entrar novamente com a mesma conta e confirmar que nenhum request de
   login remoto é realizado.
3. Usar senha incorreta em conta local e confirmar erro sem request remoto.
4. Usar um e-mail desconhecido, confirmar tentativa de fallback e validar a
   mensagem quando a tabela remota estiver indisponível.
5. Simular resposta remota bem-sucedida e confirmar cache local do perfil.
6. Confirmar que logout preserva a conta local e encerra o acesso ao dashboard.
7. Validar console sem segredos, build, workflow em `0.0.0.0:5000` e screenshot
   do preview em desktop e viewport estreito.

## Fora de escopo

- Criar ou migrar tabelas no Supabase/Neon.
- Implementar autenticação segura de produção ou sincronização entre
  dispositivos.
- Refatorar os 38 erros TypeScript já existentes em outras áreas.
- Reescrever as rotas de API ou os componentes do dashboard não relacionados
  ao fluxo de autenticação.