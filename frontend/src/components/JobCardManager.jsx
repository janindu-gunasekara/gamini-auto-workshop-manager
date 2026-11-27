
import { useEffect, useState } from "react";
import "./JobCardManager.css";

const API = "/api/jobcards";

const STATUSES = [
  "Pending",
  "Diagnosing",
  "Waiting for Approval",
  "Approved",
  "In Progress",
  "Waiting for Parts",
  "Quality Check",
  "Completed",
  "Delivered",
  "Cancelled",
];

const SERVICES = [
  "Alternator Repair",
  "Starter Motor Repair",
  "Electrical Diagnostics",
  "Battery Charging",
  "Wiring Repair",
  "Hybrid Diagnostics",
  "ABS Diagnostics",
  "Headlight Restoration",
  "Accessory Installation",
  "Other",
];

const MONEY_FIELDS = [
  ["estimatedCost", "Estimated Cost"],
  ["labourCharge", "Labour Charge"],
  ["sparePartsCost", "Spare Parts Cost"],
  ["otherCharges", "Other Charges"],
  ["discount", "Discount"],
  ["advancePayment", "Advance Payment"],
  ["additionalPayment", "Additional Payment"],
];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const emptyForm = () => ({
  customerId: "",
  vehicleId: "",
  jobType: "Vehicle Repair",
  mileage: "",
  componentName: "",
  componentBrand: "",
  componentModel: "",
  serialNumber: "",
  partNumber: "",
  receivedCondition: "",
  receivedAccessories: "",
  receivedDate: today(),
  expectedCompletionDate: "",
  serviceType: "",
  customerComplaint: "",
  diagnosis: "",
  repairDetails: "",
  inspectionNotes: "",
  internalNotes: "",
  technician: "",
  priority: "Normal",
  estimatedCost: 0,
  labourCharge: 0,
  sparePartsCost: 0,
  otherCharges: 0,
  discount: 0,
  advancePayment: 0,
  additionalPayment: 0,
  paymentMethod: "",
  jobStatus: "Pending",
  warrantyDays: 0,
  warrantyConditions: "",
});

