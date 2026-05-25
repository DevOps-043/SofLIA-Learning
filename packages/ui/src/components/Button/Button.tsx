'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-out focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer relative overflow-hidden transform-gpu group',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover hover:shadow-2xl hover:shadow-primary/60 dark:bg-accent dark:text-primary dark:shadow-accent/30 dark:hover:bg-accent-hover dark:hover:shadow-accent/60 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/20 after:via-primary/30 after:to-primary/20 dark:after:from-accent/20 dark:after:via-accent/30 dark:after:to-accent/20 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500 hover:animate-pulse-glow focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent focus-visible:ring-offset-2',
        secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:border-primary dark:border-accent dark:text-accent dark:hover:bg-accent dark:hover:text-primary dark:hover:border-accent hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] before:absolute before:inset-0 before:bg-primary dark:before:bg-accent before:translate-y-full hover:before:translate-y-0 before:transition-transform before:duration-300 before:-z-10 focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent focus-visible:ring-offset-2',
        tertiary: 'text-primary hover:text-primary-hover dark:text-accent dark:hover:text-accent-hover hover:scale-105 transition-all duration-300 hover:bg-primary/5 dark:hover:bg-accent/10 px-4 py-2 rounded-lg focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-accent focus-visible:ring-offset-2',
        ghost: 'border bg-transparent backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        gradient: 'bg-gradient-to-r from-primary via-primary to-primary text-white shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/70 hover:from-primary-hover hover:via-primary hover:to-primary-hover dark:from-accent dark:via-accent dark:to-accent dark:text-primary dark:shadow-accent/40 dark:hover:from-accent-hover dark:hover:via-accent dark:hover:to-accent-hover dark:hover:shadow-accent/70 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:via-white/20 before:to-white/10 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-r after:from-primary/10 after:via-primary/20 after:to-primary/10 dark:after:from-accent/10 dark:after:via-accent/20 dark:after:to-accent/10 after:opacity-0 hover:after:opacity-100 after:transition-all after:duration-500',
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
            <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 opacity-0 transition-opacity duration-500 rounded-xl group-hover:opacity-100 dark:from-accent/20 dark:via-accent/30 dark:to-accent/20" />
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
