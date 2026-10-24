export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResult {
  token: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  category: string
  /** Decimal string such as "45999.00", exactly as the API returns it. */
  price: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface VehicleList {
  vehicles: Vehicle[]
  pagination: Pagination
}

/** Query parameters accepted by GET /api/vehicles and /api/vehicles/search. */
export interface VehicleQuery {
  q?: string
  make?: string
  model?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  page?: number
  limit?: number
}

export interface CreateVehicleInput {
  make: string
  model: string
  category: string
  price: number
  quantity: number
}

/** Quantity is deliberately absent: stock changes only via purchase/restock. */
export interface UpdateVehicleInput {
  make?: string
  model?: string
  category?: string
  price?: number
}

export interface VehicleResponse {
  vehicle: Vehicle
  message: string | null
}