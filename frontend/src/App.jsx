
import { useState, useEffect } from 'react'
import './App.css'
import JobCardManager from "./components/JobCardManager";
import InventoryManager from "./components/InventoryManager";

const emptyCustomer = {
  name: '',
  phone: '',
  address: ''
}

const emptyVehicle = {
  customerId: '',
  vehicleNumber: '',
  brand: '',
  model: '',
  vehicleType: ''
}

function App() {
  // Customer states
  const [customer, setCustomer] = useState({ ...emptyCustomer })
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Vehicle states
  const [vehicleForm, setVehicleForm] = useState({
    ...emptyVehicle
  })
  const [vehicles, setVehicles] = useState([])
  const [vehicleLoading, setVehicleLoading] = useState(true)
  const [vehicleError, setVehicleError] = useState('')
  const [vehicleSaving, setVehicleSaving] = useState(false)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [deletingVehicleId, setDeletingVehicleId] = useState(null)

  // Load customers
  const loadCustomers = async () => {
    setLoading(true)
    setLoadError('')

    try {
      const response = await fetch('/api/customers')

      if (!response.ok) {
        throw new Error('Failed to load customers')
      }

      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Customer load error:', error)
      setLoadError('Unable to load customers.')
    } finally {
      setLoading(false)
    }
  }

  // Load vehicles
  const loadVehicles = async () => {
    setVehicleLoading(true)
    setVehicleError('')

    try {
      const response = await fetch('/api/vehicles')

      if (!response.ok) {
        throw new Error('Failed to load vehicles')
      }

      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error('Vehicle load error:', error)
      setVehicleError('Unable to load vehicles.')
    } finally {
      setVehicleLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
    loadVehicles()
  }, [])

  // Customer input changes
  const handleChange = (e) => {
    const { name, value } = e.target

    setCustomer((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  // Edit customer
  const handleEdit = (selectedCustomer) => {
    setEditingId(selectedCustomer.id)

    setCustomer({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone || '',
      address: selectedCustomer.address || ''
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Cancel customer edit
  const handleCancelEdit = () => {
    setEditingId(null)
    setCustomer({ ...emptyCustomer })
  }

  // Save customer
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!customer.name.trim()) {
      alert('Please enter customer name.')
      return
    }

    const isEditing = editingId !== null
    setSaving(true)

    try {
      const url = isEditing
        ? `/api/customers/${editingId}`
        : '/api/customers'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address: customer.address.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save customer')
      }

      setCustomer({ ...emptyCustomer })
      setEditingId(null)

      await loadCustomers()
      await loadVehicles()

      alert(
        isEditing
          ? 'Customer updated successfully!'
          : 'Customer saved successfully!'
      )
    } catch (error) {
      console.error('Customer save error:', error)
      alert('Failed to save customer.')
    } finally {
      setSaving(false)
    }
  }

  // Delete customer
  const handleDelete = async (selectedCustomer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCustomer.name}?`
    )

    if (!confirmed) return

    setDeletingId(selectedCustomer.id)

    try {
      const response = await fetch(
        `/api/customers/${selectedCustomer.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete customer')
      }

      if (editingId === selectedCustomer.id) {
        handleCancelEdit()
      }

      await loadCustomers()
      await loadVehicles()

      alert('Customer deleted successfully!')
    } catch (error) {
      console.error('Customer delete error:', error)
      alert(
        'Unable to delete customer. Check whether vehicles are linked to this customer.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // Vehicle input changes
  const handleVehicleChange = (e) => {
    const { name, value } = e.target

    setVehicleForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  // Select vehicle to edit
  const handleVehicleEdit = (selectedVehicle) => {
    setEditingVehicleId(selectedVehicle.id)
    setVehicleForm({
      customerId: String(selectedVehicle.customer?.id ?? ''),
      vehicleNumber: selectedVehicle.vehicleNumber || '',
      brand: selectedVehicle.brand || '',
      model: selectedVehicle.model || '',
      vehicleType: selectedVehicle.vehicleType || ''
    })
    document.getElementById('vehicle-registration')?.scrollIntoView({
      behavior: 'smooth', block: 'start'
    })
  }

  const handleCancelVehicleEdit = () => {
    setEditingVehicleId(null)
    setVehicleForm({ ...emptyVehicle })
  }

  // Create or update vehicle
  const handleVehicleSubmit = async (e) => {
    e.preventDefault()
    if (!vehicleForm.customerId || !vehicleForm.vehicleNumber.trim()) {
      alert('Select a customer and enter vehicle number.')
      return
    }

    const isEditing = editingVehicleId !== null
    setVehicleSaving(true)

    try {
      const response = await fetch(
        isEditing ? `/api/vehicles/${editingVehicleId}` : '/api/vehicles',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleNumber: vehicleForm.vehicleNumber.trim(),
            brand: vehicleForm.brand.trim(),
            model: vehicleForm.model.trim(),
            vehicleType: vehicleForm.vehicleType,
            customer: { id: Number(vehicleForm.customerId) }
          })
        }
      )

      if (!response.ok) throw new Error(`Vehicle save failed: ${response.status}`)
      handleCancelVehicleEdit()
      await loadVehicles()
      alert(isEditing ? 'Vehicle updated successfully!' : 'Vehicle registered successfully!')
    } catch (error) {
      console.error('Vehicle save error:', error)
      alert('Failed to save vehicle. Please try again.')
    } finally {
      setVehicleSaving(false)
    }
  }

  // Delete a vehicle after confirmation
  const handleVehicleDelete = async (selectedVehicle) => {
    const confirmed = window.confirm(
      `Delete vehicle ${selectedVehicle.vehicleNumber}? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingVehicleId(selectedVehicle.id)
    try {
      const response = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error(`Vehicle delete failed: ${response.status}`)
      if (editingVehicleId === selectedVehicle.id) handleCancelVehicleEdit()
      await loadVehicles()
      alert('Vehicle deleted successfully!')
    } catch (error) {
      console.error('Vehicle delete error:', error)
      alert('Unable to delete vehicle. It may be linked to other workshop records.')
    } finally {
      setDeletingVehicleId(null)
    }
  }

  const filteredCustomers = customers.filter((item) => {
    const search = searchTerm.toLowerCase().trim()

    return (
      (item.name || '').toLowerCase().includes(search) ||
      (item.phone || '').toLowerCase().includes(search) ||
      (item.address || '').toLowerCase().includes(search)
    )
  })

  const filteredVehicles = vehicles.filter((item) => {
    const search = vehicleSearch.toLowerCase().trim()

    return (
      (item.vehicleNumber || '').toLowerCase().includes(search) ||
      (item.brand || '').toLowerCase().includes(search) ||
      (item.model || '').toLowerCase().includes(search) ||
      (item.customer?.name || '').toLowerCase().includes(search)
    )
  })

  return (
    <div className="app">
      <header>
        <h1>GAMINI AUTO</h1>
        <p>Electricals & Motors</p>
      </header>

      <main>
        <h2>Workshop Management System</h2>
        <p>Welcome to Gamini Auto Dashboard</p>

        {/* Customer Form */}
        <section>
          <h3>
            {editingId !== null
              ? 'Edit Customer'
              : 'Add New Customer'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="customer-name">
                Customer Name
              </label>
              <input
                id="customer-name"
                type="text"
                name="name"
                value={customer.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-phone">
                Phone Number
              </label>
              <input
                id="customer-phone"
                type="tel"
                name="phone"
                value={customer.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer-address">
                Address
              </label>
              <input
                id="customer-address"
                type="text"
                name="address"
                value={customer.address}
                onChange={handleChange}
              />
            </div>

            <button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId !== null
                  ? 'Update Customer'
                  : 'Save Customer'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                style={{ marginLeft: '10px' }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        {/* Customer Records */}
        <section>
          <h3>Customer Records</h3>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, phone or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Loading customers...</p>
          ) : loadError ? (
            <p role="alert">{loadError}</p>
          ) : customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.phone}</td>
                      <td>{item.address}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEdit(item)}
                          disabled={saving || deletingId !== null}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(item)}
                          disabled={saving || deletingId !== null}
                        >
                          {deletingId === item.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Vehicle Registration */}
        <section id="vehicle-registration">
          <h3>{editingVehicleId !== null ? 'Edit Vehicle' : 'Register New Vehicle'}</h3>

          <form onSubmit={handleVehicleSubmit}>
            <div className="form-group">
              <label htmlFor="vehicle-customer">
                Select Customer
              </label>

              <select
                id="vehicle-customer"
                name="customerId"
                value={vehicleForm.customerId}
                onChange={handleVehicleChange}
                disabled={editingVehicleId !== null}
                required
              >
                <option value="">-- Select Customer --</option>

                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vehicle-number">
                Vehicle Number
              </label>

              <input
                id="vehicle-number"
                type="text"
                name="vehicleNumber"
                placeholder="WP-CAB-1234"
                value={vehicleForm.vehicleNumber}
                onChange={handleVehicleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="vehicle-brand">
                Brand
              </label>

              <input
                id="vehicle-brand"
                type="text"
                name="brand"
                placeholder="Toyota"
                value={vehicleForm.brand}
                onChange={handleVehicleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vehicle-model">
                Model
              </label>

              <input
                id="vehicle-model"
                type="text"
                name="model"
                placeholder="Prius"
                value={vehicleForm.model}
                onChange={handleVehicleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vehicle-type">
                Vehicle Type
              </label>

              <select
                id="vehicle-type"
                name="vehicleType"
                value={vehicleForm.vehicleType}
                onChange={handleVehicleChange}
              >
                <option value="">-- Select Type --</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="Lorry">Lorry</option>
                <option value="Bus">Bus</option>
                <option value="Three Wheeler">
                  Three Wheeler
                </option>
                <option value="Motorcycle">
                  Motorcycle
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={vehicleSaving || customers.length === 0}
            >
              {vehicleSaving
                ? 'Saving Vehicle...'
                : editingVehicleId !== null
                  ? 'Update Vehicle'
                  : 'Register Vehicle'}
            </button>
            {editingVehicleId !== null && (
              <button
                type="button"
                onClick={handleCancelVehicleEdit}
                disabled={vehicleSaving}
                style={{ marginLeft: '10px' }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        {/* Vehicle Records */}
        <section>
          <h3>Registered Vehicles</h3>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search vehicle number, brand, model or customer..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
            />
          </div>

          {vehicleLoading ? (
            <p>Loading vehicles...</p>
          ) : vehicleError ? (
            <p role="alert">{vehicleError}</p>
          ) : vehicles.length === 0 ? (
            <p>No vehicles registered yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle Number</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.vehicleNumber}</td>
                      <td>{item.brand}</td>
                      <td>{item.model}</td>
                      <td>{item.vehicleType}</td>
                      <td>{item.customer?.name || 'Unknown'}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleVehicleEdit(item)}
                          disabled={vehicleSaving || deletingVehicleId !== null}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleVehicleDelete(item)}
                          disabled={vehicleSaving || deletingVehicleId !== null}
                        >
                          {deletingVehicleId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
       <JobCardManager />
       <InventoryManager />
      </main>
    </div>
  )
}

export default App
