/** @type {import('next').NextConfig} */
const path = require('path');

// Bundle Analyzer (opcional - deshabilitado)
const withBundleAnalyzer = (config) => config;

// PWA Configuration - DESHABILITADO
const withPWA = (config) => config;

const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Deshabilitar checks durante builds de producción
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración para el monorepo
  transpilePackages: ['@aprende-y-aplica/shared', '@aprende-y-aplica/ui'],

  experimental: {
    externalDir: true,
    // Optimizar importaciones de paquetes como lucide-react
    optimizePackageImports: ['lucide-react'],
    // En Next 14 esta opcion sigue viviendo bajo `experimental`.
    outputFileTracingRoot: path.resolve(__dirname, '../../'),
    // En Next 14 esta opcion se llama `serverComponentsExternalPackages`
    // (renombrada a `serverExternalPackages` en Next 15).
    serverComponentsExternalPackages: ['exceljs', 'pdfmake'],
  },

  // Optimización de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'r2cdn.perplexity.ai',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Bypass server-side image proxy for external Supabase Storage URLs.
    // The Next.js image optimizer fetches remote images from the server process,
    // which in local dev cannot reliably reach Cloudflare CDN (ConnectTimeoutError
    // at 172.64.149.246:443 / 104.18.38.10:443). With unoptimized=true, <Image>
    // components serve the original Supabase CDN URL directly to the browser,
    // which can reach it fine. This eliminates the 16-second timeout cascade that
    // was slowing down the entire local dev server (including auth responses).
    unoptimized: true,
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: 'Aprende y Aplica',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Headers de Seguridad HTTP
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
        ],
      },
      {
        source: '/api/security/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/profile/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/account-settings/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/study-planner/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/certificates/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/business-panel/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/business-user/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/:orgSlug/business-panel/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/:orgSlug/business-user/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        source: '/verification',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'Cache-Control',
            value: 'private, no-store, max-age=0',
          },
        ],
      },
      {
        // Headers específicos para chunks estáticos - Caché largo pero con validación
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers para otros archivos estáticos
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Aplicar headers de seguridad a todas las rutas
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Origin-Agent-Cluster',
            value: '?1'
          },
          // Content Security Policy - Protege contra XSS
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data: https://r2cdn.perplexity.ai",
              "img-src 'self' data: blob: https://*.supabase.co https://via.placeholder.com https://picsum.photos https://images.unsplash.com https://img.youtube.com https://*.googleusercontent.com https://*.basemaps.cartocdn.com https://raw.githubusercontent.com https://cdnjs.cloudflare.com https://unpkg.com https://*.tile.openstreetmap.org",
              "media-src 'self' blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.elevenlabs.io https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com",
              "frame-src 'self' https://accounts.google.com https://www.youtube.com https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              // Solo forzar HTTPS en producción
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : [])
            ].join('; ')
          },
          // Previene clickjacking - no permite que el sitio se cargue en iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Previene MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Controla información del referrer enviada
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Control de permisos del navegador
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()'
          },
          // Previene ataques XSS en navegadores antiguos
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Fuerza HTTPS en navegadores modernos (solo en producción)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }] : [])
        ],
      },
    ];
  },

  // Configuración de Webpack para resolver alias en el monorepo
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/components': path.resolve(__dirname, 'src/shared/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@/hooks': path.resolve(__dirname, 'src/shared/hooks'),
      '@/context': path.resolve(__dirname, 'src/shared/context'),
    };

    // Resolver problema de casing en Windows
    const nodeModulesPath = path.resolve(__dirname, 'node_modules');
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      nodeModulesPath,
    ];

    if (process.platform === 'win32') {
      const normalizePath = (p) => {
        if (p && typeof p === 'string' && p.match(/^[A-Z]:/)) {
          return p.charAt(0).toLowerCase() + p.slice(1);
        }
        return p;
      };

      const normalizedNodeModules = normalizePath(nodeModulesPath);
      
      config.resolve = {
        ...config.resolve,
        symlinks: false,
        cacheWithContext: false,
        modules: [
          ...(config.resolve.modules || []).map((m) => 
            typeof m === 'string' ? normalizePath(m) : m
          ),
          normalizedNodeModules,
        ],
      };

      config.resolveLoader = {
        ...config.resolveLoader,
        symlinks: false,
      };
    }

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
        sharp: 'commonjs sharp',
        html2canvas: 'commonjs html2canvas',
        jspdf: 'commonjs jspdf',
      });
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        canvas: false,
        sharp: false,
      };
    }

    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'rrweb': false,
        'rrweb-player': false,
        '@rrweb/types': false,
      };
      
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          (context, request, callback) => {
            if (request === 'rrweb' || request === 'rrweb-player' || request === '@rrweb/types') {
              return callback(null, 'commonjs ' + request);
            }
            return originalExternals(context, request, callback);
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push('rrweb', 'rrweb-player', '@rrweb/types');
      }
    }

    if (!isServer) {
      const webpack = require('webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          checkResource(resource, context) {
            if (resource.includes('lib/supabase/server')) {
              if (context.includes('features/notifications/services/auto-notifications.service') ||
                  context.includes('features/notifications/services/notification.service') ||
                  context.includes('features/auth/services/questionnaire-validation.service')) {
                return true;
              }
            }
            return false;
          },
        })
      );
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
