const remotePatterns = [
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
];

const images = {
  remotePatterns,
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
  unoptimized: true,
};

module.exports = { images };
