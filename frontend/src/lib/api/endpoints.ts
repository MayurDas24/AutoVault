import { apiRequest } from './client'
import type { QueryParams } from './client'
import {
  parseAuthResult,
  parseNothing,
  parseUserResponse,
  parseVehicleList,
  parseVehicleResponse,
} from './parsers'
import type {
  AuthResult,
  CreateVehicleInput,
  LoginInput,
  RegisterInput,
  UpdateVehicleInput,
  User,
  Vehicle,
  VehicleList,
  VehicleQuery,
  VehicleResponse,
} from './types'

// ---- Auth -----------------------------------------------------------------

export function login(input: LoginInput): Promise<AuthResult> {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: input,
    authenticated: false,
    parse: parseAuthResult,
  })
}

/** Registration never sends a role; the server always creates a USER. */
export function register(input: RegisterInput): Promise<User> {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name: input.name, email: input.email, password: input.password },
    authenticated: false,
    parse: parseUserResponse,
  })
}

export function getCurrentUser(signal?: AbortSignal): Promise<User> {
  return apiRequest('/api/auth/me', { signal, parse: parseUserResponse })
}

// ---- Vehicles -------------------------------------------------------------

function toQueryParams(query: VehicleQuery): QueryParams {
  return {
    q: query.q,
    make: query.make,
    model: query.model,
    category: query.category,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    inStock: query.inStock,
    page: query.page,
    limit: query.limit,
  }
}

function hasFilters(query: VehicleQuery): boolean {
  return [
    query.q,
    query.make,
    query.model,
    query.category,
    query.minPrice,
    query.maxPrice,
    query.inStock,
  ].some((value) => value !== undefined && value !== '')
}

/** Uses the search endpoint whenever any filter is present. */
export function listVehicles(
  query: VehicleQuery = {},
  signal?: AbortSignal,
): Promise<VehicleList> {
  return apiRequest(hasFilters(query) ? '/api/vehicles/search' : '/api/vehicles', {
    query: toQueryParams(query),
    signal,
    parse: parseVehicleList,
  })
}

function vehiclePath(id: string): string {
  return `/api/vehicles/${encodeURIComponent(id)}`
}

export function getVehicle(id: string, signal?: AbortSignal): Promise<Vehicle> {
  return apiRequest(vehiclePath(id), {
    signal,
    parse: (payload) => parseVehicleResponse(payload).vehicle,
  })
}

export function createVehicle(input: CreateVehicleInput): Promise<VehicleResponse> {
  return apiRequest('/api/vehicles', {
    method: 'POST',
    body: input,
    parse: parseVehicleResponse,
  })
}

export function updateVehicle(
  id: string,
  input: UpdateVehicleInput,
): Promise<VehicleResponse> {
  return apiRequest(vehiclePath(id), {
    method: 'PUT',
    body: input,
    parse: parseVehicleResponse,
  })
}

export function deleteVehicle(id: string): Promise<void> {
  return apiRequest(vehiclePath(id), { method: 'DELETE', parse: parseNothing })
}

export function purchaseVehicle(id: string): Promise<VehicleResponse> {
  return apiRequest(`${vehiclePath(id)}/purchase`, {
    method: 'POST',
    parse: parseVehicleResponse,
  })
}

export function restockVehicle(
  id: string,
  quantity: number,
): Promise<VehicleResponse> {
  return apiRequest(`${vehiclePath(id)}/restock`, {
    method: 'POST',
    body: { quantity },
    parse: parseVehicleResponse,
  })
}