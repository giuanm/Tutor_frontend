import React, { useState } from 'react';

function VideoForm({ setStatus, setVideoUrl, onVideoSubmit }) {
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const handleInputChange = (event) => {
    setTempVideoUrl(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientId = localStorage.getItem('clientId');
    if (!tempVideoUrl) {
      alert('Por favor, insira a URL do vídeo!');
      return;
    }
    if (!clientId) {
      console.error('Client ID não encontrado.');
      setStatus('Erro: Client ID não encontrado.');
      return;
    }

    setLoading(true);
    setStatus('Enviando requisição...');
    setVideoUrl(tempVideoUrl);

    try {
      const response = await fetch(`${backendURL}/transcrever/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: tempVideoUrl, client_id: clientId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message.startsWith("Transcrição iniciada.")) {
          const taskId = data.task_id;
          onVideoSubmit(null, null, data.message, tempVideoUrl, taskId);
        } else if (data.message === "Transcrição já existe") {
          setStatus(data.message);
          onVideoSubmit(data.transcription, data.summary, data.message, tempVideoUrl, null);
        }
      } else {
        const errorMessage = data.detail || 'Erro ao enviar a URL do vídeo.';
        console.error('Erro ao enviar a URL do vídeo:', errorMessage);
        setStatus(errorMessage);
      }
    } catch (error) {
      console.error('Erro:', error);
      setStatus('Erro ao enviar a requisição.');
    } finally {
      setTempVideoUrl('');
      setInputKey(inputKey + 1);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4"> {/* Removendo o container */}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          key={inputKey}
          type="text"
          value={tempVideoUrl}
          onChange={handleInputChange}
          placeholder="Cole a URL do vídeo aqui"
          className="border p-2 rounded w-full" // Largura total
          disabled={loading}
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {status && (
        <div className="mt-4 text-center">
          <p>Status: {status}</p>
        </div>
      )}
    </div>
  );
}

export default VideoForm;