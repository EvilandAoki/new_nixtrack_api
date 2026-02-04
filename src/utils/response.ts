import { Response } from 'express';

/**
 * Interfaz para respuestas exitosas de la API
 */
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Interfaz para respuestas de error
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

/**
 * Interfaz para respuestas paginadas
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Enviar respuesta exitosa
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
};

/**
 * Enviar respuesta de error
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: any
): void => {
  const response: ApiErrorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  res.status(statusCode).json(response);
};

/**
 * Enviar respuesta paginada
 */
export const sendPaginated = <T>(
  res: Response,
  items: T[],
  total: number,
  page: number = 1,
  limit: number = 20
): void => {
  const response: ApiResponse<PaginatedData<T>> = {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
  res.json(response);
};

/**
 * Crear respuesta paginada (sin enviar)
 */
export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number = 1,
  limit: number = 20
): PaginatedData<T> => {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
