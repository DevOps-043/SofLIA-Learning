// Superficie CLIENTE de TTS. `server.service` queda deliberadamente FUERA del
// barrel: es código de servidor (lee la API key) y re-exportarlo aquí lo arrastraba
// al bundle del navegador. Los consumidores de servidor lo importan directamente.
export * from './client.service';
export * from './shared';
export * from './types';
