import { z } from 'zod';
import { API_BASE_URL, ENABLE_MOCK_FALLBACK } from '../constants.ts';
import { logger } from '../utils/logger.ts';

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  details?: any;
  validationErrors?: z.ZodIssue[];
};

class ApiClient {
  private static instance: ApiClient;
  private token: string | null = localStorage.getItem('token');
  private unauthorizedCallbacks: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient();
    return ApiClient.instance;
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  public onUnauthorized(callback: () => void) {
    this.unauthorizedCallbacks.push(callback);
  }

  /**
   * Core Request Wrapper with Zod Runtime Validation
   * @param path API endpoint path
   * @param options Fetch options
   * @param schema Zod schema to validate response against
   */
  private async request<T>(
    path: string, 
    options: RequestInit = {}, 
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = new Headers(options.headers);
    
    headers.set('Content-Type', 'application/json');
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        this.clearToken();
        this.unauthorizedCallbacks.forEach(cb => cb());
        window.dispatchEvent(new CustomEvent('unauthorized'));
        throw { status: 401, message: 'Session Expired' };
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw { 
          status: response.status, 
          message: errData.message || 'System error',
          code: errData.code 
        } as ApiError;
      }

      const rawData = await response.json();

      // STRICT VALIDATION: If no schema provided, we log a warning as per enterprise policy
      if (!schema) {
        logger.warn(`Untrusted response received from ${path}. No Zod schema provided.`);
        return rawData as T;
      }

      const result = schema.safeParse(rawData);
      
      if (!result.success) {
        logger.error(`[Data Integrity Violation] Validation Failed for ${path}`, {
          errors: result.error.errors,
          receivedData: rawData
        });
        
        throw { 
          status: 500, 
          message: 'Response Data Integrity Violation', 
          validationErrors: result.error.errors,
          details: 'The server returned data that does not match the enterprise contract.'
        } as ApiError;
      }

      return result.data;
    } catch (error: any) {
      if (ENABLE_MOCK_FALLBACK && error.status !== 401) {
          logger.warn(`API Exception at ${path}: ${error.message}. Fallback mechanism active.`);
      }
      throw error;
    }
  }

  public get<T>(path: string, schema?: z.ZodSchema<T>) { 
    return this.request<T>(path, { method: 'GET' }, schema); 
  }
  
  public post<T>(path: string, body: any, schema?: z.ZodSchema<T>) { 
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }, schema); 
  }
  
  public patch<T>(path: string, body: any, schema?: z.ZodSchema<T>) { 
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, schema); 
  }
  
  public delete<T>(path: string, schema?: z.ZodSchema<T>) { 
    return this.request<T>(path, { method: 'DELETE' }, schema); 
  }
}

export const api = ApiClient.getInstance();