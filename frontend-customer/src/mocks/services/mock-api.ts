/**
 * Mock API Service
 * Main service for handling mock API requests
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { MockRequest, MockResponse } from '../types';
import { mockConfig } from '@/config/mock.config';
import { simulateDelay, createErrorResponse, simulateError } from './mock-utils';

export interface MockApiHandler {
  (request: MockRequest): Promise<MockResponse>;
}

class MockApiService {
  private handlers: Map<string, MockApiHandler> = new Map();

  /**
   * Register a handler for a specific route
   */
  registerHandler(pattern: string, handler: MockApiHandler): void {
    this.handlers.set(pattern, handler);
    if (import.meta.env.DEV) {
      console.log('📝 Registered mock handler:', pattern);
    }
  }

  /**
   * Extract path params from URL based on pattern (e.g. :id from /sales/invoices/:id)
   */
  private extractPathParams(patternUrl: string, actualUrl: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = patternUrl.split('/').filter(Boolean);
    const actualParts = actualUrl.split('/').filter(Boolean);

    if (patternParts.length !== actualParts.length) return params;

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]!;
      const actualPart = actualParts[i]!;
      if (patternPart.startsWith(':') && actualPart) {
        const paramName = patternPart.slice(1);
        params[paramName] = actualPart;
      }
    }
    return params;
  }

  /**
   * Find handler for a given URL
   * Returns handler and matched pattern (for path param extraction)
   */
  private findHandler(
    url: string,
    method: string
  ): { handler: MockApiHandler; patternUrl?: string } | null {
    // Try exact match first
    const exactKey = `${method}:${url}`;
    if (import.meta.env.DEV) {
      console.log('🔍 Looking for handler:', exactKey);
    }

    if (this.handlers.has(exactKey)) {
      if (import.meta.env.DEV) {
        console.log('✅ Found exact match:', exactKey);
      }
      return { handler: this.handlers.get(exactKey)! };
    }

    // Try pattern matching
    for (const [pattern, handler] of this.handlers.entries()) {
      const colonIndex = pattern.indexOf(':');
      const patternMethod = pattern.slice(0, colonIndex);
      const patternUrl = pattern.slice(colonIndex + 1);

      if (patternMethod !== method) continue;

      // Convert pattern to regex
      const regexPattern =
        (patternUrl || '')
          .replace(/\//g, '\\/')
          .replace(/:[^/]+/g, '[^/]+')
          .replace(/\*/g, '.*') || '';
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(url)) {
        if (import.meta.env.DEV) {
          console.log('✅ Found pattern match:', pattern, 'for', url);
        }
        return { handler, patternUrl };
      }
    }

    if (import.meta.env.DEV) {
      console.log('❌ No handler found for:', method, url);
    }
    return null;
  }

  /**
   * Handle API request
   */
  async handleRequest(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    if (!mockConfig.enabled) {
      throw createErrorResponse(500, 'Mock mode is not enabled');
    }

    // Simulate network delay
    await simulateDelay(mockConfig.delayMin, mockConfig.delayMax);

    // Simulate random errors
    if (simulateError(mockConfig.errorRate)) {
      throw createErrorResponse(500, 'Simulated server error');
    }

    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';
    
    if (import.meta.env.DEV) {
      console.log('🔵 Mock API processing:', method, url);
    }
    
    // Remove base URL and query string for matching
    let cleanUrl = url
      .replace(/^https?:\/\/[^/]+/, '') // Remove protocol and domain
      .replace(/\/api\/v\d+/, '') // Remove /api/v1 or /api/v2 etc
      .split('?')[0]; // Remove query string
    
    // Ensure URL starts with /
    if (cleanUrl && !cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }

    if (import.meta.env.DEV) {
      console.log('🔵 Clean URL for matching:', cleanUrl);
      console.log('🔵 Available handlers:', Array.from(this.handlers.keys()));
    }

    // Find handler
    const match = this.findHandler(cleanUrl || '', method);

    if (!match) {
      console.warn(`❌ No mock handler found for ${method} ${cleanUrl}`);
      console.warn('📋 Available handlers:', Array.from(this.handlers.keys()));
      console.warn('🔍 Original URL:', url);
      throw createErrorResponse(404, `Mock handler not found for ${method} ${cleanUrl}`);
    }

    const { handler, patternUrl } = match;

    if (import.meta.env.DEV) {
      console.log('✅ Mock handler found for:', method, cleanUrl);
    }

    // Extract query params
    const urlObj = new URL(url, 'http://localhost');
    const params: Record<string, string | number | boolean> = {};
    urlObj.searchParams.forEach((value, key) => {
      // Try to parse as number or boolean
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else if (!isNaN(Number(value)) && value !== '') params[key] = Number(value);
      else params[key] = value;
    });

    // Extract and merge path params (e.g. :id from /sales/invoices/:id)
    if (patternUrl) {
      const pathParams = this.extractPathParams(patternUrl, cleanUrl || '');
      Object.assign(params, pathParams);
    }

    // Create mock request
    const mockRequest: MockRequest = {
      method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      url: cleanUrl || '',
      params,
      data: config.data,
      headers: config.headers as Record<string, string>,
    };

    try {
      // Call handler
      const response = await handler(mockRequest);
      
      // Validate response
      if (!response || !response.data) {
        console.error('Invalid mock response:', response);
        throw createErrorResponse(500, 'Invalid mock response from handler');
      }
      
      // Create axios-like response
      return {
        data: {
          data: response.data,
          message: response.message,
          statusCode: response.statusCode || 200,
        },
        status: response.statusCode || 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    } catch (error: unknown) {
      // Check if it's already an axios error
      if (error && typeof error === 'object' && 'response' in error) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw createErrorResponse(500, error.message);
      }
      throw createErrorResponse(500, 'Mock handler error');
    }
  }

  /**
   * Check if mock mode is enabled
   */
  isEnabled(): boolean {
    // Import dynamically to avoid circular dependency
    return mockConfig.enabled;
  }
  
  /**
   * Get list of registered handlers (for debugging)
   */
  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Singleton instance
export const mockApi = new MockApiService();

export default mockApi;

