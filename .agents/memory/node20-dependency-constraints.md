---
name: Restrições de dependências no Node 20
description: Compatibilidade do cliente Google Cloud Storage com o runtime Node 20 e o firewall de pacotes do Replit.
---

No runtime Node 20 do projeto, use uma versão 7.x recente e compatível de `@google-cloud/storage` que resolva `fast-xml-parser` 5.x; a major 8 exige Node 22 e versões antigas do parser podem ser bloqueadas pelo firewall.

**Why:** O setup pós-merge precisa reinstalar dependências de forma determinística, e o firewall rejeita o pacote XML vulnerável mesmo quando ele chega como dependência transitiva.

**How to apply:** Antes de atualizar esse cliente, conferir o requisito de Node da versão candidata e executar o hook pós-merge completo; não elevar o runtime só para aceitar a major 8 sem avaliar o restante do projeto.