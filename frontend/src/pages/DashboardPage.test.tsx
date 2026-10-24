import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import {
  admin,
  apiError,
  customer,
  installFetch,
  json,
  listOf,
  mockApi,
  renderApp,
  uninstallFetch,
  xc60,
} from '../testing/api'
import type { TestVehicle } from '../testing/api'

const audi: TestVehicle = {
  ...xc60,
  id: '33333333-3333-4333-8333-333333333333',
  make: 'Audi',
  model: 'A4',
  category: 'Sedan',
  price: '20000.00',
  quantity: 3,
  createdAt: '2026-02-10T09:00:00.000Z',
}

const ford: TestVehicle = {
  ...xc60,
  id: '44444444-4444-4444-8444-444444444444',
  make: 'Ford',
  model: 'Focus',
  category: 'Hatchback',
  price: '10000.00',
  quantity: 0,
  createdAt: '2026-03-10T09:00:00.000Z',
}

/** The dashboard only renders once the saved session has been verified. */
async function waitForDashboard() {
  await screen.findByRole('heading', { level: 1, name: 'Inventory Overview' })
}

function stat(label: string) {
  return within(screen.getByRole('group', { name: label }))
}

describe('dashboard', () => {
  beforeEach(() => installFetch())
  afterEach(() => {
    cleanup()
    uninstallFetch()
  })

  it('computes the summary from the API data', async () => {
    mockApi(customer, { 'GET /api/vehicles': () => json(listOf([xc60, audi, ford])) })
    renderApp('/')

    await waitForDashboard()
    expect(await stat('Total Vehicles').findByText('3')).toBeDefined()
    expect(stat('Total Vehicles').getByText('11 units in stock')).toBeDefined()
    // 8 × 45,999.00 + 3 × 20,000.00 + 0 × 10,000.00
    expect(stat('Inventory Value').getByText('$427,992.00')).toBeDefined()
    expect(stat('Low Stock').getByText('1')).toBeDefined()
    expect(stat('Out of Stock').getByText('1')).toBeDefined()
  })

  it('lists the most recently added vehicles first', async () => {
    mockApi(customer, { 'GET /api/vehicles': () => json(listOf([xc60, audi, ford])) })
    renderApp('/')

    await screen.findByRole('link', { name: 'Ford Focus' })
    const names = screen
      .getAllByRole('link', { name: /^(Volvo|Audi|Ford) / })
      .map((link) => link.textContent)

    expect(names).toEqual(['Ford Focus', 'Audi A4', 'Volvo XC60'])
  })

  it('shows an empty state with zeroed figures when there are no vehicles', async () => {
    mockApi(customer, { 'GET /api/vehicles': () => json(listOf([])) })
    renderApp('/')

    expect(await screen.findByText('No vehicles in inventory yet')).toBeDefined()
    expect(stat('Total Vehicles').getByText('0')).toBeDefined()
    expect(stat('Inventory Value').getByText('$0.00')).toBeDefined()
  })

  it('shows an error with a retry action and recovers', async () => {
    let attempts = 0
    mockApi(customer, {
      'GET /api/vehicles': () => {
        attempts += 1
        return attempts === 1
          ? apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
          : json(listOf([xc60]))
      },
    })
    renderApp('/')

    expect(await screen.findByText("We couldn't load the inventory summary")).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await stat('Total Vehicles').findByText('1')).toBeDefined()
  })

  it('offers the management shortcut to administrators only', async () => {
    mockApi(admin, { 'GET /api/vehicles': () => json(listOf([xc60])) })
    renderApp('/')

    expect(await screen.findByRole('link', { name: /Manage inventory/ })).toBeDefined()
    cleanup()

    mockApi(customer, { 'GET /api/vehicles': () => json(listOf([xc60])) })
    renderApp('/')

    await waitForDashboard()
    expect(screen.queryByRole('link', { name: /Manage inventory/ })).toBeNull()
  })
})