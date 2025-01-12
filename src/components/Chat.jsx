import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

function Chat({ videoUrl }) {
    const [question, setQuestion] = useState('');
    const [audioURL, setAudioURL] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [lastAudioSent, setLastAudioSent] = useState(null);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);

    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    const handleInputChange = (event) => {
        setQuestion(event.target.value);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!question) return;

        const newMessage = { type: 'question', text: question };
        const updatedMessages = [...messages, newMessage].slice(-15);
        setMessages(updatedMessages);
        setQuestion('');

        try {
            console.log("Enviando pergunta:", question, "para URL:", videoUrl);

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
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setMessages(messages => [...messages, { type: 'answer', text: data }]);
        } catch (error) {
            console.error("Erro ao enviar pergunta:", error);
            setMessages(messages => [...messages, { type: 'answer', text: 'Erro ao processar a pergunta.' }]);
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
                setAudioBlob(audioBlob);
                setAudioURL(URL.createObjectURL(audioBlob));
                const updatedMessages = [...messages, { type: 'question', audio: audioBlob, text: "Mensagem de voz" }];
                setMessages(updatedMessages);
                sendAudio(audioBlob);
                // Parar a stream do microfone
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

            const response = await fetch(`${backendURL}/pergunta_audio/`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || `Erro na API: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setMessages(messages => [...messages, { type: 'answer', text: data }]);
            setError(null);
            setLastAudioSent(audioBlob);
        } catch (error) {
            console.error("Erro ao enviar a pergunta por áudio:", error);
            setMessages(messages => [...messages, { type: 'answer', text: 'Erro ao processar a pergunta por áudio.' }]);
            setError(error.message);
        }
    };

    const retrySendAudio = () => {
        if (lastAudioSent) {
            setAudioBlob(lastAudioSent);
            sendAudio(lastAudioSent);
            setAudioBlob(null);
        }
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
                        <div className={`${message.type === 'question' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'} p-3 rounded-lg
                            ${message.type === 'question' && message.audio ? 'max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%]' : 'max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]'}
                        `}>
                            {message.type === 'answer' ? (
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                            ) : (
                                message.text
                            )}
                            {/* Se a mensagem for uma pergunta e tiver áudio, renderiza o elemento de áudio */}
                            {message.type === 'question' && message.audio && (
                                <div className="mt-2 w-full md:w-96 lg:w-96"> {/* Div para controlar a largura do áudio */}
                                    <audio controls src={URL.createObjectURL(message.audio)} className="w-full" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex mt-4">
                <input
                    type="text"
                    value={question}
                    onChange={handleInputChange}
                    placeholder="Faça uma pergunta..."
                    className="border p-2 rounded flex-grow"
                />
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

                <button type="submit" className="bg-green-500 text-white p-2 rounded ml-2">
                    Enviar
                </button>
            </form>
        </div>
    );
}

export default Chat;