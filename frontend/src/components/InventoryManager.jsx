
import { useEffect, useState } from "react";
import "./InventoryManager.css";

const PRODUCT_API = "/api/products";
const MOVEMENT_API = "/api/stock-movements";

const MOVEMENT_TYPES = [
  ["STOCK_IN", "Stock In"],
  ["STOCK_OUT", "Stock Out"],
  ["CUSTOMER_RETURN", "Customer Return"],
  ["SUPPLIER_RETURN", "Supplier Return"],
  ["ADJUSTMENT_IN", "Adjustment In"],
  ["ADJUSTMENT_OUT", "Adjustment Out"],
];

const OUT_TYPES = [
  "STOCK_OUT",
  "SUPPLIER_RETURN",
  "ADJUSTMENT_OUT",
];

const PRODUCT_FIELDS = [
  ["sku", "SKU / Product Code"],
  ["productName", "Product Name"],
  ["barcode", "Barcode"],
  ["partNumber", "Part Number"],
  ["category", "Category"],
  ["brand", "Brand"],
  ["model", "Model"],
  ["productCondition", "Condition"],
  ["vehicleBrand", "Vehicle Brand"],
  ["vehicleModel", "Vehicle Model"],
  ["engineType", "Engine Type"],
  ["voltage", "Voltage"],
  ["amperage", "Amperage"],
  ["storageLocation", "Storage Location"],
  ["unit", "Unit"],
];

const NUMBER_FIELDS = [
  ["minimumStock", "Minimum Stock"],
  ["purchasePrice", "Purchase Price (Rs.)"],
  ["sellingPrice", "Selling Price (Rs.)"],
  ["wholesalePrice", "Wholesale Price (Rs.)"],
  ["warrantyDays", "Warranty Days"],
];

const TEXT_FIELDS = [
  ["specifications", "Specifications"],
  ["description", "Description"],
  ["warrantyConditions", "Warranty Conditions"],
];

const OPTIONS = {
  category: [
    "Alternators",
    "Starter Motors",
    "Batteries",
    "Carbon Brushes",
    "Bearings",
    "Solenoids",
    "Voltage Regulators",
    "Rectifiers",
    "Relays",
    "Fuses",
    "Bulbs & Lighting",
    "Wiring & Connectors",
    "Sensors",
    "Hybrid Parts",
    "Accessories",
    "Other",
  ],
  productCondition: [
    "Brand New",
    "Japan Recondition",
    "Recondition",
    "Used",
    "Repaired",
    "Other",
  ],
  voltage: ["6V", "12V", "24V", "48V", "Other"],
  unit: ["PCS", "SET", "PAIR", "METER", "BOX"],
};

function emptyProduct() {
  return {
    sku: "",
    productName: "",
    barcode: "",
    partNumber: "",
    category: "",
    brand: "",
    model: "",
    productCondition: "",
    vehicleBrand: "",
    vehicleModel: "",
    engineType: "",
    voltage: "",
    amperage: "",
    storageLocation: "",
    unit: "PCS",
    minimumStock: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    warrantyDays: 0,
    specifications: "",
    description: "",
    warrantyConditions: "",
  };
}

function emptyMovement(product = null, type = "STOCK_IN") {
  return {
    productId: product ? String(product.id) : "",
    movementType: type,
    quantity: 1,
    unitCost: product?.purchasePrice ?? 0,
    referenceNumber: "",
    reason: "",
    notes: "",
    performedBy: "",
  };
}

function money(value) {
  return Number(value || 0).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  });
}

function movementLabel(type) {
  return (
    MOVEMENT_TYPES.find(([value]) => value === type)?.[1] ||
    type
  );
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();
      message = data.message || data.detail || message;
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  return response.json();
}

