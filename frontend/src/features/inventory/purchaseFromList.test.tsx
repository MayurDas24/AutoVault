import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import {
  apiError,
  callsTo,
  customer,
  installFetch,
  json,
  listOf,
  mockApi,
  renderApp,
  uninstallFetch,
  xc60,
} from '../../testing/api'

const purchasePath = `/api/vehicles/${xc60.id}/purchase`

describe('purchasing from the inventory list', () => {
  beforeEach(() => installFetch('customer-token'))
  afterEach(() => {
    cleanup()
    uninstallFetch()
  })

  it('purchases one unit and shows the stock returned by the server', async () => {
    let current = xc60
    mockApi(customer, {
      'GET /api/vehicles': () => json(listOf([current])),
      [`POST ${purchasePath}`]: () => {
        current = { ...xc60, quantity: 7 }
        return json({ message: 'Vehicle purchased successfully', vehicle: current })
      },
    })
    renderApp('/inventory')

    fireEvent.click(await screen.findByRole('button', { name: 'Purchase Volvo XC60' }))

    expect(await screen.findByText('Purchased Volvo XC60. 7 units remaining.')).toBeDefined()
    await waitFor(() => expect(screen.getByText('7')).toBeDefined())
    expect(callsTo('POST', purchasePath)).toHaveLength(1)
  })

  it('disables the button for a sold-out vehicle and never calls the API', async () => {
    mockApi(customer, {
      'GET /api/vehicles': () => json(listOf([{ ...xc60, quantity: 0 }])),
    })
    renderApp('/inventory')

    const button = (await screen.findByRole('button', {
      name: 'Purchase Volvo XC60',
    })) as HTMLButtonElement

    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(callsTo('POST', purchasePath)).toHaveLength(0)
  })

  it('shows the server message when a purchase is rejected', async () => {
    mockApi(customer, {
      'GET /api/vehicles': () => json(listOf([{ ...xc60, quantity: 1 }])),
      [`POST ${purchasePath}`]: () =>
        apiError(409, 'OUT_OF_STOCK', 'Insufficient inventory to complete this purchase'),
    })
    renderApp('/inventory')

    fireEvent.click(await screen.findByRole('button', { name: 'Purchase Volvo XC60' }))

    expect(
      await screen.findByText('Insufficient inventory to complete this purchase'),
    ).toBeDefined()
    expect(screen.queryByText(/^Purchased /)).toBeNull()
  })
})