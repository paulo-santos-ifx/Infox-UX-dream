# Infox UX Dream

Laboratório de UX/UI da Infox. Aqui testamos estilos visuais que partem da identidade atual da marca e propõem uma versão mais moderna.

## Como funciona

- **Seletor de estilos:** a página inicial lista os estilos em teste.
- **Uma rota por estilo:** cada estilo abre uma página com todos os componentes daquela identidade (cores, tipografia, botões, formulários, cards, tabelas, etc.).
- **Layouts:** o mesmo estilo pode ser aplicado em layouts diferentes (painel de sistema, site institucional, guia de marca...) para ver como a identidade se comporta em cada contexto.

## Identidade atual (referência)

Tirada do site [infoxnet.com.br](https://infoxnet.com.br):

| Elemento | Valor |
| --- | --- |
| Cor primária | `#9E2424` (vinho) |
| Cor secundária | `#010000` (quase preto) |
| Fonte do texto | [Comme](https://fonts.google.com/specimen/Comme) |
| Rótulos | [Titillium Web](https://fonts.google.com/specimen/Titillium+Web), caixa alta |
| Cards | borda `#D6D6D6`, raio de 30px |

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Rodando localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run start` | serve o build |
| `npm run lint` | ESLint |

## Licença

[MIT](LICENSE)
