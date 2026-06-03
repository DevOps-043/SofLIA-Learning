const outputFileTracingExcludes = {
  '*': [
    './node_modules/three/**',
    './node_modules/@react-three/**',
    './node_modules/video.js/**',
    './node_modules/videojs-vtt.js/**',
    './node_modules/@nivo/**',
    './node_modules/recharts/**',
    './node_modules/d3-**',
    './node_modules/victory-**',
    './node_modules/@tremor/**',
    './node_modules/@tsparticles/**',
    './node_modules/tsparticles/**',
    './node_modules/leaflet/**',
    './node_modules/react-leaflet/**',
    './node_modules/gsap/**',
    './node_modules/@gsap/**',
    './node_modules/@fullcalendar/**',
    './node_modules/moment/locale/**',
    './node_modules/moment/min/**',
    './node_modules/react-big-calendar/**',
    './node_modules/framer-motion/**',
    './node_modules/typewriter-effect/**',
    './node_modules/swapy/**',
    './node_modules/react-joyride/**',
    './node_modules/react-easy-crop/**',
  ],
};

const serverExternalPackages = [
  'exceljs',
  'pdfmake',
  'nodemailer',
  'xml2js',
  'jszip',
  'node-vibrant',
  'bcryptjs',
];

module.exports = {
  outputFileTracingExcludes,
  serverExternalPackages,
};
