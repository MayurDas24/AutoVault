import { ApiError } from './errors'
import type {
  AuthResult,
  Pagination,
  User,
  Vehicle,
  VehicleList,
  VehicleResponse,
} from './types'

/**
 * Every assumption about the backend's response shapes lives in this file.
 * If the API changes, adjust the parsers here and nowhere else.
 *
 *   POST /auth/register          -> { user }
 *   POST /auth/login             -> { token, user }
 *   GET  /auth/me                -> { user }
 *   GET  /vehicles[/search]      -> { vehicles, pagination }
 *   GET|POST|PUT /vehicles[/:id] -> { vehicle }
 *   POST /vehicles/:id/purchase  -> { message, vehicle }
 *   POST /vehicles/:id/restock   -> { message, vehicle }
 *   DELETE /vehicles/:id         -> 204 (no body)
 */

type UnknownRecord = Record<string, unknown>

function invalid(detail: string): ApiError {
  return new ApiError(
    0,
    'INVALID_RESPONSE',
    `The server sent an unexpected response (${detail}).`,
  )
}

function asRecord(value: unknown, detail: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw invalid(detail)
  }
  return value as UnknownRecord
}

function readString(record: UnknownRecord, key: string, detail: string): string {
  const value = record[key]
  if (typeof value !== 'string') throw invalid(`${detail}.${key}`)
  return value
}

function readInteger(record: UnknownRecord, key: string, detail: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalid(`${detail}.${key}`)
  }
  return value
}

function readPrice(record: UnknownRecord, detail: string): string {
  const value = record['price']
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2)
  }
  throw invalid(`${detail}.price`)
}

export function parseUser(value: unknown): User {
  const record = asRecord(value, 'user')
  const role = record['role']

  if (role !== 'USER' && role !== 'ADMIN') throw invalid('user.role')

  return {
    id: readString(record, 'id', 'user'),
    name: readString(record, 'name', 'user'),
    email: readString(record, 'email', 'user'),
    role,
  }
}

export function parseVehicle(value: unknown): Vehicle {
  const record = asRecord(value, 'vehicle')

  return {
    id: readString(record, 'id', 'vehicle'),
    make: readString(record, 'make', 'vehicle'),
    model: readString(record, 'model', 'vehicle'),
    category: readString(record, 'category', 'vehicle'),
    price: readPrice(record, 'vehicle'),
    quantity: readInteger(record, 'quantity', 'vehicle'),
    createdAt: readString(record, 'createdAt', 'vehicle'),
    updatedAt: readString(record, 'updatedAt', 'vehicle'),
  }
}

function parsePagination(value: unknown): Pagination {
  const record = asRecord(value, 'pagination')

  return {
    page: readInteger(record, 'page', 'pagination'),
    limit: readInteger(record, 'limit', 'pagination'),
    total: readInteger(record, 'total', 'pagination'),
    totalPages: readInteger(record, 'totalPages', 'pagination'),
  }
}

export function parseVehicleList(value: unknown): VehicleList {
  const record = asRecord(value, 'vehicle list')
  const vehicles = record['vehicles']

  if (!Array.isArray(vehicles)) throw invalid('vehicles')

  return {
    vehicles: vehicles.map(parseVehicle),
    pagination: parsePagination(record['pagination']),
  }
}

export function parseVehicleResponse(value: unknown): VehicleResponse {
  const record = asRecord(value, 'vehicle response')
  const message = record['message']

  return {
    vehicle: parseVehicle(record['vehicle']),
    message: typeof message === 'string' ? message : null,
  }
}

export function parseUserResponse(value: unknown): User {
  return parseUser(asRecord(value, 'user response')['user'])
}

export function parseAuthResult(value: unknown): AuthResult {
  const record = asRecord(value, 'auth response')
  const token = record['token']

  if (typeof token !== 'string' || token.length === 0) throw invalid('token')

  return { token, user: parseUser(record['user']) }
}

/** For endpoints that return no body (e.g. DELETE -> 204). */
export function parseNothing(): void {
  return undefined
}