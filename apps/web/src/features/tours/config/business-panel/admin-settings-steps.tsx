import type { SofliaJoyrideStep as Step } from '@/features/tours/types/joyride';
import { TFunction } from 'i18next';
import { Settings, Building2, Palette, LayoutGrid, Shield } from 'lucide-react';

export const ADMIN_SETTINGS_TOUR_ID = 'admin-settings-tour';

export const getAdminSettingsSteps = (t: TFunction): Step[] => [
  {
    target: '#tour-settings-hero',
    title: t('adminTour.steps.settingsHero.title', 'Configuración'),
    content: t('adminTour.steps.settingsHero.content', 'Tu panel de control central. Desde aquí gestionas toda la configuración de tu organización: datos generales, personalización visual y branding corporativo.'),
    disableBeacon: true,
    data: {
      icon: <Settings className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-settings-tabs',
    title: t('adminTour.steps.settingsTabs.title', 'Pestañas de Configuración'),
    content: t('adminTour.steps.settingsTabs.content', 'Navega entre las secciones disponibles. En "Organización" ajustas los datos generales y el login personalizado. En "Branding" defines los colores y estilos de tu plataforma.'),
    data: {
      icon: <LayoutGrid className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-settings-content',
    title: t('adminTour.steps.settingsContent.title', 'Panel de Contenido'),
    content: t('adminTour.steps.settingsContent.content', 'Aquí se muestra el formulario de la pestaña seleccionada. Los cambios que realices se guardan automáticamente al presionar el botón de guardar en cada sección.'),
    data: {
      icon: <Building2 className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-settings-org-tab',
    title: t('adminTour.steps.settingsOrgTab.title', 'Pestaña Organización'),
    content: t('adminTour.steps.settingsOrgTab.content', 'Configura el nombre, logo, descripción y datos de contacto de tu organización. También puedes personalizar la pantalla de login para tus usuarios.'),
    data: {
      icon: <Shield className="w-5 h-5 text-accent" />
    }
  },
  {
    target: '#tour-settings-branding-tab',
    title: t('adminTour.steps.settingsBrandingTab.title', 'Pestaña Branding'),
    content: t('adminTour.steps.settingsBrandingTab.content', 'Define los colores primarios y de acento para personalizar toda la experiencia visual de tu plataforma. Esta función está disponible en el plan Enterprise.'),
    data: {
      icon: <Palette className="w-5 h-5 text-accent" />
    }
  }
];
