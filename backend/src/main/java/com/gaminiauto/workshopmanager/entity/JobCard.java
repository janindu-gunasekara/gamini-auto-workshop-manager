
package com.gaminiauto.workshopmanager.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "job_cards")
public class JobCard {

    // =========================
    // PRIMARY KEY
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // CUSTOMER & VEHICLE
    // =========================

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = true)
    private Vehicle vehicle;

    @Column(nullable = false)
    private String jobType = "Vehicle Repair";

    private Long mileage;

    // =========================
    // COMPONENT DETAILS
    // =========================

    private String componentName;

    private String componentBrand;

    private String componentModel;

    private String serialNumber;

    private String partNumber;

    @Column(columnDefinition = "TEXT")
    private String receivedCondition;

    @Column(columnDefinition = "TEXT")
    private String receivedAccessories;

    // =========================
    // DATE MANAGEMENT
    // =========================

    @Column(nullable = false)
    private LocalDate receivedDate = LocalDate.now();

    private LocalDate expectedCompletionDate;

    private LocalDate completedDate;

    private LocalDate deliveredDate;

    // =========================
    // REPAIR DETAILS
    // =========================

    @Column(nullable = false)
    private String serviceType;

    @Column(columnDefinition = "TEXT")
    private String customerComplaint;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String repairDetails;

    @Column(columnDefinition = "TEXT")
    private String inspectionNotes;

    @Column(columnDefinition = "TEXT")
    private String internalNotes;

    private String technician;

    @Column(nullable = false)
    private String priority = "Normal";

    // =========================
    // FINANCIAL DETAILS
    // =========================

    @Column(precision = 12, scale = 2)
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal labourCharge = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal sparePartsCost = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal advancePayment = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal additionalPayment = BigDecimal.ZERO;

    private String paymentMethod;

    // =========================
    // JOB STATUS
    // =========================

    @Column(nullable = false)
    private String jobStatus = "Pending";

    @Column(nullable = false)
    private String paymentStatus = "Unpaid";

    // =========================
    // WARRANTY MANAGEMENT
    // =========================

    private Integer warrantyDays = 0;

    private LocalDate warrantyStartDate;

    @Column(columnDefinition = "TEXT")
    private String warrantyConditions;

    // =========================
    // SYSTEM RECORDS
    // =========================

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // =========================
    // CONSTRUCTOR
    // =========================

    public JobCard() {
    }

    // =========================
    // LIFECYCLE METHODS
    // =========================

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public Long getMileage() {
        return mileage;
    }

    public void setMileage(Long mileage) {
        this.mileage = mileage;
    }

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public String getComponentBrand() {
        return componentBrand;
    }

    public void setComponentBrand(String componentBrand) {
        this.componentBrand = componentBrand;
    }

    public String getComponentModel() {
        return componentModel;
    }

    public void setComponentModel(String componentModel) {
        this.componentModel = componentModel;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getPartNumber() {
        return partNumber;
    }

    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }

    public String getReceivedCondition() {
        return receivedCondition;
    }

    public void setReceivedCondition(String receivedCondition) {
        this.receivedCondition = receivedCondition;
    }

    public String getReceivedAccessories() {
        return receivedAccessories;
    }

    public void setReceivedAccessories(String receivedAccessories) {
        this.receivedAccessories = receivedAccessories;
    }

    public LocalDate getReceivedDate() {
        return receivedDate;
    }

    public void setReceivedDate(LocalDate receivedDate) {
        this.receivedDate = receivedDate;
    }

    public LocalDate getExpectedCompletionDate() {
        return expectedCompletionDate;
    }

    public void setExpectedCompletionDate(
            LocalDate expectedCompletionDate) {
        this.expectedCompletionDate = expectedCompletionDate;
    }

    public LocalDate getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDate completedDate) {
        this.completedDate = completedDate;
    }

    public LocalDate getDeliveredDate() {
        return deliveredDate;
    }

    public void setDeliveredDate(LocalDate deliveredDate) {
        this.deliveredDate = deliveredDate;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public String getCustomerComplaint() {
        return customerComplaint;
    }

    public void setCustomerComplaint(String customerComplaint) {
        this.customerComplaint = customerComplaint;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getRepairDetails() {
        return repairDetails;
    }

    public void setRepairDetails(String repairDetails) {
        this.repairDetails = repairDetails;
    }

    public String getInspectionNotes() {
        return inspectionNotes;
    }

    public void setInspectionNotes(String inspectionNotes) {
        this.inspectionNotes = inspectionNotes;
    }

    public String getInternalNotes() {
        return internalNotes;
    }

    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }

    public String getTechnician() {
        return technician;
    }

    public void setTechnician(String technician) {
        this.technician = technician;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public BigDecimal getLabourCharge() {
        return labourCharge;
    }

    public void setLabourCharge(BigDecimal labourCharge) {
        this.labourCharge = labourCharge;
    }

    public BigDecimal getSparePartsCost() {
        return sparePartsCost;
    }

    public void setSparePartsCost(BigDecimal sparePartsCost) {
        this.sparePartsCost = sparePartsCost;
    }

    public BigDecimal getOtherCharges() {
        return otherCharges;
    }

    public void setOtherCharges(BigDecimal otherCharges) {
        this.otherCharges = otherCharges;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getAdvancePayment() {
        return advancePayment;
    }

    public void setAdvancePayment(BigDecimal advancePayment) {
        this.advancePayment = advancePayment;
    }

    public BigDecimal getAdditionalPayment() {
        return additionalPayment;
    }

    public void setAdditionalPayment(
            BigDecimal additionalPayment) {
        this.additionalPayment = additionalPayment;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getJobStatus() {
        return jobStatus;
    }

    public void setJobStatus(String jobStatus) {
        this.jobStatus = jobStatus;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public Integer getWarrantyDays() {
        return warrantyDays;
    }

    public void setWarrantyDays(Integer warrantyDays) {
        this.warrantyDays = warrantyDays;
    }

    public LocalDate getWarrantyStartDate() {
        return warrantyStartDate;
    }

    public void setWarrantyStartDate(
            LocalDate warrantyStartDate) {
        this.warrantyStartDate = warrantyStartDate;
    }

    public String getWarrantyConditions() {
        return warrantyConditions;
    }

    public void setWarrantyConditions(
            String warrantyConditions) {
        this.warrantyConditions = warrantyConditions;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // =========================
    // AUTOMATIC CALCULATIONS
    // =========================

    private BigDecimal safeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    @Transient
    public BigDecimal getSubtotal() {
        return safeAmount(labourCharge)
                .add(safeAmount(sparePartsCost))
                .add(safeAmount(otherCharges));
    }

    @Transient
    public BigDecimal getTotalAmount() {
        return getSubtotal()
                .subtract(safeAmount(discount))
                .max(BigDecimal.ZERO);
    }

    @Transient
    public BigDecimal getTotalPaid() {
        return safeAmount(advancePayment)
                .add(safeAmount(additionalPayment));
    }

    @Transient
    public BigDecimal getBalanceDue() {
        return getTotalAmount()
                .subtract(getTotalPaid())
                .max(BigDecimal.ZERO);
    }

    @Transient
    public BigDecimal getOverpayment() {
        return getTotalPaid()
                .subtract(getTotalAmount())
                .max(BigDecimal.ZERO);
    }

    @Transient
    public String getJobCardNumber() {
        return id == null
                ? null
                : String.format("JOB-%04d", id);
    }

    @Transient
    public LocalDate getWarrantyExpiryDate() {

        if (warrantyStartDate == null ||
                warrantyDays == null ||
                warrantyDays <= 0) {
            return null;
        }

        return warrantyStartDate.plusDays(warrantyDays);
    }

    @Transient
    public boolean isWarrantyActive() {

        LocalDate expiryDate = getWarrantyExpiryDate();
        LocalDate today = LocalDate.now();

        return expiryDate != null &&
                !today.isBefore(warrantyStartDate) &&
                today.isBefore(expiryDate);
    }

    @Transient
    public boolean isOverdue() {

        if (expectedCompletionDate == null) {
            return false;
        }

        if ("Completed".equals(jobStatus) ||
                "Delivered".equals(jobStatus) ||
                "Cancelled".equals(jobStatus)) {
            return false;
        }

        return LocalDate.now()
                .isAfter(expectedCompletionDate);
    }
}
