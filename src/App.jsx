import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VideoForm from './components/VideoForm';
import Chat from './components/Chat';
import ReactMarkdown from 'react-markdown';

function App() {
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState('');
  const [currentTask, setCurrentTask] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    const storedClientId = localStorage.getItem('clientId') || generateClientId();
    setClientId(storedClientId);
  }, []);

  useEffect(() => {
    let intervalId;

    if (currentTask) {
      intervalId = setInterval(() => {
        checkTaskStatus(currentTask.taskId, currentTask.videoUrl);
      }, 5000); // Consulta a cada 5 segundos
    }

    return () => clearInterval(intervalId);
  }, [currentTask]);

  const generateClientId = () => {
    const clientId = `client-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('clientId', clientId);
    return clientId;
  };

  const handleVideoSubmit = (transcription, summary, message, video_url, newTaskId) => {
    setStatus('Processando...');
    setTranscription('');
    setSummary('');
    setVideoUrl(''); // Limpa a videoUrl atual
    if (transcription) {
      setTranscription(transcription);
      setSummary(summary);
      setStatus(message);
      setCurrentTask(null);
      setVideoUrl(video_url);
    }
    if (newTaskId) {
      setCurrentTask({ taskId: newTaskId, videoUrl: video_url });
      setStatus('Processando...');
      setVideoUrl(video_url);
    }
  };

  const checkTaskStatus = async (taskId) => {
    try {
      const response = await fetch(`${backendURL}/transcricao/task_status/${taskId}`);
      const data = await response.json();
      console.log("checkTaskStatus - data:", data); // Adiciona um log para verificar a resposta
      if (data.status === 'SUCCESS') {
        setStatus('Transcrição concluída!');
        // Buscar a transcrição e o resumo usando a rota /transcricao/
        if (currentTask && currentTask.videoUrl) {
          fetchTranscriptionAndSummary(currentTask.videoUrl);
        } else {
          console.error("Erro: videoUrl é undefined em checkTaskStatus");
          setStatus('Erro ao carregar transcrição e resumo.');
        }
        setCurrentTask(null); // Limpa a task atual
      } else if (data.status === 'FAILURE') {
        setCurrentTask(null);
        setStatus('Erro ao processar a transcrição.');
        console.error('Erro na task:', data.result);
      } else {
        setStatus('Processando...');
      }
    } catch (error) {
      console.error('Erro ao verificar o status da task:', error);
      setStatus('Erro ao verificar o status.');
    }
  };

  const fetchTranscriptionAndSummary = async (videoUrl) => {
    try {
      const response = await fetch(`${backendURL}/transcricao/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: videoUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        setTranscription(data.transcription);
        setSummary(data.summary);
      } else {
        console.error('Erro ao buscar transcrição e resumo:', data.message);
        setStatus('Erro ao carregar transcrição e resumo.');
      }
    } catch (error) {
      console.error('Erro ao buscar transcrição e resumo:', error);
      setStatus('Erro ao carregar transcrição e resumo.');
    }
  };

  return (
    <div className="App dark:bg-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto p-4 flex-grow pt-20 max-w-4xl">
        <div className="w-full mx-auto">
          <VideoForm
            setStatus={setStatus}
            setTranscription={setTranscription}
            setSummary={setSummary}
            setVideoUrl={setVideoUrl}
            onVideoSubmit={handleVideoSubmit}
          />
          {status && (
            <div className="mt-4 text-center">
              <p>Status: {status}</p>
            </div>
          )}
          {transcription && summary && (
            <div className="mt-4 w-full">
              <h2 className="text-2xl mb-2 text-center">Resumo:</h2>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-md markdown">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          )}
          {summary && videoUrl && <div className="mt-4 w-full"><Chat videoUrl={videoUrl} /></div>}
        </div>
      </div>
    </div>
  );
}

export default App;