'use client';

import React, { useState, useEffect, memo } from 'react';
import NextImage from 'next/image';
import { motion } from 'framer-motion';
import { 
  Image, 
  FileText, 
  Video, 
  Youtube, 
  Link, 
  BarChart3,
  ExternalLink,
  Download,
  Play
} from 'lucide-react';
import { ImageModal } from '../ImageModal';

interface PostAttachmentProps {
  attachmentType: string;
  attachmentUrl?: string;
  attachmentData?: any;
  className?: string;
  postId?: string;
  communitySlug?: string;
}

// Memoizado para evitar re-renders cuando las props no cambian
export const PostAttachment = memo(function PostAttachment({ 
  attachmentType, 
  attachmentUrl, 
  attachmentData, 
  className = '',
  postId,
  communitySlug
}: PostAttachmentProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!attachmentType) return null;

  // Si es múltiple, renderizar todos los adjuntos
  // Verificar si attachment_data tiene la flag isMultiple o si hay un array de attachments
  if (attachmentData?.isMultiple && attachmentData?.attachments && Array.isArray(attachmentData.attachments)) {
    return (
      <div className={`space-y-3 ${className}`}>
        {attachmentData.attachments.map((att: any, index: number) => (
          <PostAttachment
            key={index}
            attachmentType={att.attachment_type}
            attachmentUrl={att.attachment_url}
            attachmentData={att.attachment_data}
            postId={postId}
            communitySlug={communitySlug}
          />
        ))}
      </div>
    );
  }

  // Validar que tenemos una URL válida para tipos que la requieren
  const hasValidUrl = attachmentUrl && attachmentUrl.trim() !== '';
  const requiresUrl = ['image', 'video', 'document', 'youtube', 'link'].includes(attachmentType);
  
  if (requiresUrl && !hasValidUrl) {
    return null;
  }

  const renderAttachment = () => {
    switch (attachmentType) {
      case 'image':
        if (!attachmentUrl) return null;
        
        // Verificar si es una URL base64
        const isBase64 = attachmentUrl.startsWith('data:');
        const isExternalUrl = attachmentUrl.startsWith('http');
        
        // Si es base64, validar que esté bien formateado
        if (isBase64) {
          // Verificar que el base64 esté bien formateado
          const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/;
          if (!base64Regex.test(attachmentUrl)) {
            return (
              <div className="w-full h-48 bg-slate-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Imagen no válida</p>
                </div>
              </div>
            );
          }
        }
        
        return (
          <div className="relative group w-full max-h-96">
            <NextImage
              src={attachmentUrl}
              alt={attachmentData?.name || 'Imagen adjunta'}
              width={800}
              height={600}
              className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowImageModal(true)}
              priority={false}
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
              onError={(e) => {
                // En lugar de ocultar, mostrar un placeholder
                e.currentTarget.style.display = 'none';
                // Crear un placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-48 bg-slate-700 rounded-lg flex items-center justify-center';
                placeholder.innerHTML = `
                  <div class="text-center">
                    <svg class="w-12 h-12 text-slate-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-slate-400 text-sm">Error al cargar imagen</p>
                  </div>
                `;
                e.currentTarget.parentNode?.appendChild(placeholder);
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/50 rounded-full p-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        );

      case 'video':
        if (!attachmentUrl) return null;
        
        // CORRECCIÓN TEMPORAL: Si la URL es de YouTube, renderizar como YouTube
        const isYouTubeUrl = attachmentUrl.includes('youtube.com/embed/') || attachmentUrl.includes('youtu.be/') || attachmentUrl.includes('youtube.com/watch');
        
        if (isYouTubeUrl) {
          
          // Extraer videoId de la URL
          let videoId = null;
          if (attachmentUrl.includes('youtube.com/embed/')) {
            videoId = attachmentUrl.split('youtube.com/embed/')[1]?.split('?')[0];
          } else if (attachmentUrl.includes('youtu.be/')) {
            videoId = attachmentUrl.split('youtu.be/')[1]?.split('?')[0];
          } else if (attachmentUrl.includes('youtube.com/watch')) {
            const match = attachmentUrl.match(/[?&]v=([^&]+)/);
            videoId = match ? match[1] : null;
          }
          
          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
          
          return (
            <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
              {embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    title="Video de YouTube"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-full h-48 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <div className="text-center">
                      <Youtube className="w-12 h-12 text-gray-600 dark:text-slate-400 mx-auto mb-2" />
                      <p className="text-gray-700 dark:text-slate-400 text-sm mb-3">No se pudo extraer videoId</p>
                      <button
                        onClick={() => window.open(attachmentUrl, '_blank')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver en YouTube
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Video de YouTube
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </p>
              </div>
            </div>
          );
        }
        
        // Si no es YouTube, renderizar como video normal
        const isVideoBase64 = attachmentUrl.startsWith('data:');
        const isVideoExternalUrl = attachmentUrl.startsWith('http');
        
        return (
          <div className="relative group">
            <video
              src={attachmentUrl}
              controls
              className="w-full max-h-96 rounded-lg"
              poster={attachmentData?.thumbnail}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Download 
                className="w-4 h-4 text-white cursor-pointer"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = attachmentUrl!;
                  link.download = attachmentData?.name || 'video';
                  link.click();
                }}
              />
            </div>
          </div>
        );

      case 'document':
        if (!attachmentUrl) return null;
        
        const isDocBase64 = attachmentUrl.startsWith('data:');
        const isDocExternalUrl = attachmentUrl.startsWith('http');
        
        return (
          <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
               onClick={() => {
                 if (isDocExternalUrl) {
                   window.open(attachmentUrl, '_blank');
                 } else {
                   // Para base64, crear un enlace de descarga
                   const link = document.createElement('a');
                   link.href = attachmentUrl;
                   link.download = attachmentData?.name || 'documento';
                   link.click();
                 }
               }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {attachmentData?.name || 'Documento'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {attachmentData?.size ? formatFileSize(attachmentData.size) : 'Documento adjunto'}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </div>
          </div>
        );

      case 'youtube':
        if (!attachmentUrl) return null;
        
        // Intentar extraer videoId de diferentes fuentes
        let videoId = attachmentData?.videoId;
        
        // Si no hay videoId en attachmentData, intentar extraerlo de la URL
        if (!videoId && attachmentUrl) {
          const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
          const match = attachmentUrl.match(regex);
          videoId = match ? match[1] : null;
        }
        
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        
        // Debug: Log para ver qué datos tenemos
        
        return (
          <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
            {embedUrl ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  title={attachmentData?.title || 'Video de YouTube'}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative">
                <div className="w-full h-48 bg-slate-700 flex items-center justify-center">
                  <div className="text-center">
                    <Youtube className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm mb-3">No se pudo cargar el video</p>
                    <button
                      onClick={() => window.open(attachmentUrl, '_blank')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en YouTube
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4">
              <h4 className="font-medium text-white mb-1">
                {attachmentData?.title || 'Video de YouTube'}
              </h4>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <Youtube className="w-4 h-4" />
                YouTube
              </p>
            </div>
          </div>
        );

      case 'link':
        if (!attachmentUrl) return null;
        
        // Si es un enlace de YouTube (guardado como 'link' pero con flag isYouTube)
        if (attachmentData?.isYouTube) {
          let videoId = attachmentData?.videoId;
          
          // Si no hay videoId en attachmentData, intentar extraerlo de la URL
          if (!videoId && attachmentUrl) {
            const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
            const match = attachmentUrl.match(regex);
            videoId = match ? match[1] : null;
          }
          
          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
          
          return (
            <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden">
              {embedUrl ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={attachmentData?.title || 'Video de YouTube'}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                        {attachmentData?.title || 'Video de YouTube'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1">
                        <Youtube className="w-4 h-4" />
                        YouTube
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        // Enlace web normal
        return (
          <div className="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
               onClick={() => window.open(attachmentUrl, '_blank')}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Link className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  {attachmentData?.title || 'Enlace web'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
                  {attachmentUrl}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </div>
          </div>
        );

      case 'poll':
        return <InteractivePoll 
          attachmentData={attachmentData} 
          postId={postId} 
          communitySlug={communitySlug} 
        />;

      default:
        return null;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mt-3 ${className}`}
      >
        {renderAttachment()}
      </motion.div>
      
      {/* Modal de imagen */}
      {attachmentType === 'image' && attachmentUrl && (
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={attachmentUrl}
          imageName={attachmentData?.name}
          imageData={attachmentData}
        />
      )}
    </>
  );
});

// Componente de encuesta interactiva
function InteractivePoll({ 
  attachmentData, 
  postId, 
  communitySlug 
}: { 
  attachmentData: any; 
  postId?: string; 
  communitySlug?: string; 
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [pollData, setPollData] = useState(attachmentData);
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Generar un ID único para esta encuesta
  const pollId = `poll-${postId || 'default'}-${Math.random().toString(36).substr(2, 9)}`;

  // Cargar voto del usuario al montar el componente
  useEffect(() => {
    if (postId && communitySlug) {
      loadUserVote();
    }
  }, [postId, communitySlug]);

  const loadUserVote = async () => {
    try {
      const response = await fetch(`/api/communities/${communitySlug}/polls/${postId}/vote`);
      if (response.ok) {
        const data = await response.json();
        setUserVote(data.userVote);
        setSelectedOption(data.userVote);
        // Actualizar pollData con los datos actuales de la base de datos
        if (data.pollData) {
          setPollData(data.pollData);
        }
      }
    } catch (error) {
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !postId || !communitySlug || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/communities/${communitySlug}/polls/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option: selectedOption,
          action: 'vote'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPollData(data.pollData);
        setUserVote(selectedOption);
        
        // Mostrar mensaje de éxito temporal
        setVoteSuccess(true);
        setTimeout(() => setVoteSuccess(false), 2000);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al votar');
      }
    } catch (error) {
      alert('Error al votar');
    } finally {
      setIsVoting(false);
    }
  };

  const calculatePercentage = (option: string) => {
    // Validar que pollData y votes existan
    if (!pollData || !pollData.votes || typeof pollData.votes !== 'object') {
      return 0;
    }

    // Si la opción no existe en votes, retornar 0
    if (!pollData.votes[option]) {
      return 0;
    }

    const totalVotes = Object.values(pollData.votes).reduce((total: number, votes: any) => {
      return total + (Array.isArray(votes) ? votes.length : 0);
    }, 0);

    if (totalVotes === 0) return 0;
    const optionVotes = Array.isArray(pollData.votes[option]) ? pollData.votes[option].length : 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getTotalVotes = () => {
    // Validar que pollData y votes existan
    if (!pollData || !pollData.votes || typeof pollData.votes !== 'object') {
      return 0;
    }

    return Object.values(pollData.votes).reduce((total: number, votes: any) => {
      return total + (Array.isArray(votes) ? votes.length : 0);
    }, 0);
  };

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/60 border border-gray-200 dark:border-slate-600/50 rounded-xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">Encuesta</h4>
          <p className="text-xs text-gray-600 dark:text-slate-400">Participa en la votación</p>
        </div>
        <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg px-3 py-1">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {getTotalVotes()} {getTotalVotes() === 1 ? 'voto' : 'votos'}
          </span>
        </div>
      </div>
      <h5 className="text-gray-900 dark:text-white text-lg font-medium mb-4 leading-relaxed">{pollData?.question}</h5>
      <div className="space-y-3">
        {pollData?.options?.map((option: string, index: number) => {
          const percentage = calculatePercentage(option);
          const isSelected = selectedOption === option;
          const hasUserVoted = userVote === option;
          
          return (
            <motion.div 
              key={index} 
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden ${
                  isSelected 
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-400/50 dark:border-orange-400/50 shadow-lg shadow-orange-500/20' 
                    : 'bg-gray-50 dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/30 hover:bg-gray-100 dark:hover:bg-slate-600/40 hover:border-gray-400 dark:hover:border-slate-500/50'
                }`}
                onClick={() => setSelectedOption(option)}
              >
                {/* Radio button personalizado */}
                <div className="relative">
                  <input
                    type="radio"
                    name={pollId}
                    value={option}
                    id={`${pollId}-option-${index}`}
                    checked={isSelected}
                    onChange={() => setSelectedOption(option)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-orange-400 bg-orange-400 dark:border-orange-400 dark:bg-orange-400' 
                      : 'border-gray-400 dark:border-slate-400 group-hover:border-gray-500 dark:group-hover:border-slate-300'
                  }`}>
                    {isSelected && (
                      <motion.div 
                        className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Contenido de la opción */}
                <div className="flex-1 min-w-0">
                  <label 
                    htmlFor={`${pollId}-option-${index}`}
                    className={`block text-sm font-medium cursor-pointer transition-colors ${
                      isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}
                  >
                    {option}
                  </label>
                  
                  {/* Barra de progreso mejorada */}
                  {getTotalVotes() > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-slate-400">
                          {percentage}% • {Array.isArray(pollData.votes?.[option]) ? pollData.votes[option].length : 0} votos
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-slate-600/50 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${
                            isSelected 
                              ? 'bg-gradient-to-r from-orange-400 to-amber-400' 
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-slate-400 dark:to-slate-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Indicador de porcentaje */}
                <div className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-orange-400/20 text-orange-700 dark:text-orange-300' 
                    : 'bg-gray-200 dark:bg-slate-600/50 text-gray-600 dark:text-slate-400'
                }`}>
                  {percentage}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-between items-center">
        {/* Información adicional */}
        <div className="text-xs text-gray-600 dark:text-slate-500">
          {getTotalVotes() > 0 ? `${getTotalVotes()} personas han votado` : 'Sé el primero en votar'}
        </div>
        
        {/* Botón y mensaje de éxito */}
        <div className="flex items-center gap-3">
          {voteSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2 text-green-400 text-sm font-medium flex items-center gap-2"
            >
              <motion.svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </motion.svg>
              ¡Voto registrado!
            </motion.div>
          )}
          
          <motion.button 
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
              voteSuccess 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25' 
                : isVoting 
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105'
            }`}
            whileHover={!isVoting && !voteSuccess ? { scale: 1.05 } : {}}
            whileTap={!isVoting && !voteSuccess ? { scale: 0.95 } : {}}
          >
            {isVoting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Votando...
              </div>
            ) : userVote ? (
              'Cambiar voto'
            ) : (
              'Votar'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para formatear tamaño de archivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