export default function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [panel, setPanel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [form, setForm] = useState(emptyProduct);
  const [movementForm, setMovementForm] = useState(
    () => emptyMovement()
  );

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const [productData, movementData] = await Promise.all([
        request(PRODUCT_API),
        request(MOVEMENT_API),
      ]);

      setProducts(productData);
      setMovements(movementData);

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeProducts = products.filter(
    (product) => product.active === true
  );

  const totalUnits = activeProducts.reduce(
    (total, product) =>
      total + Number(product.availableQuantity || 0),
    0
  );

  const stockValue = products.reduce(
    (total, product) =>
      total + Number(product.stockValue || 0),
    0
  );

  const lowStockCount = activeProducts.filter(
    (product) => product.lowStock
  ).length;

  const outOfStockCount = activeProducts.filter(
    (product) => Number(product.availableQuantity) === 0
  ).length;

  const categories = [
    ...new Set(
      products.map((product) => product.category).filter(Boolean)
    ),
  ].sort();

  const selectedProduct = products.find(
    (product) => product.id === selectedId
  );

  const movementProduct = products.find(
    (product) =>
      String(product.id) === String(movementForm.productId)
  );

  const keyword = search.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [
      product.sku,
      product.productName,
      product.barcode,
      product.partNumber,
      product.category,
      product.brand,
      product.model,
      product.productCondition,
      product.vehicleBrand,
      product.vehicleModel,
      product.engineType,
      product.storageLocation,
    ].some((value) =>
      String(value || "").toLowerCase().includes(keyword)
    );

    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;

    let matchesFilter = true;

    if (filter === "ACTIVE") {
      matchesFilter = product.active === true;
    }

    if (filter === "INACTIVE") {
      matchesFilter = product.active === false;
    }

    if (filter === "LOW") {
      matchesFilter = product.active && product.lowStock;
    }

    if (filter === "OUT") {
      matchesFilter =
        product.active &&
        Number(product.availableQuantity) === 0;
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  const visibleMovements =
    panel === "product-history"
      ? movements.filter(
          (movement) => movement.product?.id === selectedId
        )
      : movements;

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function closePanel() {
    setPanel("");
    setEditingId(null);
    setSelectedId(null);
  }

  function openNewProduct() {
    clearMessages();
    setEditingId(null);
    setForm(emptyProduct());
    setPanel("product-form");
  }

  function openEditProduct(product) {
    clearMessages();

    const values = emptyProduct();

    Object.keys(values).forEach((key) => {
      values[key] = product[key] ?? values[key];
    });

    setForm(values);
    setEditingId(product.id);
    setPanel("product-form");
  }

  function openMovement(product = null, type = "STOCK_IN") {
    clearMessages();
    setMovementForm(emptyMovement(product, type));
    setPanel("movement-form");
  }

  function openDetails(product) {
    clearMessages();
    setSelectedId(product.id);
    setPanel("details");
  }

  function openHistory(product = null) {
    clearMessages();
    setSelectedId(product?.id ?? null);
    setPanel(product ? "product-history" : "history");
  }

  function updateField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function updateMovement(key, value) {
    setMovementForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    clearMessages();

    if (!form.sku.trim() || !form.productName.trim()) {
      setError("SKU and product name are required.");
      return;
    }

    const payload = { ...form };

    for (const [key, label] of NUMBER_FIELDS) {
      const value = Number(form[key]);

      if (!Number.isFinite(value) || value < 0) {
        setError(`${label} must be a valid positive or zero value.`);
        return;
      }

      if (
        ["minimumStock", "warrantyDays"].includes(key) &&
        (!Number.isInteger(value) || value > 2147483647)
      ) {
        setError(`${label} must be a valid whole number.`);
        return;
      }

      payload[key] = value;
    }

    setBusy(true);

    try {
      await request(
        editingId ? `${PRODUCT_API}/${editingId}` : PRODUCT_API,
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setSuccess(
        editingId
          ? "Product updated successfully."
          : "Product registered successfully."
      );

      closePanel();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveMovement(event) {
    event.preventDefault();
    clearMessages();

    const quantity = Number(movementForm.quantity);
    const unitCost = Number(movementForm.unitCost);

    if (!movementProduct || !movementProduct.active) {
      setError("Please select an active product.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 2147483647
    ) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setError("Invalid unit cost.");
      return;
    }

    if (!movementForm.reason.trim()) {
      setError("Please enter the movement reason.");
      return;
    }

    if (
      OUT_TYPES.includes(movementForm.movementType) &&
      quantity > Number(movementProduct.availableQuantity)
    ) {
      setError("Insufficient available stock.");
      return;
    }

    const payload = {
      product: { id: Number(movementForm.productId) },
      movementType: movementForm.movementType,
      quantity,
      unitCost,
      referenceNumber: movementForm.referenceNumber,
      reason: movementForm.reason,
      notes: movementForm.notes,
      performedBy: movementForm.performedBy,
    };

    setBusy(true);

    try {
      const result = await request(MOVEMENT_API, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(
        `Movement recorded: ${result.movementNumber}. ` +
          `New stock: ${result.newStock}`
      );

      closePanel();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeActiveStatus(product) {
    clearMessages();

    const action = product.active ? "deactivate" : "activate";

    if (
      product.active &&
      (Number(product.stockQuantity) > 0 ||
        Number(product.reservedQuantity) > 0)
    ) {
      setError("Cannot deactivate a product with remaining stock.");
      return;
    }

    if (!window.confirm(`${action} ${product.productName}?`)) {
      return;
    }

    setBusy(true);

    try {
      await request(`${PRODUCT_API}/${product.id}/${action}`, {
        method: "PATCH",
      });

      setSuccess(`Product ${action}d successfully.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function stockStatus(product) {
    if (!product.active) return "Inactive";

    if (Number(product.availableQuantity) === 0) {
      return "Out of Stock";
    }

    if (product.lowStock) return "Low Stock";

    return "In Stock";
  }

  const movementQuantity = Number(movementForm.quantity);

  const predictedStock = movementProduct
    ? Number(movementProduct.stockQuantity) +
      (OUT_TYPES.includes(movementForm.movementType)
        ? -movementQuantity
        : movementQuantity)
    : 0;

  const locked = busy || loading;

  return (
    <section className="inv-manager">
      <div className="inv-heading">
        <div>
          <h2>Inventory & Spare Parts Management</h2>
          <p>Manage products, stock and transaction history.</p>
        </div>

        <button
          className="inv-btn inv-primary"
          onClick={openNewProduct}
          disabled={locked || !!panel}
        >
          + New Product
        </button>
      </div>

      <div className="inv-summary">
        {[
          ["Total Products", products.length],
          ["Active Products", activeProducts.length],
          ["Available Units", totalUnits],
          ["Low Stock", lowStockCount],
          ["Out of Stock", outOfStockCount],
          ["Estimated Stock Value", money(stockValue)],
        ].map(([label, value]) => (
          <div className="inv-summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {error && <div className="inv-error">{error}</div>}
      {success && <div className="inv-success">{success}</div>}
      {loading && <p>Loading inventory...</p>}

      <div className="inv-actions">
        <button
          className="inv-btn inv-green"
          disabled={locked || !!panel}
          onClick={() => openMovement(null, "STOCK_IN")}
        >
          + Stock In
        </button>

        <button
          className="inv-btn inv-red"
          disabled={locked || !!panel}
          onClick={() => openMovement(null, "STOCK_OUT")}
        >
          - Stock Out
        </button>

        <button
          className="inv-btn inv-secondary"
          disabled={locked || !!panel}
          onClick={() => openHistory()}
        >
          Movement History
        </button>

        <button
          className="inv-btn inv-secondary"
          disabled={locked || !!panel}
          onClick={() => {
            clearMessages();
            loadData();
          }}
        >
          Refresh
        </button>
      </div>

      {panel === "product-form" && (
        <form className="inv-panel" onSubmit={saveProduct}>
          <h3>{editingId ? "Edit Product" : "Register New Product"}</h3>

          <fieldset>
            <legend>Product Information</legend>

            <div className="inv-form-grid">
              {PRODUCT_FIELDS.map(([key, label]) => (
                <label className="inv-field" key={key}>
                  {label}

                  {OPTIONS[key] ? (
                    <>
                      <input
                        list={`inv-options-${key}`}
                        value={form[key]}
                        onChange={(event) =>
                          updateField(key, event.target.value)
                        }
                        maxLength={255}
                        disabled={busy}
                      />

                      <datalist id={`inv-options-${key}`}>
                        {OPTIONS[key].map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <input
                      value={form[key]}
                      onChange={(event) =>
                        updateField(key, event.target.value)
                      }
                      required={["sku", "productName"].includes(key)}
                      maxLength={
                        key === "sku"
                          ? 80
                          : key === "productName"
                          ? 200
                          : 255
                      }
                      disabled={busy}
                    />
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Pricing, Stock & Warranty</legend>

            <div className="inv-form-grid">
              {NUMBER_FIELDS.map(([key, label]) => (
                <label className="inv-field" key={key}>
                  {label}

                  <input
                    type="number"
                    min="0"
                    max={
                      ["minimumStock", "warrantyDays"].includes(key)
                        ? "2147483647"
                        : "9999999999.99"
                    }
                    step={
                      ["minimumStock", "warrantyDays"].includes(key)
                        ? "1"
                        : "0.01"
                    }
                    value={form[key]}
                    onChange={(event) =>
                      updateField(key, event.target.value)
                    }
                    disabled={busy}
                    required
                  />
                </label>
              ))}
            </div>

            <div className="inv-calculation">
              Estimated Unit Margin:{" "}
              <strong>
                {money(
                  Number(form.sellingPrice) -
                    Number(form.purchasePrice)
                )}
              </strong>
            </div>
          </fieldset>

          <fieldset>
            <legend>Additional Information</legend>

            <div className="inv-form-grid">
              {TEXT_FIELDS.map(([key, label]) => (
                <label className="inv-field" key={key}>
                  {label}

                  <textarea
                    rows="3"
                    maxLength={10000}
                    value={form[key]}
                    onChange={(event) =>
                      updateField(key, event.target.value)
                    }
                    disabled={busy}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <p className="inv-note">
            Stock quantity can only be changed through stock movements.
          </p>

          <div className="inv-actions">
            <button
              type="submit"
              className="inv-btn inv-primary"
              disabled={locked}
            >
              {busy
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Save Product"}
            </button>

            <button
              type="button"
              className="inv-btn inv-secondary"
              disabled={busy}
              onClick={closePanel}
            >
              Close Form
            </button>
          </div>
        </form>
      )}

      {panel === "movement-form" && (
        <form className="inv-panel" onSubmit={saveMovement}>
          <h3>Record Stock Movement</h3>

          <div className="inv-form-grid">
            <label className="inv-field">
              Product

              <select
                value={movementForm.productId}
                required
                disabled={busy}
                onChange={(event) => {
                  const product = activeProducts.find(
                    (item) =>
                      String(item.id) === event.target.value
                  );

                  setMovementForm((previous) => ({
                    ...previous,
                    productId: event.target.value,
                    unitCost: product?.purchasePrice ?? 0,
                  }));
                }}
              >
                <option value="">Select Product</option>

                {activeProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productName} ({product.sku})
                  </option>
                ))}
              </select>
            </label>

            <label className="inv-field">
              Movement Type

              <select
                value={movementForm.movementType}
                disabled={busy}
                onChange={(event) =>
                  updateMovement("movementType", event.target.value)
                }
              >
                {MOVEMENT_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="inv-field">
              Quantity

              <input
                type="number"
                min="1"
                max="2147483647"
                step="1"
                required
                disabled={busy}
                value={movementForm.quantity}
                onChange={(event) =>
                  updateMovement("quantity", event.target.value)
                }
              />
            </label>

            <label className="inv-field">
              Unit Cost (Rs.)

              <input
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                required
                disabled={busy}
                value={movementForm.unitCost}
                onChange={(event) =>
                  updateMovement("unitCost", event.target.value)
                }
              />
            </label>

            <label className="inv-field">
              Reference Number

              <input
                maxLength={255}
                disabled={busy}
                value={movementForm.referenceNumber}
                onChange={(event) =>
                  updateMovement("referenceNumber", event.target.value)
                }
              />
            </label>

            <label className="inv-field">
              Recorded By

              <input
                maxLength={255}
                disabled={busy}
                value={movementForm.performedBy}
                onChange={(event) =>
                  updateMovement("performedBy", event.target.value)
                }
              />
            </label>

            <label className="inv-field">
              Reason

              <textarea
                required
                maxLength={10000}
                disabled={busy}
                value={movementForm.reason}
                onChange={(event) =>
                  updateMovement("reason", event.target.value)
                }
              />
            </label>

            <label className="inv-field">
              Notes

              <textarea
                maxLength={10000}
                disabled={busy}
                value={movementForm.notes}
                onChange={(event) =>
                  updateMovement("notes", event.target.value)
                }
              />
            </label>
          </div>

          {movementProduct && (
            <div className="inv-calculation">
              <p>Current Stock: {movementProduct.stockQuantity}</p>
              <p>Available Stock: {movementProduct.availableQuantity}</p>
              <p>
                Expected New Stock: <strong>{predictedStock}</strong>
              </p>
              <p>
                Estimated Movement Cost:{" "}
                {money(
                  movementQuantity *
                    (Number(movementForm.unitCost) ||
                      Number(movementProduct.purchasePrice))
                )}
              </p>
            </div>
          )}

          <p className="inv-note">
            Zero unit cost uses the product purchase price.
            Stock movements cannot be edited or deleted.
          </p>

          <div className="inv-actions">
            <button
              type="submit"
              className="inv-btn inv-primary"
              disabled={locked}
            >
              {busy ? "Recording..." : "Record Movement"}
            </button>

            <button
              type="button"
              className="inv-btn inv-secondary"
              disabled={busy}
              onClick={closePanel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="inv-toolbar">
        <input
          className="inv-search"
          placeholder="Search product, SKU, part number, vehicle..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">All Products</option>
          <option value="ACTIVE">Active Products</option>
          <option value="INACTIVE">Inactive Products</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="inv-table-wrapper">
        <table className="inv-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Stock</th>
              <th>Available</th>
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Unit Margin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.sku}</td>

                <td>
                  <strong>{product.productName}</strong>
                  <small>
                    {product.brand} {product.vehicleModel}
                  </small>
                </td>

                <td>{product.category || "-"}</td>
                <td>{product.productCondition || "-"}</td>
                <td>{product.stockQuantity}</td>
                <td>{product.availableQuantity}</td>
                <td>{money(product.purchasePrice)}</td>
                <td>{money(product.sellingPrice)}</td>
                <td>{money(product.unitProfit)}</td>

                <td>
                  <span
                    className={`inv-status ${
                      !product.active
                        ? "inv-inactive"
                        : Number(product.availableQuantity) === 0
                        ? "inv-out"
                        : product.lowStock
                        ? "inv-low"
                        : "inv-in"
                    }`}
                  >
                    {stockStatus(product)}
                  </span>
                </td>

                <td>
                  <div className="inv-row-actions">
                    <button
                      className="inv-btn inv-secondary"
                      disabled={locked || !!panel}
                      onClick={() => openDetails(product)}
                    >
                      View
                    </button>

                    {product.active && (
                      <>
                        <button
                          className="inv-btn inv-primary"
                          disabled={locked || !!panel}
                          onClick={() => openEditProduct(product)}
                        >
                          Edit
                        </button>

                        <button
                          className="inv-btn inv-green"
                          disabled={locked || !!panel}
                          onClick={() => openMovement(product)}
                        >
                          Stock
                        </button>
                      </>
                    )}

                    <button
                      className="inv-btn inv-secondary"
                      disabled={locked || !!panel}
                      onClick={() => openHistory(product)}
                    >
                      History
                    </button>

                    <button
                      className="inv-btn inv-secondary"
                      disabled={locked || !!panel}
                      onClick={() => changeActiveStatus(product)}
                    >
                      {product.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="11">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="inv-note">
        Showing {filteredProducts.length} of {products.length} products.
      </p>

      {panel === "details" && selectedProduct && (
        <div className="inv-panel">
          <h3>{selectedProduct.productName}</h3>

          <div className="inv-details-grid">
            {[
              ...PRODUCT_FIELDS,
              ...NUMBER_FIELDS,
              ...TEXT_FIELDS,
              ["stockQuantity", "Stock Quantity"],
              ["reservedQuantity", "Reserved Quantity"],
              ["availableQuantity", "Available Quantity"],
              ["stockValue", "Estimated Stock Value"],
              ["unitProfit", "Unit Margin"],
              ["createdAt", "Created At"],
              ["updatedAt", "Updated At"],
            ].map(([key, label]) => (
              <div className="inv-detail" key={key}>
                <span>{label}</span>

                <strong>
                  {[
                    "purchasePrice",
                    "sellingPrice",
                    "wholesalePrice",
                    "stockValue",
                    "unitProfit",
                  ].includes(key)
                    ? money(selectedProduct[key])
                    : selectedProduct[key] ?? "-"}
                </strong>
              </div>
            ))}
          </div>

          <button
            className="inv-btn inv-secondary"
            onClick={closePanel}
          >
            Close Details
          </button>
        </div>
      )}

      {["history", "product-history"].includes(panel) && (
        <div className="inv-panel">
          <div className="inv-heading">
            <h3>
              {panel === "product-history"
                ? `${selectedProduct?.productName || "Product"} - History`
                : "All Stock Movements"}
            </h3>

            <button
              className="inv-btn inv-secondary"
              onClick={closePanel}
            >
              Close History
            </button>
          </div>

          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Movement No.</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Previous Stock</th>
                  <th>New Stock</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Reference</th>
                  <th>Reason</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {visibleMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.movementNumber}</td>

                    <td>
                      {movement.createdAt
                        ? new Date(movement.createdAt).toLocaleString()
                        : "-"}
                    </td>

                    <td>{movement.product?.productName}</td>
                    <td>{movementLabel(movement.movementType)}</td>

                    <td
                      className={
                        OUT_TYPES.includes(movement.movementType)
                          ? "inv-qty-out"
                          : "inv-qty-in"
                      }
                    >
                      {OUT_TYPES.includes(movement.movementType)
                        ? "-"
                        : "+"}
                      {movement.quantity}
                    </td>

                    <td>{movement.previousStock}</td>
                    <td>{movement.newStock}</td>
                    <td>{money(movement.unitCost)}</td>
                    <td>{money(movement.totalCost)}</td>
                    <td>{movement.referenceNumber || "-"}</td>
                    <td>{movement.reason || "-"}</td>
                    <td>{movement.performedBy || "-"}</td>
                    <td>{movement.notes || "-"}</td>
                  </tr>
                ))}

                {visibleMovements.length === 0 && (
                  <tr>
                    <td colSpan="13">No stock movements found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
