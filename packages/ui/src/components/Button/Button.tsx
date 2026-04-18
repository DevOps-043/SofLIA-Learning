'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-out focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden transform-gpu group',
  {
    variants: {
      variant: {
        primary: 'bg-[#0A2540] text-white shadow-lg shadow-[#0A2540]/30 hover:bg-[#0d2f4d] hover:shadow-2xl hover:shadow-[#0A2540]/60 dark:bg-[#00D4B3] dark:text-[#0A2540] dark:shadow-[#00D4B3]/30 dark:hover:bg-[#00b89a] dark:hover:shadow-[#00D4B3]/60 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 after:absolute after:inset-0 after:bg-gradient-to-r after:from-[#0A2540]/20 after:via-[#0A2540]/30 after:to-[#0A2540]/20 dark:after:from-[#00D4B3]/20 dark:after:via-[#00D4B3]/30 dark:after:to-[#00D4B3]/20 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500 hover:animate-pulse-glow focus-visible:ring-2 focus-visible:ring-[#0A2540] dark:focus-visible:ring-[#00D4B3] focus-visible:ring-offset-2',
        secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:border-primary dark:border-accent dark:text-accent dark:hover:bg-accent dark:hover:text-[#0A2540] dark:hover:border-accent hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] before:absolute before:inset-0 before:bg-primary dark:before:bg-accent before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 before:-z-10 focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent focus-visible:ring-offset-2',
        tertiary: 'text-[#0A2540] hover:text-[#0d2f4d] dark:text-[#00D4B3] dark:hover:text-[#00b89a] hover:scale-105 transition-all duration-300 hover:bg-[#0A2540]/5 dark:hover:bg-[#00D4B3]/10 px-4 py-2 rounded-lg focus-visible:ring-2 focus-visible:ring-[#0A2540] dark:focus-visible:ring-[#00D4B3] focus-visible:ring-offset-2',
        ghost: 'border bg-transparent backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        gradient: 'bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#0A2540] text-white shadow-xl shadow-[#0A2540]/40 hover:shadow-2xl hover:shadow-[#0A2540]/70 hover:from-[#0d2f4d] hover:via-[#0A2540] hover:to-[#0d2f4d] dark:from-[#00D4B3] dark:via-[#00D4B3] dark:to-[#00D4B3] dark:text-[#0A2540] dark:shadow-[#00D4B3]/40 dark:hover:from-[#00b89a] dark:hover:via-[#00D4B3] dark:hover:to-[#00b89a] dark:hover:shadow-[#00D4B3]/70 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:via-white/20 before:to-white/10 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-r after:from-[#0A2540]/10 after:via-[#0A2540]/20 after:to-[#0A2540]/10 dark:after:from-[#00D4B3]/10 dark:after:via-[#00D4B3]/20 dark:after:to-[#00D4B3]/10 after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-500',
        destructive: 'bg-gradient-to-r from-error to-red-600 text-white shadow-lg shadow-error/30 hover:shadow-xl hover:shadow-error/50 hover:scale-[1.02] hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-10 px-4 text-sm min-w-[80px]',
        md: 'h-12 px-6 text-base min-w-[120px]',
        lg: 'h-14 px-8 text-lg min-w-[140px]',
        icon: 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, asChild = false, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Crear efecto ripple solo si no es botón ghost
      if (variant !== 'ghost') {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          pointer-events: none;
          z-index: 0;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      }
      
      // Llamar al onClick original si existe
      onClick?.(e);
    };

    // Clase CSS específica para cada variante
    const getVariantClass = () => {
      switch (variant) {
        case 'ghost':
          return 'button-ghost';
        case 'primary':
          return 'button-primary';
        case 'secondary':
          return 'button-secondary';
        default:
          return '';
      }
    };

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          variant === 'ghost' && 'btn-ghost',
          getVariantClass()
        )}
        ref={ref}
        {...props}
        onClick={handleClick}
      >
        {/* Efectos de animación - solo para botones que no sean ghost */}
        {variant !== 'ghost' && (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out opacity-60" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/20 via-[#0A2540]/30 to-[#0A2540]/20 opacity-0 transition-opacity duration-500 rounded-xl group-hover:opacity-100 dark:from-[#00D4B3]/20 dark:via-[#00D4B3]/30 dark:to-[#00D4B3]/20" />
          </>
        )}
        
        {/* Contenido del botón */}
        <span className="relative z-20 flex items-center gap-2 font-semibold">
          {props.children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