const money = (value) =>
  "Rs. " +
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      message =
        data.message ||
        data.detail ||
        data.error ||
        message;
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default function JobCardManager() {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const [jobData, customerData, vehicleData] =
        await Promise.all([
          request(API),
          request("/api/customers"),
          request("/api/vehicles"),
        ]);

      setJobs(jobData);
      setCustomers(customerData);
      setVehicles(vehicleData);

      setSelectedJob((previous) =>
        previous
          ? jobData.find((j) => j.id === previous.id) || null
          : null
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "customerId" ||
      name === "jobType"
        ? { vehicleId: "" }
        : {}),
    }));
  }

  const availableVehicles = vehicles.filter(
    (vehicle) =>
      String(vehicle.customer?.id) ===
      String(form.customerId)
  );

  const subtotal =
    Number(form.labourCharge || 0) +
    Number(form.sparePartsCost || 0) +
    Number(form.otherCharges || 0);

  const total = Math.max(
    subtotal - Number(form.discount || 0),
    0
  );

  const totalPaid =
    Number(form.advancePayment || 0) +
    Number(form.additionalPayment || 0);

  const balance = Math.max(total - totalPaid, 0);
  const overpayment = Math.max(totalPaid - total, 0);

  const outstanding = jobs
    .filter((job) => job.jobStatus !== "Cancelled")
    .reduce(
      (sum, job) => sum + Number(job.balanceDue || 0),
      0
    );

  const filteredJobs = jobs.filter((job) => {
    const keyword = search.trim().toLowerCase();

    const searchable = [
      job.jobCardNumber,
      job.customer?.name,
      job.customer?.phone,
      job.vehicle?.vehicleNumber,
      job.componentName,
      job.componentBrand,
      job.componentModel,
      job.serialNumber,
      job.partNumber,
      job.serviceType,
      job.jobStatus,
      job.technician,
      job.customerComplaint,
      job.diagnosis,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(keyword);

    let matchesFilter = true;

    if (filter === "Outstanding") {
      matchesFilter =
        Number(job.balanceDue) > 0 &&
        job.jobStatus !== "Cancelled";
    } else if (filter === "Active Warranty") {
      matchesFilter = job.warrantyActive === true;
    } else if (filter === "Overdue") {
      matchesFilter = job.isOverdue === true ||
        job.overdue === true;
    } else if (filter !== "All") {
      matchesFilter = job.jobStatus === filter;
    }

    return matchesSearch && matchesFilter;
  });

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function openNewJob() {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
    loadData();
  }

  function editJob(job) {
    const values = emptyForm();

    Object.keys(values).forEach((key) => {
      if (job[key] !== null && job[key] !== undefined) {
        values[key] = job[key];
      }
    });

    values.customerId = String(job.customer?.id || "");
    values.vehicleId = String(job.vehicle?.id || "");

    setForm(values);
    setEditingId(job.id);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function saveJob(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    if (
      form.jobType === "Vehicle Repair" &&
      !form.vehicleId
    ) {
      setError("Please select a vehicle.");
      return;
    }

    if (
      form.jobType === "Component Repair" &&
      !form.componentName.trim()
    ) {
      setError("Please enter the component name.");
      return;
    }

    if (Number(form.discount) > subtotal) {
      setError("Discount cannot exceed the subtotal.");
      return;
    }

    const {
      customerId,
      vehicleId,
      ...fields
    } = form;

    const payload = {
      ...fields,
      customer: {
        id: Number(customerId),
      },
      vehicle:
        form.jobType === "Vehicle Repair"
          ? { id: Number(vehicleId) }
          : null,
      mileage:
        form.jobType === "Vehicle Repair" &&
        form.mileage !== ""
          ? Number(form.mileage)
          : null,
      expectedCompletionDate:
        form.expectedCompletionDate || null,
      warrantyDays: Number(form.warrantyDays || 0),
    };

    MONEY_FIELDS.forEach(([name]) => {
      payload[name] = Number(form[name] || 0);
    });

    if (form.jobType === "Vehicle Repair") {
      [
        "componentName",
        "componentBrand",
        "componentModel",
        "serialNumber",
        "partNumber",
      ].forEach((name) => {
        payload[name] = "";
      });
    }

    setBusy(true);

    try {
      const saved = await request(
        editingId ? `${API}/${editingId}` : API,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      setSuccess(
        `${saved.jobCardNumber} saved successfully.`
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(job, status) {
    if (status === job.jobStatus) return;

    if (status === "Delivered") {
      const confirmed = window.confirm(
        "Deliver this job? Warranty will start and editing will be locked. Balance: " +
          money(job.balanceDue)
      );

      if (!confirmed) return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await request(
        `${API}/${job.id}/status?status=${encodeURIComponent(
          status
        )}`,
        { method: "PATCH" }
      );

      setSuccess("Job status updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelJob(job) {
    if (
      !window.confirm(
        `Cancel ${job.jobCardNumber}?`
      )
    ) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await request(`${API}/${job.id}/cancel`, {
        method: "PATCH",
      });

      setSuccess("Job cancelled successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteJob(job) {
    if (
      !window.confirm(
        `Permanently delete ${job.jobCardNumber}?`
      )
    ) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await request(`${API}/${job.id}`, {
        method: "DELETE",
      });

      setSuccess("Job deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function field(name, label, type = "text", required = false) {
    return (
      <label className="jc-field" key={name}>
        <span>{label}</span>
        <input
          type={type}
          value={form[name]}
          required={required}
          min={type === "number" ? 0 : undefined}
          step={
            type === "number"
              ? MONEY_FIELDS.some(([key]) => key === name)
                ? "0.01"
                : "1"
              : undefined
          }
          onChange={(event) =>
            updateField(name, event.target.value)
          }
        />
      </label>
    );
  }

  function area(name, label) {
    return (
      <label className="jc-field" key={name}>
        <span>{label}</span>
        <textarea
          rows={3}
          value={form[name]}
          onChange={(event) =>
            updateField(name, event.target.value)
          }
        />
      </label>
    );
  }

  function select(name, label, options, required = false) {
    return (
      <label className="jc-field" key={name}>
        <span>{label}</span>
        <select
          value={form[name]}
          required={required}
          onChange={(event) =>
            updateField(name, event.target.value)
          }
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option || "-- Select --"}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <section className="jc-manager">
      <div className="jc-heading">
        <div>
          <h2>Job Card Management</h2>
          <p>Manage workshop repairs and services</p>
        </div>

        <button
          type="button"
          className="jc-primary"
          onClick={openNewJob}
          disabled={busy || showForm}
        >
          + New Job Card
        </button>
      </div>

      <div className="jc-summary">
        <div className="jc-stat">
          <span>Total Jobs</span>
          <strong>{jobs.length}</strong>
        </div>

        <div className="jc-stat">
          <span>In Progress</span>
          <strong>
            {
              jobs.filter(
                (job) => job.jobStatus === "In Progress"
              ).length
            }
          </strong>
        </div>

        <div className="jc-stat">
          <span>Delivered</span>
          <strong>
            {
              jobs.filter(
                (job) => job.jobStatus === "Delivered"
              ).length
            }
          </strong>
        </div>

        <div className="jc-stat">
          <span>Outstanding</span>
          <strong>{money(outstanding)}</strong>
        </div>
      </div>

      {error && (
        <div className="jc-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="jc-success" role="status">
          {success}
        </div>
      )}

      {showForm && (
        <form className="jc-form" onSubmit={saveJob}>
          <h3>
            {editingId
              ? "Edit Job Card"
              : "Create New Job Card"}
          </h3>

          <fieldset disabled={busy}>
            <h4>Customer & Job Information</h4>

            <div className="jc-grid">
              {select("jobType", "Job Type", [
                "Vehicle Repair",
                "Component Repair",
              ])}

              <label className="jc-field">
                <span>Customer</span>
                <select
                  required
                  value={form.customerId}
                  onChange={(event) =>
                    updateField(
                      "customerId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    -- Select Customer --
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </label>

              {form.jobType === "Vehicle Repair" && (
                <>
                  <label className="jc-field">
                    <span>Vehicle</span>
                    <select
                      required
                      value={form.vehicleId}
                      onChange={(event) =>
                        updateField(
                          "vehicleId",
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        -- Select Vehicle --
                      </option>

                      {availableVehicles.map((vehicle) => (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                        >
                          {vehicle.vehicleNumber} -{" "}
                          {vehicle.brand} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </label>

                  {field("mileage", "Mileage (km)", "number")}
                </>
              )}

              {form.jobType === "Component Repair" && (
                <>
                  {field(
                    "componentName",
                    "Component Name",
                    "text",
                    true
                  )}
                  {field("componentBrand", "Component Brand")}
                  {field("componentModel", "Component Model")}
                  {field("serialNumber", "Serial Number")}
                  {field("partNumber", "Part Number")}
                </>
              )}

              {field(
                "receivedDate",
                "Received Date",
                "date",
                true
              )}

              {field(
                "expectedCompletionDate",
                "Expected Completion Date",
                "date"
              )}

              {field("technician", "Technician")}

              {select("priority", "Priority", [
                "Low",
                "Normal",
                "High",
                "Urgent",
              ])}

              {select(
                "serviceType",
                "Service Type",
                [
                  "",
                  ...new Set([
                    ...SERVICES,
                    ...(form.serviceType
                      ? [form.serviceType]
                      : []),
                  ]),
                ],
                true
              )}
            </div>

            <h4>Inspection & Repair Details</h4>

            <div className="jc-grid">
              {area("receivedCondition", "Received Condition")}
              {area("receivedAccessories", "Received Accessories")}
              {area("customerComplaint", "Customer Complaint")}
              {area("diagnosis", "Diagnosis")}
              {area("repairDetails", "Repair Details")}
              {area("inspectionNotes", "Inspection Notes")}
              {area("internalNotes", "Internal Notes")}
            </div>

            <h4>Charges & Payments</h4>

            <div className="jc-grid">
              {MONEY_FIELDS.map(([name, label]) =>
                field(name, label, "number")
              )}

              {select("paymentMethod", "Payment Method", [
                "",
                "Cash",
                "Card",
                "Bank Transfer",
                "Credit",
                "Other",
              ])}
            </div>

            <div className="jc-calculations">
              <p>Subtotal: {money(subtotal)}</p>
              <p>Total Amount: {money(total)}</p>
              <p>Total Paid: {money(totalPaid)}</p>
              <strong>Balance Due: {money(balance)}</strong>

              {overpayment > 0 && (
                <p>Overpayment: {money(overpayment)}</p>
              )}
            </div>

            <h4>Warranty Information</h4>

            <div className="jc-grid">
              {field("warrantyDays", "Warranty Days", "number")}
              {area("warrantyConditions", "Warranty Conditions")}
            </div>

            <p>
              Current Status: {form.jobStatus}
            </p>

            <div className="jc-actions">
              <button
                className="jc-primary"
                type="submit"
              >
                {busy
                  ? "Saving..."
                  : editingId
                  ? "Update Job Card"
                  : "Save Job Card"}
              </button>

              <button
                className="jc-secondary"
                type="button"
                onClick={resetForm}
              >
                Close Form
              </button>
            </div>
          </fieldset>
        </form>
      )}

      <div className="jc-toolbar">
        <input
          type="search"
          placeholder="Search job, customer, vehicle, component..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
        >
          {[
            "All",
            ...STATUSES,
            "Outstanding",
            "Active Warranty",
            "Overdue",
          ].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <button
          type="button"
          className="jc-secondary"
          disabled={busy || loading}
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading job cards...</p>
      ) : (
        <div className="jc-table-wrapper">
          <table className="jc-table">
            <thead>
              <tr>
                <th>Job Number</th>
                <th>Customer</th>
                <th>Vehicle / Component</th>
                <th>Service</th>
                <th>Status</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Payment</th>
                <th>Warranty</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={10}>No job cards found.</td>
                </tr>
              )}

              {filteredJobs.map((job) => {
                const locked =
                  job.jobStatus === "Delivered" ||
                  job.jobStatus === "Cancelled";

                const hasPayment =
                  Number(job.totalPaid || 0) > 0;

                return (
                  <tr key={job.id}>
                    <td>{job.jobCardNumber}</td>
                    <td>{job.customer?.name}</td>

                    <td>
                      {job.jobType === "Vehicle Repair"
                        ? job.vehicle?.vehicleNumber
                        : [
                            job.componentBrand,
                            job.componentName,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                    </td>

                    <td>{job.serviceType}</td>

                    <td>
                      <select
                        value={job.jobStatus}
                        disabled={locked || busy || showForm}
                        onChange={(event) =>
                          changeStatus(
                            job,
                            event.target.value
                          )
                        }
                      >
                        {STATUSES.filter(
                          (status) =>
                            status !== "Cancelled" ||
                            job.jobStatus === "Cancelled"
                        ).map((status) => (
                          <option key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{money(job.totalAmount)}</td>
                    <td>{money(job.balanceDue)}</td>
                    <td>{job.paymentStatus}</td>

                    <td>
                      {job.warrantyActive
                        ? "Active"
                        : "Inactive"}
                    </td>

                    <td>
                      <div className="jc-actions">
                        <button
                          type="button"
                          className="jc-secondary"
                          onClick={() => setSelectedJob(job)}
                        >
                          View
                        </button>

                        {!locked && (
                          <button
                            type="button"
                            className="jc-edit"
                            disabled={busy || showForm}
                            onClick={() => editJob(job)}
                          >
                            Edit
                          </button>
                        )}

                        {!locked && !hasPayment && (
                          <button
                            type="button"
                            className="jc-danger"
                            disabled={busy || showForm}
                            onClick={() => cancelJob(job)}
                          >
                            Cancel
                          </button>
                        )}

                        {job.jobStatus === "Pending" &&
                          !hasPayment && (
                            <button
                              type="button"
                              className="jc-danger"
                              disabled={busy || showForm}
                              onClick={() => deleteJob(job)}
                            >
                              Delete
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedJob && (
        <div className="jc-detail">
          <div className="jc-heading">
            <h3>{selectedJob.jobCardNumber} - Details</h3>

            <button
              type="button"
              className="jc-secondary"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </button>
          </div>

          <div className="jc-grid">
            {[
              ["Customer", selectedJob.customer?.name],
              ["Phone", selectedJob.customer?.phone],
              ["Job Type", selectedJob.jobType],
              ["Vehicle", selectedJob.vehicle?.vehicleNumber],
              ["Mileage", selectedJob.mileage],
              ["Component", selectedJob.componentName],
              ["Brand", selectedJob.componentBrand],
              ["Model", selectedJob.componentModel],
              ["Serial Number", selectedJob.serialNumber],
              ["Part Number", selectedJob.partNumber],
              ["Service", selectedJob.serviceType],
              ["Technician", selectedJob.technician],
              ["Priority", selectedJob.priority],
              ["Status", selectedJob.jobStatus],
              ["Received Date", selectedJob.receivedDate],
              ["Expected Completion", selectedJob.expectedCompletionDate],
              ["Completed Date", selectedJob.completedDate],
              ["Delivered Date", selectedJob.deliveredDate],
              ["Received Condition", selectedJob.receivedCondition],
              ["Accessories", selectedJob.receivedAccessories],
              ["Complaint", selectedJob.customerComplaint],
              ["Diagnosis", selectedJob.diagnosis],
              ["Repair Details", selectedJob.repairDetails],
              ["Inspection Notes", selectedJob.inspectionNotes],
              ["Internal Notes", selectedJob.internalNotes],
              ["Estimated Cost", money(selectedJob.estimatedCost)],
              ["Labour", money(selectedJob.labourCharge)],
              ["Spare Parts", money(selectedJob.sparePartsCost)],
              ["Other Charges", money(selectedJob.otherCharges)],
              ["Discount", money(selectedJob.discount)],
              ["Total Amount", money(selectedJob.totalAmount)],
              ["Advance", money(selectedJob.advancePayment)],
              ["Additional Payment", money(selectedJob.additionalPayment)],
              ["Total Paid", money(selectedJob.totalPaid)],
              ["Balance", money(selectedJob.balanceDue)],
              ["Overpayment", money(selectedJob.overpayment)],
              ["Payment Status", selectedJob.paymentStatus],
              ["Payment Method", selectedJob.paymentMethod],
              ["Warranty Days", selectedJob.warrantyDays],
              ["Warranty Start", selectedJob.warrantyStartDate],
              ["Warranty Expiry", selectedJob.warrantyExpiryDate],
              ["Warranty Conditions", selectedJob.warrantyConditions],
              [
                "Warranty Status",
                selectedJob.warrantyActive
                  ? "Active"
                  : "Inactive",
              ],
            ].map(([label, value]) => (
              <div className="jc-detail-item" key={label}>
                <strong>{label}</strong>
                <p>{value ?? "-"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
