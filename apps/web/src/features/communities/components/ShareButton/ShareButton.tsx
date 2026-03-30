'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Link, MessageSquare, Mail, Twitter, Facebook } from 'lucide-react';
import { Button } from '@aprende-y-aplica/ui';
import { getBaseUrl } from '../../../../lib/env';

interface ShareButtonProps {
  postId: string;
  postContent: string;
  communityName: string;
  communitySlug: string;
}

export function ShareButton({ postId, postContent, communityName, communitySlug }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && 
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Usar el ID del post para la URL
  const postUrl = `${getBaseUrl()}/communities/${communitySlug}/posts/${postId}`;
  const shareText = `Mira este post de ${communityName}: "${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}"`;

  const shareOptions = [
    {
      name: 'Copiar enlace',
      icon: Copy,
      action: () => copyToClipboard(postUrl),
      color: 'text-blue-400'
    },
    {
      name: 'Compartir en Twitter',
      icon: Twitter,
      action: () => shareToTwitter(),
      color: 'text-blue-400'
    },
    {
      name: 'Compartir en Facebook',
      icon: Facebook,
      action: () => shareToFacebook(),
      color: 'text-blue-600'
    },
    {
      name: 'Compartir por email',
      icon: Mail,
      action: () => shareByEmail(),
      color: 'text-green-400'
    }
  ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const subject = `Post de ${communityName}`;
    const body = `${shareText}\n\nVer post completo: ${postUrl}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
  };

  return (
    <div className="relative" ref={buttonRef}>
      {/* Botón principal */}
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 className="w-5 h-5" />
        <span>Compartir</span>
      </motion.button>

      {/* Menú de compartir */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-600 rounded-2xl p-3 shadow-2xl backdrop-blur-sm z-50 min-w-[200px]"
          >
            <div className="space-y-2">
              {shareOptions.map((option, index) => (
                <motion.button
                  key={option.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={option.action}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                >
                  <option.icon className={`w-4 h-4 ${option.color}`} />
                  <span className="text-slate-200 text-sm">{option.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Indicador de copiado */}
            <AnimatePresence>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-2 pt-2 border-t border-slate-600"
                >
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <Copy className="w-3 h-3" />
                    ¡Enlace copiado!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
