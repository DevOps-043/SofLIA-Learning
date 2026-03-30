'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DragState {
  position: { x: number; y: number };
  isDragging: boolean;
}

export interface UseAIChatDragReturn {
  position: { x: number; y: number };
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  hasMoved: React.RefObject<boolean>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
}

export function useAIChatDrag(isOpen: boolean, isMinimized: boolean): UseAIChatDragReturn {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  // Load saved position on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('lia-chat-position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch {
        // ignore malformed data
      }
    }
  }, []);

  // Save position when it changes
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('lia-chat-position', JSON.stringify(position));
    }
  }, [position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if (isOpen) e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (position.x === 0 && position.y === 0) {
      initialPositionRef.current = { x: rect.left, y: rect.top };
    } else {
      initialPositionRef.current = null;
    }

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  }, [isOpen, position.x, position.y]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    if (position.x === 0 && position.y === 0) {
      initialPositionRef.current = { x: rect.left, y: rect.top };
    } else {
      initialPositionRef.current = null;
    }

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  }, [position.x, position.y]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();

      if (dragStartPos.current) {
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx < 5 && dy < 5) return;
        hasMoved.current = true;
        dragStartPos.current = null;
      }

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      if (initialPositionRef.current) {
        newX = e.clientX - dragOffset.x;
        newY = e.clientY - dragOffset.y;
        initialPositionRef.current = null;
      }

      const containerWidth = containerRef.current.offsetWidth || 384;
      const containerHeight = containerRef.current.offsetHeight || (isMinimized ? 80 : 600);
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];

      let newX = touch.clientX - dragOffset.x;
      let newY = touch.clientY - dragOffset.y;

      if (initialPositionRef.current) {
        newX = touch.clientX - dragOffset.x;
        newY = touch.clientY - dragOffset.y;
        initialPositionRef.current = null;
      }

      const containerWidth = containerRef.current.offsetWidth || 384;
      const containerHeight = containerRef.current.offsetHeight || (isMinimized ? 80 : 600);
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      initialPositionRef.current = null;
      setTimeout(() => {
        dragStartPos.current = null;
        hasMoved.current = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, isMinimized]);

  return { position, isDragging, containerRef, hasMoved, handleMouseDown, handleTouchStart };
}
