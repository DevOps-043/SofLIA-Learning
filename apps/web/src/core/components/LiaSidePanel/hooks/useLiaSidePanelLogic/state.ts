import { useRef, useState } from 'react';

export function useLiaSidePanelState() {
  const [inputValue, setInputValue] = useState('');
  const [currentTip, setCurrentTip] = useState('');
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  return {
    inputValue,
    setInputValue,
    currentTip,
    setCurrentTip,
    isAvatarExpanded,
    setIsAvatarExpanded,
    isOptionsMenuOpen,
    setIsOptionsMenuOpen,
    isPersonalizationOpen,
    setIsPersonalizationOpen,
    inputRef,
    messagesEndRef,
    chatContainerRef,
    optionsMenuRef,
  };
}
