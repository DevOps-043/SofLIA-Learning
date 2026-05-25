import type { SofliaJoyrideStep as Step } from '@/features/tours/types/joyride';
import React from 'react';
import { Sparkles, MessageCircle, Mic, Calendar } from 'lucide-react';

export const studyPlannerJoyrideSteps: Step[] = [
  {
    target: '#lia-planner-header',
    title: '¡Bienvenido al Planificador!',
    content: (
      <p>
        Aquí comienza tu viaje de aprendizaje personalizado. LIA, tu asistente inteligente, te ayudará a crear un plan de estudios adaptado a tus necesidades.
      </p>
    ),
    placement: 'bottom' as const,
    disableBeacon: true,
    data: {
      icon: <Sparkles className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#lia-chat-input',
    title: 'Habla con LIA',
    content: (
      <p>
        ¿Tienes dudas o necesitas ajustar tu plan? Puedes chatear con LIA en cualquier momento. ¡Es experta en optimizar tu aprendizaje!
      </p>
    ),
    placement: 'top' as const,
    data: {
      icon: <MessageCircle className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#lia-voice-button',
    title: 'Modo de Voz',
    content: (
      <p>
        Si prefieres hablar, activa el micrófono. LIA te escuchará y responderá instantáneamente. Ideal para sesiones de estudio manos libres.
      </p>
    ),
    placement: 'top' as const,
    data: {
      icon: <Mic className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#lia-calendar-button',
    title: 'Conecta tu Calendario',
    content: (
      <p>
        Para una planificación perfecta, permite que LIA consulte tu disponibilidad. Así evitará programar sesiones cuando estés ocupado.
      </p>
    ),
    placement: 'bottom' as const,
    data: {
      icon: <Calendar className="w-5 h-5 text-accent" />
    }
  }
];
