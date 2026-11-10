# VistaPlay — Gerenciador automático de playlist M3U

Este projeto mantém uma URL fixa de playlist: `/lista.m3u`. O servidor gera a resposta a partir do banco de dados e inclui somente fontes diretas marcadas como oficialmente publicadas e que responderam com um manifesto HLS válido.

Também existe um caminho independente para GitHub Pages: `automation/catalog.json` contém o catálogo autorizado e `automation/update_playlist.py` gera `client/public/lista.m3u`. O workflow `.github/workflows/update-playlist.yml` executa a verificação a cada seis horas e pode ser executado manualmente.

## Uso no DuplCast

Depois que o projeto for publicado em HTTPS, use:

```text
https://SEU-DOMINIO/lista.m3u
```

No repositório GitHub público, a URL RAW curta é `https://raw.githubusercontent.com/fotoscomiaa-alt/vistaplay-m3u-brasil/main/lista.m3u`.

No DuplCast, escolha **Adicionar playlist → M3U por URL**. A URL não muda; apenas o conteúdo é atualizado.

## Regra de fontes

O catálogo inclui páginas oficiais para Globo, SBT, Record TV, Band, RedeTV!, TV Cultura, TV Brasil, TV Câmara, TV Senado e Canal Gov. Quando a emissora não publica uma URL externa direta autorizada, o canal fica como `official_page_only` no painel e não é inserido na M3U. Isso evita transformar uma página HTML ou uma URL privada/expirada em uma falsa entrada M3U.

No levantamento atual, a RedeTV! foi a única das categorias cadastradas que publicou HLS direto no HTML público consultado. As fontes podem mudar; por isso o monitor marca cada tentativa com HTTP status e mensagem de erro.

## Requisitos para publicação real

1. Configurar `DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID` e `OWNER_NAME` no ambiente WebDev.
2. Aplicar a migração do banco com `pnpm db:push`.
3. Promover o usuário proprietário a `admin` na tabela `users` se a conta não tiver sido criada como proprietária.
4. Para GitHub Pages, usar o repositório do projeto, habilitar Pages a partir da branch de publicação e usar a URL `https://USUARIO.github.io/REPOSITORIO/lista.m3u`.
5. Para uma URL raiz mais curta, configurar um domínio próprio ou um host equivalente e apontar `/lista.m3u` para a aplicação.

A publicação em um GitHub do usuário depende de o conector GitHub estar autorizado nesta sessão. O aplicativo e o workflow não podem obter autorização das emissoras automaticamente; esse é um requisito externo quando uma emissora restringe reprodução fora do player oficial.
