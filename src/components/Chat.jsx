import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

function Chat({ videoUrl }) {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [lastAudioSent, setLastAudioSent] = useState(null); // Para reenvio de áudio
    const [error, setError] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [feedbackGiven, setFeedbackGiven] = useState({});  // { index: 'positivo' | 'negativo' }
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    const handleInputChange = (event) => {
        setQuestion(event.target.value);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Limpa o chat quando a URL do vídeo muda
    useEffect(() => {
        setMessages([]);
        setError(null);
    }, [videoUrl]);

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!question) return;

        const newMessage = { type: 'question', text: question };
        // Mantém apenas as últimas 10 mensagens no histórico
        const updatedMessages = [...messages, newMessage].slice(-10);
        setMessages(updatedMessages);
        setQuestion(''); // Limpa o campo de pergunta após o envio

        try {
            const url = new URL(`${backendURL}/pergunta/`);
            url.searchParams.append('pergunta', question);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_url: videoUrl, chat_history: updatedMessages })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || `Erro na API: ${response.statusText}`;
                setError(errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
             // Adiciona a nova mensagem ao histórico
            setMessages(prevMessages => [...prevMessages, { type: 'answer', text: data }]);
            setError(null); // Limpa o erro se a mensagem for enviada com sucesso
        } catch (error) {
            console.error("Erro ao enviar pergunta:", error);
            setMessages(prevMessages => [...prevMessages, { type: 'answer', text: 'Erro ao processar a pergunta.' }]);
            setError(error.message);
        }
    };

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        const audioChunks = [];
        recorder.ondataavailable = (event) => audioChunks.push(event.data);
        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            setAudioBlob(audioBlob); // Atualiza o audioBlob
            const updatedMessages = [...messages, { type: 'question', audio: audioBlob, text: "Mensagem de voz" }].slice(-10); // Mantém as últimas 10
            setMessages(updatedMessages);
            sendAudio(audioBlob); // Envia o áudio gravado
            // Para a stream do microfone!
            stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
      } catch (error) {
          console.error("Erro ao iniciar a gravação:", error);
      }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudio = async (audioBlob) => {
      try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');
          formData.append('video_url', videoUrl);
          setLastAudioSent(audioBlob); // Define o ultimo áudio enviado

          const response = await fetch(`${backendURL}/pergunta_audio/`, {
              method: 'POST',
              body: formData,
          });


        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.detail || `Erro na API: ${response.statusText}`;
          setError(errorMessage); // Define a mensagem de erro
          throw new Error(errorMessage);
        }

        const data = await response.json();
          setMessages(messages => [...messages, { type: 'answer', text: data }]);
          setError(null);  // Limpa o erro, pois a mensagem foi enviada
      } catch (error) {
          console.error("Erro ao enviar a pergunta por áudio:", error);
          setMessages(messages => [...messages, {type: 'answer', text: 'Erro ao processar a pergunta por áudio.'}]);
          setError(error.message); // Define a mensagem de erro
      }
    };

    // Função para reenviar a última mensagem, seja texto ou áudio
    const retrySendMessage = (message, index) => {
        if (message.type === 'question') {
            if (message.audio) {
                // Reenvia o áudio
                retrySendAudio();
            } else {
                // Reenvia a pergunta de texto
                resendQuestion(message.text, index);
            }
        }
    };

    const retrySendAudio = () => {
        if (lastAudioSent) {
            setAudioBlob(lastAudioSent);
            sendAudio(lastAudioSent);
            setAudioBlob(null);
        }
    };

    const handleEdit = (index) => {
        const message = messages[index];
        if (message.type === 'question' && !message.audio) {
            setEditingQuestion({ index, text: message.text });
            setQuestion(message.text);  // Coloca a pergunta no input para edição
        }
    };

    // Função para confirmar a edição da pergunta
    const handleConfirmEdit = async () => {
        if (editingQuestion !== null) {
            const updatedMessages = [...messages];
            updatedMessages[editingQuestion.index].text = question;

            //Remove as mensagens após a pergunta editada.
            setMessages(updatedMessages.slice(0, editingQuestion.index + 1));
            setQuestion('');
            setEditingQuestion(null);

            // Envia a pergunta editada.
            try {
                const url = new URL(`${backendURL}/pergunta/`);
                url.searchParams.append('pergunta', question);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Envia o histórico atualizado *até* a pergunta editada.
                    body: JSON.stringify({ video_url: videoUrl, chat_history: updatedMessages.slice(0, editingQuestion.index + 1) })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.detail || `Erro na API: ${response.statusText}`;
                    setError(errorMessage);
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                 // Adiciona a nova mensagem ao histórico.
                setMessages(messages => [...messages, { type: 'answer', text: data }]);
                setError(null);
            } catch (error) {
                console.error("Erro ao enviar pergunta:", error);
                setMessages(messages => [...messages, { type: 'answer', text: 'Erro ao processar a pergunta.' }]);
                setError(error.message);
            }
        }
    };

    // Função para cancelar a edição da pergunta
    const handleCancelEdit = () => {
        setEditingQuestion(null);
        setQuestion('');
    };

    const handleFeedback = (index, feedback) => {
        // Aqui você pode implementar a lógica para enviar o feedback para o backend
        console.log(`Feedback (${feedback}) para a resposta na posição ${index}`);

        // Atualiza o estado para indicar qual botão de feedback foi clicado
        setFeedbackGiven(prev => ({ ...prev, [index]: feedback }));

        // Exemplo: enviar uma requisição POST para uma rota de feedback no backend
        // fetch('/feedback', { method: 'POST', body: JSON.stringify({ index, feedback, videoUrl }) });
    };

    const resendQuestion = async (questionText, questionIndex) => {
        // Remove as mensagens após a pergunta que será reenviada
        setMessages(messages.slice(0, questionIndex + 1));
        setError(null); // Limpa qualquer erro anterior

        try {
            const url = new URL(`${backendURL}/pergunta/`);
            url.searchParams.append('pergunta', questionText);

            // Envia a pergunta novamente
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_url: videoUrl, chat_history: messages.slice(0, questionIndex) })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || `Erro na API: ${response.statusText}`;
                setError(errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Adiciona a nova resposta ao array de mensagens
            setMessages(messages => [...messages, { type: 'answer', text: data }]);
        } catch (error) {
            console.error("Erro ao reenviar pergunta:", error);
            setMessages(messages => [...messages, { type: 'answer', text: 'Erro ao processar a pergunta.' }]);
            setError(error.message);
        }
    };

    const handleDelete = (index) => {
        setMessages(messages.filter((_, i) => i !== index));
    };

    return (
        <div className="p-2 md:p-4">
            {isRecording && (
                <div className="flex items-center justify-center mb-2">
                    <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Gravando...</span>
                </div>
            )}
            <div className={`chat-messages space-y-4 p-3 overflow-y-auto max-h-96 ${messages.length > 0 ? 'border rounded-lg' : ''}`}>
                {messages.map((message, index) => (
                    <div key={index} className={`message flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`${message.type === 'question' ? 'bg-blue-500 text-white' :
                           'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'} p-3 rounded-lg
                           ${message.type === 'question' && message.audio
                             ? 'max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%]'
                             : 'max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]'}`}>

                            {message.type === 'answer' ? (
                                <>
                                    <ReactMarkdown>{message.text}</ReactMarkdown>
                                    <div className="flex justify-end space-x-2 mt-1">
                                        <button
                                            onClick={() => handleFeedback(index, 'positivo')}
                                            title="Feedback positivo"
                                            className={`p-1 ${feedbackGiven[index] === 'negativo' ? 'opacity-50' : ''} hover:bg-blue-700 active:bg-blue-800 transition-colors`}
                                            disabled={feedbackGiven[index] === 'positivo'}
                                        >
                                            👍
                                        </button>
                                        <button
                                            onClick={() => handleFeedback(index, 'negativo')}
                                            title="Feedback negativo"
                                            className={`p-1 ${feedbackGiven[index] === 'positivo' ? 'opacity-50' : ''} hover:bg-blue-700 active:bg-blue-800 transition-colors`}
                                            disabled={feedbackGiven[index] === 'negativo'}
                                        >
                                            👎
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {message.text}
                                    {message.type === 'question' && message.audio && (
                                        <div className="mt-2 w-full md:w-96 lg:w-96">
                                            <audio controls src={URL.createObjectURL(message.audio)} className="w-full" />
                                        </div>
                                    )}
                                    <div className="flex justify-end space-x-2 mt-1">
                                        {/* Botão de Reprocessar */}
                                        <button onClick={() => retrySendMessage(message, index)} title="Reprocessar" className="p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                        </button>
                                        {/* Botão de Editar */}
                                        {message.type === 'question' && !message.audio && (
                                            <button onClick={() => handleEdit(index)} title="Editar pergunta" className="p-1">
                                                ✏️
                                            </button>
                                        )}
                                        {/* Ícone de Lixeira */}
                                        <button onClick={() => handleDelete(index)} title="Apagar pergunta" className="p-1">
                                            🗑️
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {error && (
                    <div className="message flex justify-center">
                        <div className="bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200 p-3 rounded-lg max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]">
                            {error}
                            <button onClick={lastAudioSent ? retrySendAudio : () => retrySendMessage(messages[messages.length - 1], messages.length -1)} className="ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 active:bg-red-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex mt-4">

                {editingQuestion && (  // Campo de edição
                    <div className="flex-grow flex items-center border rounded p-2 mr-2">
                        <input
                            type="text"
                            value={question}
                            onChange={handleInputChange}
                            placeholder="Edite sua pergunta..."
                            className="flex-grow"
                        />
                        <button type="button" onClick={handleConfirmEdit} className="bg-green-500 text-white p-2 rounded ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>

                        </button>
                        <button type="button" onClick={handleCancelEdit} className="bg-red-500 text-white p-2 rounded ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {!isRecording && !editingQuestion && (
                    <input
                        type="text"
                        value={question}
                        onChange={handleInputChange}
                        placeholder="Faça uma pergunta..."
                        className="border p-2 rounded flex-grow"
                    />
                )}

                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full ml-2 transition-colors duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    title={isRecording ? "Parar gravação" : "Iniciar gravação"}
                >
                    {/* Ícone de microfone (substitua pelo novo SVG) */}
                    {!isRecording && (
                        <svg width="24px" height="24px" viewBox="0 0 512 512" version="1.1" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 512 512">
                            <g>
                                <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z" fill="#FFFFFF"/>
                                <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z" fill="#FFFFFF"/>
                            </g>
                        </svg>
                    )}

                    {/* Ícone de "parar" quando está gravando */}
                    {isRecording && (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </button>

                {!isRecording && (
                    <button type="submit" className="bg-green-500 text-white p-2 rounded ml-2">
                        Enviar
                    </button>
                )}
            </form>
        </div>
    );
}

export default Chat;