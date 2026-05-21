import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { buildAuthLoginPath } from '@/lib/auth/auth-routes';

interface RefreshSessionResponse {
  accessToken?: string;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para añadir token JWT
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejar errores globales
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, intentar refresh
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
          if (refreshToken) {
            try {
              const response = await this.post<RefreshSessionResponse, { refreshToken: string }>(
                '/auth/refresh',
                { refreshToken }
              );
              if (typeof window !== 'undefined' && response.accessToken) {
                localStorage.setItem('accessToken', response.accessToken);
              }
              // Reintentar request original
              return this.client.request(error.config);
            } catch (refreshError) {
              // Refresh falló, redirigir al login
              if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = buildAuthLoginPath('session_expired');
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  async patch<T = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }
}

export const apiService = new ApiService();
