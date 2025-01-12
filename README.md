# ! Tutor - Transcrição e Resumo de Vídeos do YouTube com IA

## Descrição

O Tutor é uma aplicação web que permite transcrever e resumir vídeos do YouTube usando inteligência artificial. Os usuários podem inserir a URL de um vídeo do YouTube, e o aplicativo irá baixar o áudio, transcrever o conteúdo e gerar um resumo em formato de tópicos. Além disso, os usuários podem interagir com um chatbot para fazer perguntas sobre o conteúdo do vídeo e receber respostas contextualizadas, levando em consideração o histórico da conversa. O chatbot suporta tanto perguntas por texto quanto por áudio.

**O projeto está dividido em dois repositórios:**

*   **Frontend:** Este repositório.
*   **Backend:**  [[Link do Repositório Backend]](https://github.com/giuanm/Tutor) 

## Tecnologias Utilizadas

Aqui estão as tecnologias utilizadas neste projeto:

**Backend:**

*   **Python:** Linguagem de programação principal (versão 3.11).
*   **FastAPI:** Framework web para construção da API.
*   **Celery:** Fila de tarefas distribuídas para processamento assíncrono.
*   **RabbitMQ:** Broker de mensagens para o Celery.
*   **SQLAlchemy:** ORM para interação com o banco de dados.
*   **MySQL:** Banco de dados relacional para armazenamento de transcrições e resumos.
*   **LangChain:** Framework para construção de aplicações com modelos de linguagem.
*   **Google Generative AI (Gemini Pro):** Modelo de linguagem para geração de resumos e respostas do chatbot.
*   **Groq:** API para transcrição de áudio.
*   **Qdrant:** Banco de dados vetorial para busca semântica (usado pelo LangChain RAG).
*   **Poetry:** Gerenciamento de dependências e ambientes virtuais.
*   **Docker e Docker Compose:** Containerização e orquestração da aplicação.

**Frontend:**

*   **React:** Biblioteca JavaScript para construção de interfaces de usuário.
*   **Vite:** Ferramenta de build e servidor de desenvolvimento para o frontend.
*   **Tailwind CSS:** Framework CSS para estilização.
*   **React Markdown:** Para renderizar o texto em Markdown (resumo e respostas do chat).
*   **Axios:** Cliente HTTP para fazer requisições à API (embora o `fetch` nativo do navegador esteja sendo usado no momento).

**Serviços:**

*   **GitHub**
*   **Render.com** (ou outro serviço de hospedagem, a ser definido)
*   **Clever Cloud** (MySQL Database)
*   **Google Cloud Platform** (Gemini Pro API)
*   **Groq** (API de Transcrição)
*   **Qdrant Cloud** (Vector Database)

## Pré-requisitos

*   **Git**
*   **Docker e Docker Compose**
*   **Conta no Google Cloud Platform com acesso à API do Gemini Pro**
*   **Conta no Groq para transcrição de áudio**
*   **Conta no Qdrant Cloud para o banco de dados vetorial**
*   **Conta no Clever Cloud para o banco de dados MySQL**

## Instalação e Execução com Docker

### Backend

1. **Clonar o Repositório:**

    ```bash
    git clone <URL do repositório do backend>
    cd <nome do repositório>/backend_tutor
    ```

2. **Configurar as Variáveis de Ambiente:**

    *   Crie um arquivo `.env` na pasta `backend_tutor`.
    *   Defina as seguintes variáveis de ambiente no arquivo `.env`:

        ```
        GOOGLE_API_KEY=<sua_chave_da_API_do_Google>
        GROQ_API_KEY=<sua_chave_da_API_do_Groq>
        QDRANT_URL=<URL do seu cluster Qdrant>
        QDRANT_API_KEY=<sua_chave_da_API_do_Qdrant>
        DATABASE_URL=mysql://<usuário>:<senha>@<host>:<porta>/<nome_do_banco> # URL de conexão com o seu banco de dados MySQL no Clever Cloud
        CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//
        ```

    **Importante:**

    *   Substitua os valores de exemplo (`<...>`) pelos seus valores reais.
    *   Certifique-se de que o `DATABASE_URL` esteja correto e que o banco de dados e o usuário no Clever Cloud já estejam criados.

3. **Construir e Iniciar os Containers:**

    ```bash
    docker-compose up -d --build
    ```

    *   `-d`: Executa os containers em segundo plano.
    *   `--build`: Força a reconstrução das imagens, garantindo que as alterações mais recentes no código sejam aplicadas.

### Frontend

1. **Navegar até a pasta do frontend:**

    ```bash
    cd ../frontend
    ```

2. **Instalar as dependências:**

    ```bash
    npm install
    ```

3. **Configurar as Variáveis de Ambiente:**

    *   Crie um arquivo `.env` na pasta `frontend`.
    *   Defina a seguinte variável de ambiente no arquivo `.env`:

        ```
        VITE_BACKEND_URL=http://localhost:8000
        ```

4. **Iniciar o Frontend:**

    ```bash
    npm run dev
    ```

5. **Acessar a Aplicação:**

    *   Abra o seu navegador e acesse `http://localhost:5173` (ou a porta que for configurada pelo Vite).

## Como Usar

1. **Insira a URL de um vídeo do YouTube:** Na página inicial da aplicação, cole a URL do vídeo que você deseja transcrever e resumir no campo indicado.
2. **Clique em "Enviar":** O aplicativo irá processar o vídeo, transcrever o áudio e gerar um resumo.
3. **Visualize a Transcrição e o Resumo:** O resumo do vídeo será exibido em formato de tópicos.
4. **Faça Perguntas ao Chatbot:** Utilize o chat para fazer perguntas sobre o conteúdo do vídeo. O chatbot usará o histórico das últimas 10 interações para fornecer respostas contextualizadas.
5. **Enviar Perguntas por Áudio:**
    *   Clique e segure no botão com o ícone de microfone para iniciar a gravação.
    *   Fale a sua pergunta.
    *   Solte o botão para enviar a pergunta.
    *   A pergunta por áudio aparecerá no chat, e a resposta será gerada com base na transcrição do áudio.
6. **Alternar entre os Temas:** Clicar no ícone no canto superior direito para alternar entre os temas (claro/escuro).

## Funcionalidades

*   **Transcrição de Vídeos:** Transcreve o áudio de vídeos do YouTube usando a API do Groq.
*   **Geração de Resumos:** Gera resumos concisos e objetivos do conteúdo dos vídeos usando a API do Gemini Pro.
*   **Chatbot com Histórico de Conversas:** Permite que os usuários façam perguntas sobre o conteúdo dos vídeos e recebam respostas contextualizadas, considerando as últimas 10 interações.
*   **Envio de Perguntas por Áudio:** Os usuários podem enviar perguntas por áudio, que são transcritas e processadas pelo chatbot.
*   **Interface Intuitiva:** Interface amigável e fácil de usar, com design responsivo.
*   **Modo Claro/Escuro:** Opção de alternar entre um tema claro e um tema escuro.

## Limitações

*   A geração de resumos para vídeos muito longos pode demorar ou, em alguns casos, não ser possível devido a limitações da API do Gemini ou a timeouts no processamento.
*   A qualidade do resumo depende da qualidade da transcrição do áudio e da capacidade do modelo de linguagem em compreender o conteúdo do vídeo.
*   O histórico do chat é limitado às últimas 10 interações e não é persistido entre as sessões.

## Próximos Passos

*   Implementar um sistema de cache mais robusto para armazenar transcrições e resumos.
*   Adicionar suporte para outros idiomas.
*   Melhorar o tratamento de erros e fornecer feedback mais informativo ao usuário.
*   Adicionar a funcionalidade de resumir o histórico do chat para contextos mais longos.
*   Implementar testes unitários e de integração.

## Contribuições

Contribuições são bem-vindas! Se você encontrar algum problema ou tiver sugestões de melhorias, por favor, abra uma issue ou envie um pull request.

## Links

*   **Repositório do Backend:** [[Insira o link do repositório do backend aqui]](https://github.com/giuanm/Tutor)

## Autores

*   **Giuan Miranda:** @giuanm (https://github.com/giuanm)
