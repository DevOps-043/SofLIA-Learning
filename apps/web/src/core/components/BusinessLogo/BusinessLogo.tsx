'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';

export function BusinessLogo() {
  const logoRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline de entrada secuencial
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Icono aparece con escala
      tl.from(iconRef.current, {
        opacity: 0,
        scale: 0,
        duration: 0.8,
        ease: 'back.out(1.7)'
      });

      // 2. Texto aparece con efecto de typing
      tl.from(textRef.current, {
        opacity: 0,
        x: -30,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.4');

      // 3. Badge aparece con bounce
      tl.from(badgeRef.current, {
        opacity: 0,
        scale: 0,
        y: -20,
        duration: 0.7,
        ease: 'elastic.out(1, 0.5)'
      }, '-=0.3');

      // Animación continua de flotación del icono
      gsap.to(iconRef.current, {
        y: -8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Glow pulsante
      gsap.to(glowRef.current, {
        opacity: 0.8,
        scale: 1.2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Partículas flotantes
      gsap.to(particlesRef.current?.children || [], {
        y: -20,
        opacity: 0,
        duration: 2,
        stagger: 0.2,
        repeat: -1,
        ease: 'power1.out'
      });
    }, logoRef);

    return () => ctx.revert();
  }, []);

  const handleHover = () => {
    gsap.to(iconRef.current, {
      scale: 1.1,
      duration: 0.3,
      ease: 'power2.out'
    });

    gsap.to(badgeRef.current, {
      scale: 1.15,
      boxShadow: '0 10px 30px rgba(139, 92, 246, 0.6)',
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleHoverEnd = () => {
    gsap.to(iconRef.current, {
      scale: 1,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)'
    });

    gsap.to(badgeRef.current, {
      scale: 1,
      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <Link 
      href="/business" 
      className="flex items-center gap-2 cursor-pointer group"
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverEnd}
    >
      <div ref={logoRef} className="relative flex items-center gap-2">
        {/* Logo Icon con GSAP */}
        <div 
          ref={iconRef}
          className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden relative"
        >
          <Image
            src="/icono.png"
            alt="SofLIA Logo"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Logo Text */}
        <span 
          ref={textRef}
          className="font-bold text-lg lg:text-xl hidden sm:inline-block"
          style={{ color: '#8B5CF6' }}
        >
          SofLIA
        </span>
        
        {/* Business Badge con Lottie + GSAP */}
        <div className="relative flex-shrink-0">
          {/* Glow effect background */}
          <div
            ref={glowRef}
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-md opacity-50"
          />
          
          {/* Partículas flotantes */}
          <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: '50%',
                  opacity: 0.6
                }}
              />
            ))}
          </div>
          
          {/* Badge principal con animación Lottie */}
          <div
            ref={badgeRef}
            className="relative text-xs font-bold px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full italic bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg overflow-hidden whitespace-nowrap"
          >
            <span className="relative z-10">Business</span>
            
            {/* Shimmer effect con GSAP */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: 'shimmer 3s infinite linear'
              }}
            />
          </div>
        </div>
      </div>
      
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }
          `,
        }}
      />
    </Link>
  );
}
