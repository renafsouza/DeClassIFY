<p align="center">
  <img src="public/images/icon-128.png" alt="DeClassIFY-Zotero Icon" />
</p>

<h1 align="center">DeClassIFY-Zotero</h1>

<p align="center">
  <a href="[https://github.com/seu-usuario/declassify-zotero/blob/main/LICENSE](https://github.com/seu-usuario/declassify-zotero/blob/main/LICENSE)">
    <img src="[https://img.shields.io/badge/license-GPL--3.0-blue.svg](https://img.shields.io/badge/license-GPL--3.0-blue.svg)" alt="Licença GPL-3.0">
  </a>
  <img src="[https://img.shields.io/badge/version-1.0.0-brightgreen.svg](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)" alt="Versão">
  <img src="[https://img.shields.io/badge/Svelte-4A4A55?style=flat&logo=svelte&logoColor=FF3E00](https://img.shields.io/badge/Svelte-4A4A55?style=flat&logo=svelte&logoColor=FF3E00)" alt="Feito com Svelte">
</p>

<p align="center">
  <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGo0YzFlY214OTg4dXA5azd4Nm1nb29yMzlhMTFlamhzNXRyb2xqaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0cJ8K2KxRpHaSYuvPp/giphy.gif" alt="Demonstração da Extensão"/>
</p>

O **DeClassIFY-Zotero** é uma extensão de navegador projetada para automatizar a classificação de artigos científicos e integrá-los de forma transparente à sua biblioteca Zotero. A ferramenta analisa o conteúdo de documentos PDF abertos no navegador, sugere uma classificação com base em uma taxonomia de pesquisa e permite salvar o artigo e seus metadados diretamente na sua conta Zotero.

## Tabela de Conteúdos

