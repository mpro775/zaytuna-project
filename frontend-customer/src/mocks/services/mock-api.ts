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
  }

  /**
   * Find handler for a given URL
   */
  private findHandler(url: string, method: string): MockApiHandler | null {
    // Try exact match first
    const exactKey = `${method}:${url}`;
    if (this.handlers.has(exactKey)) {
      return this.handlers.get(exactKey)!;
    }

    // Try pattern matching
    for (const [pattern, handler] of this.handlers.entries()) {
      const [patternMethod, patternUrl] = pattern.split(':');
      
      if (patternMethod !== method) continue;

      // Convert pattern to regex
      const regexPattern = patternUrl
        .replace(/\//g, '\\/')
        .replace(/:[^/]+/g, '[^/]+')
        .replace(/\*/g, '.*');
      
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(url)) {
        return handler;
      }
    }

    return null;
  }

  /**
   * Extract params from URL pattern
   */
  private extractParams(pattern: string, url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const urlParts = url.split('/');

    patternParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = urlParts[index] || '';
      }
    });

    return params;
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
    
    // Remove base URL and query string for matching
    const cleanUrl = url
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/\/api\/v\d+/, '')
      .split('?')[0];

    // Find handler
    const handler = this.findHandler(cleanUrl, method);
    
    if (!handler) {
      console.warn(`No mock handler found for ${method} ${cleanUrl}`);
      throw createErrorResponse(404, `Mock handler not found for ${method} ${cleanUrl}`);
    }

    // Extract query params
    const urlObj = new URL(url, 'http://localhost');
    const params: Record<string, any> = {};
    urlObj.searchParams.forEach((value, key) => {
      // Try to parse as number or boolean
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else if (!isNaN(Number(value)) && value !== '') params[key] = Number(value);
      else params[key] = value;
    });

    // Create mock request
    const mockRequest: MockRequest = {
      method: method as any,
      url: cleanUrl,
      params,
      data: config.data,
      headers: config.headers as Record<string, string>,
    };

    try {
      // Call handler
      const response = await handler(mockRequest);
      
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
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      throw createErrorResponse(500, error.message || 'Mock handler error');
    }
  }

  /**
   * Check if mock mode is enabled
   */
  isEnabled(): boolean {
    return mockConfig.enabled;
  }
}

// Singleton instance
export const mockApi = new MockApiService();

export default mockApi;

