import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import {
  admin,
  apiError,
  bodyOf,
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

const detailPath = `/api/vehicles/${xc60.id}`

async function openDialog() {
  return within(await screen.findByRole('dialog'))
}

describe('administration', () => {
  beforeEach(() => installFetch('admin-token'))
  afterEach(() => {
    cleanup()
    uninstallFetch()
  })

  it('lists vehicles with admin controls', async () => {
    mockApi(admin, { 'GET /api/vehicles': () => json(listOf([xc60])) })
    renderApp('/admin')

    expect(await screen.findByText('Volvo XC60')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Edit Volvo XC60' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Restock Volvo XC60' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Delete Volvo XC60' })).toBeDefined()
  })

  it('creates a vehicle with numeric stock and a decimal price', async () => {
    let created = false
    mockApi(admin, {
      'GET /api/vehicles': () => json(listOf(created ? [xc60] : [])),
      'POST /api/vehicles': () => {
        created = true
        return json({ vehicle: xc60 }, 201)
      },
    })
    renderApp('/admin')

    await screen.findByText('No vehicles in inventory yet')
    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }))

    const dialog = await openDialog()
    fireEvent.change(dialog.getByLabelText('Make'), { target: { value: 'Volvo' } })
    fireEvent.change(dialog.getByLabelText('Model'), { target: { value: 'XC60' } })
    fireEvent.change(dialog.getByLabelText('Category'), { target: { value: 'SUV' } })
    fireEvent.change(dialog.getByLabelText('Price'), { target: { value: '45999.00' } })
    fireEvent.change(dialog.getByLabelText('Starting stock'), { target: { value: '8' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Create vehicle' }))

    expect(await screen.findByText('Added Volvo XC60 to the inventory.')).toBeDefined()
    expect(bodyOf(callsTo('POST', '/api/vehicles')[0])).toEqual({
      make: 'Volvo',
      model: 'XC60',
      category: 'SUV',
      price: 45999,
      quantity: 8,
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('Volvo XC60')).toBeDefined()
  })

  it('validates the form before sending anything', async () => {
    mockApi(admin, { 'GET /api/vehicles': () => json(listOf([])) })
    renderApp('/admin')

    await screen.findByText('No vehicles in inventory yet')
    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }))

    const dialog = await openDialog()
    fireEvent.click(dialog.getByRole('button', { name: 'Create vehicle' }))

    expect(await dialog.findByText('Enter the make.')).toBeDefined()
    expect(dialog.getByText('Enter a price.')).toBeDefined()
    expect(dialog.getByText('Enter the starting stock.')).toBeDefined()
    expect(callsTo('POST', '/api/vehicles')).toHaveLength(0)
  })

  it('shows the server error and no success message when creating fails', async () => {
    mockApi(admin, {
      'GET /api/vehicles': () => json(listOf([])),
      'POST /api/vehicles': () => apiError(400, 'VALIDATION_ERROR', 'Invalid request body'),
    })
    renderApp('/admin')

    await screen.findByText('No vehicles in inventory yet')
    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }))

    const dialog = await openDialog()
    fireEvent.change(dialog.getByLabelText('Make'), { target: { value: 'Volvo' } })
    fireEvent.change(dialog.getByLabelText('Model'), { target: { value: 'XC60' } })
    fireEvent.change(dialog.getByLabelText('Category'), { target: { value: 'SUV' } })
    fireEvent.change(dialog.getByLabelText('Price'), { target: { value: '45999.00' } })
    fireEvent.change(dialog.getByLabelText('Starting stock'), { target: { value: '8' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Create vehicle' }))

    expect(await dialog.findByText('Invalid request body')).toBeDefined()
    expect(screen.queryByText(/^Added /)).toBeNull()
  })

  it('updates details without ever writing inventory quantity', async () => {
    mockApi(admin, {
      'GET /api/vehicles': () => json(listOf([xc60])),
      [`PUT ${detailPath}`]: () => json({ vehicle: { ...xc60, price: '47999.00' } }),
    })
    renderApp('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Volvo XC60' }))

    const dialog = await openDialog()
    expect(dialog.queryByLabelText('Starting stock')).toBeNull()
    fireEvent.change(dialog.getByLabelText('Price'), { target: { value: '47999.00' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Updated Volvo XC60.')).toBeDefined()

    const body = bodyOf(callsTo('PUT', detailPath)[0])
    expect(body).toEqual({ price: 47999 })
    expect(body).not.toHaveProperty('quantity')
  })

  it('restocks a vehicle with a positive quantity', async () => {
    mockApi(admin, {
      'GET /api/vehicles': () => json(listOf([xc60])),
      [`POST ${detailPath}/restock`]: () =>
        json({
          message: 'Vehicle restocked successfully',
          vehicle: { ...xc60, quantity: 13 },
        }),
    })
    renderApp('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Restock Volvo XC60' }))

    const dialog = await openDialog()
    fireEvent.change(dialog.getByLabelText('Units to add'), { target: { value: '0' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Add stock' }))

    expect(await dialog.findByText('Enter a whole number of at least 1.')).toBeDefined()
    expect(callsTo('POST', `${detailPath}/restock`)).toHaveLength(0)

    fireEvent.change(dialog.getByLabelText('Units to add'), { target: { value: '5' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Add stock' }))

    expect(
      await screen.findByText('Volvo XC60 restocked. 13 units now in stock.'),
    ).toBeDefined()
    expect(bodyOf(callsTo('POST', `${detailPath}/restock`)[0])).toEqual({ quantity: 5 })
  })

  it('requires confirmation before deleting a vehicle', async () => {
    let deleted = false
    mockApi(admin, {
      'GET /api/vehicles': () => json(listOf(deleted ? [] : [xc60])),
      [`DELETE ${detailPath}`]: () => {
        deleted = true
        return new Response(null, { status: 204 })
      },
    })
    renderApp('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Delete Volvo XC60' }))

    let dialog = await openDialog()
    expect(dialog.getByText('Delete Volvo XC60?')).toBeDefined()
    expect(callsTo('DELETE', detailPath)).toHaveLength(0)

    fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(callsTo('DELETE', detailPath)).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Delete Volvo XC60' }))
    dialog = await openDialog()
    fireEvent.click(dialog.getByRole('button', { name: 'Delete vehicle' }))

    expect(await screen.findByText('Deleted Volvo XC60.')).toBeDefined()
    expect(callsTo('DELETE', detailPath)).toHaveLength(1)
    expect(await screen.findByText('No vehicles in inventory yet')).toBeDefined()
  })
})

describe('customer view', () => {
  beforeEach(() => installFetch('customer-token'))
  afterEach(() => {
    cleanup()
    uninstallFetch()
  })

  it('shows no management controls on the inventory page', async () => {
    mockApi(customer, { 'GET /api/vehicles': () => json(listOf([xc60])) })
    renderApp('/inventory')

    await screen.findByRole('link', { name: 'Volvo XC60' })
    expect(screen.queryByRole('button', { name: /^(Edit|Restock|Delete|Add) / })).toBeNull()
  })
})