- [Sobre o Projeto](#sobre-o-projeto)
  - [Funcionalidades Principais](#funcionalidades-principais)
  - [Aspectos de Classificação](#aspectos-de-classificação)
  - [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação](#instalação)
  - [Pré-requisitos](#pré-requisitos)
  - [Passos para Instalação](#passos-para-instalação)
- [Como Usar](#como-usar)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Como Citar](#como-citar)
- [Licença](#licença)
- [Agradecimentos](#agradecimentos)

## Sobre o Projeto

Este projeto visa solucionar a lacuna entre as ferramentas de gerenciamento de referências e os sistemas de classificação automática de documentos. Ao integrar o motor de classificação do **DeClassIFY** com a API do **Zotero**, a extensão otimiza o fluxo de trabalho de pesquisadores, reduzindo o esforço manual e aumentando a consistência na organização de referências bibliográficas.

### Funcionalidades Principais

* **Classificação Automática**: Analisa o texto de artigos em formato PDF e sugere categorias com base em uma taxonomia de pesquisa predefinida.
* **Integração com Zotero**: Conecta-se à conta do usuário no Zotero de forma segura via OAuth 1.0a para manipular a biblioteca.
* **Salvamento de Itens**: Cria novos itens na biblioteca Zotero a partir de um PDF visualizado ou atualiza itens existentes com as tags de classificação.
* **Interface Não Intrusiva**: Exibe um painel de interação que pode ser aberto ou minimizado, renderizado de forma isolada para não interferir com o layout da página original.
* **Edição Manual**: Permite que o usuário revise e altere os resultados da classificação automática antes de salvá-los.

### Aspectos de Classificação

A extensão categoriza os documentos com base nos seguintes aspectos metodológicos da pesquisa:

-   **Natureza**: Se a pesquisa é mais "Pura" ou "Aplicada".
-   **Método**: A abordagem metodológica do estudo (ex: Analítico, Causal).
-   **Estratégia de Validação**: A abordagem usada para validar a pesquisa (ex: Piloto, Estudo de Caso).
-   **Natureza dos Dados**: O tipo de dados usados (ex: Transversal, Qualitativo, Quantitativo).
-   **Ambiente**: O contexto em que a pesquisa foi realizada (ex: *In Vitro*, Mundo Real, Simulado).
-   **Prova**: O tipo de prova lógica empregada (ex: Abdução, Dedução, Indução).
-   **Propósito**: O objetivo principal da pesquisa (ex: Comportamental, *Design Science*).

### Tecnologias Utilizadas

A solução foi construída utilizando um conjunto de tecnologias modernas para desenvolvimento web e de extensões:

* **Svelte**: Framework reativo utilizado para construir a interface do usuário.
* **JavaScript**: Linguagem principal para a lógica da extensão.
* **API do Zotero**: Interface utilizada para toda a comunicação e manipulação de dados na plataforma Zotero.
* **PDF.js**: Biblioteca da Mozilla para processar e extrair o conteúdo textual de arquivos PDF.
* **Manifesto V3**: A extensão segue o padrão mais recente para extensões do Chromium.
* **Rollup.js**: Utilizado como empacotador de módulos para compilar os arquivos Svelte e JavaScript.

## Instalação

### Pré-requisitos

Certifique-se de que você tem o Node.js e o npm instalados. Para verificar, execute no seu terminal:
```bash
node -v
npm -v
```
Caso não os tenha, faça o download e a instalação a partir do [site oficial do Node.js](https://nodejs.org/).

### Passos para Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/declassify-zotero.git](https://github.com/seu-usuario/declassify-zotero.git)
    cd declassify-zotero
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Compile a extensão:**
    * Para desenvolvimento (com recarregamento automático):
        ```bash
        npm run dev
        ```
    * Para produção (versão final para a loja):
        ```bash
        npm run build
        ```
    Isso gerará os arquivos compilados no diretório `public/build/`.

4.  **Carregue a extensão no navegador:**
    * Abra o seu navegador Chromium e navegue para `chrome://extensions/`.
    * Ative o **Modo de desenvolvedor** (geralmente um seletor no canto superior direito).
    * Clique em **Carregar sem compactação** e selecione o diretório `public/` do projeto.
    * A extensão estará instalada e pronta para uso.

## Como Usar

Ao abrir um arquivo PDF em uma nova aba do navegador, um botão flutuante com o ícone de uma coruja aparecerá no canto inferior direito da tela. Clicar neste botão exibirá o painel da extensão com a classificação sugerida para o documento.

A partir do painel, você pode:
1.  Conectar sua conta Zotero (na primeira vez).
2.  Visualizar a classificação automática.
3.  Editar os resultados, se necessário.
4.  Salvar o artigo e a classificação em sua biblioteca Zotero.

## Arquitetura do Sistema

A arquitetura da extensão foi projetada de forma modular para garantir segurança e manutenibilidade.

* **Content Script**: Injetado nas páginas web, é responsável pela interface do usuário (construída com Svelte) e pela lógica de análise do PDF.
* **Service Worker**: Atua em segundo plano, sendo responsável por detectar o carregamento de arquivos PDF (`webRequest`), atuar como um proxy para chamadas à API do Zotero (para contornar restrições de CORS) e gerenciar a autenticação.
* **Comunicação**: A comunicação entre o `Content Script` e o `Service Worker` é feita de forma assíncrona por meio do sistema de troca de mensagens nativo das extensões (`chrome.runtime.sendMessage`).

## Como Citar

Para referenciar este trabalho em publicações acadêmicas, por favor, utilize a seguinte citação:

**Formato APA:**
Osorio, A., Ataides, V., Ferreira Jr., P., & Cavalheiro, G. (2024). DeClassIFY: Uma ferramenta para auxílio à classificação de artigos científicos. In *Anais do XXXII Workshop sobre Educação em Computação*, (pp. 750-761). Porto Alegre: SBC. doi:10.5753/wei.2024.2987

**Formato BibTeX:**
```bibtex
@inproceedings{wei,
  author = {Alessander Osorio and Vitor Ataides and Paulo Ferreira Jr. and Gerson Cavalheiro},
  title = {DeClassIFY: Uma ferramenta para auxílio à classificação de artigos científicos},
  booktitle = {Anais do XXXII Workshop sobre Educação em Computação},
  location = {Brasília/DF},
  year = {2024},
  issn = {2595-6175},
  pages = {750--761},
  publisher = {SBC},
  address = {Porto Alegre, RS, Brasil},
  doi = {10.5753/wei.2024.2987},
  url = {[https://sol.sbc.org.br/index.php/wei/article/view/29673](https://sol.sbc.org.br/index.php/wei/article/view/29673)}
}
```

## Licença

Este projeto é distribuído sob a licença **GPL-3.0**. Veja o arquivo `LICENSE` para mais detalhes.

## Agradecimentos

* Este trabalho foi desenvolvido com base na extensão DeClassIFY original, de autoria de **Alessander Osorio**.