---
name: Limites da autenticação local
description: Decisão durável sobre credenciais locais, sessões remotas e chamadas à API.
---

Contas criadas ou cacheadas no navegador usam identificadores locais estáveis e autenticação por hash PBKDF2; a ausência de uma conta remota não deve ser mascarada por um JWT inventado.

**Why:** O app precisa continuar utilizável quando a tabela remota está indisponível, sem transformar credenciais locais em tokens aceitos pelo servidor nem guardar tokens remotos junto da conta persistida.

**How to apply:** Ao adicionar chamadas remotas, use a sessão remota apenas quando ela tiver token recebido do servidor; para contas locais, trate 401/403 explicitamente e mantenha os dados locais e a renderização funcionando.