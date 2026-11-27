
package com.gaminiauto.workshopmanager.controller;

import com.gaminiauto.workshopmanager.entity.JobCard;
import com.gaminiauto.workshopmanager.entity.Customer;
import com.gaminiauto.workshopmanager.entity.Vehicle;

import com.gaminiauto.workshopmanager.repository.JobCardRepository;
import com.gaminiauto.workshopmanager.repository.CustomerRepository;
import com.gaminiauto.workshopmanager.repository.VehicleRepository;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@RestController
@RequestMapping("/api/jobcards")
public class JobCardController {

    private final JobCardRepository jobCardRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;

    private static final List<String> JOB_TYPES = List.of(
            "Vehicle Repair",
            "Component Repair"
    );

    private static final List<String> JOB_STATUSES = List.of(
            "Pending",
            "Diagnosing",
            "Waiting for Approval",
            "Approved",
            "In Progress",
            "Waiting for Parts",
            "Quality Check",
            "Completed",
            "Delivered",
            "Cancelled"
    );

    private static final List<String> PRIORITIES = List.of(
            "Low",
            "Normal",
            "High",
            "Urgent"
    );

    public JobCardController(
            JobCardRepository jobCardRepository,
            CustomerRepository customerRepository,
            VehicleRepository vehicleRepository) {

        this.jobCardRepository = jobCardRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
    }

    // =====================================
    // GET ALL JOB CARDS
    // =====================================

    @GetMapping
    public List<JobCard> getAllJobCards() {

        return jobCardRepository.findAll()
                .stream()
                .sorted((a, b) ->
                        b.getId().compareTo(a.getId()))
                .toList();
    }

    // =====================================
    // GET SINGLE JOB CARD
    // =====================================

    @GetMapping("/{id}")
    public JobCard getJobCardById(@PathVariable Long id) {

        return findJobCard(id);
    }

    // =====================================
    // CREATE JOB CARD
    // =====================================

    @PostMapping
    public ResponseEntity<JobCard> createJobCard(
            @RequestBody JobCard jobCard) {

        jobCard.setId(null);

        applyDefaults(jobCard);

        validateJobCard(jobCard);

        assignCustomerAndVehicle(jobCard);

        updateAutomaticFields(jobCard);

        JobCard saved = jobCardRepository.save(jobCard);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    // =====================================
    // UPDATE JOB CARD
    // =====================================

    @PutMapping("/{id}")
    public JobCard updateJobCard(
            @PathVariable Long id,
            @RequestBody JobCard updated) {

        JobCard existing = findJobCard(id);

        if ("Cancelled".equals(existing.getJobStatus())) {
            throw badRequest(
                    "Cancelled jobs cannot be edited.");
        }

        if ("Delivered".equals(existing.getJobStatus())) {
            throw badRequest(
                    "Delivered jobs cannot be edited here.");
        }

        applyDefaults(updated);

        validateJobCard(updated);

        if (updated.getCustomer() == null) {
            updated.setCustomer(existing.getCustomer());
        }

        if ("Vehicle Repair".equals(updated.getJobType())
                && updated.getVehicle() == null) {
            updated.setVehicle(existing.getVehicle());
        }

        assignCustomerAndVehicle(updated);

        if (existing.getTotalPaid().signum() > 0) {

            if (!Objects.equals(
                    existing.getCustomer().getId(),
                    updated.getCustomer().getId())) {

                throw badRequest(
                        "Cannot change customer after payment.");
            }

            if (updated.getTotalPaid()
                    .compareTo(existing.getTotalPaid()) < 0) {

                throw badRequest(
                        "Payment reduction requires a refund record.");
            }
        }

        existing.setCustomer(updated.getCustomer());
        existing.setVehicle(updated.getVehicle());
        existing.setJobType(updated.getJobType());
        existing.setMileage(updated.getMileage());

        existing.setComponentName(
                updated.getComponentName());

        existing.setComponentBrand(
                updated.getComponentBrand());

        existing.setComponentModel(
                updated.getComponentModel());

        existing.setSerialNumber(
                updated.getSerialNumber());

        existing.setPartNumber(
                updated.getPartNumber());

        existing.setReceivedCondition(
                updated.getReceivedCondition());

        existing.setReceivedAccessories(
                updated.getReceivedAccessories());

        existing.setReceivedDate(
                updated.getReceivedDate());

        existing.setExpectedCompletionDate(
                updated.getExpectedCompletionDate());

        existing.setServiceType(
                updated.getServiceType());

        existing.setCustomerComplaint(
                updated.getCustomerComplaint());

        existing.setDiagnosis(
                updated.getDiagnosis());

        existing.setRepairDetails(
                updated.getRepairDetails());

        existing.setInspectionNotes(
                updated.getInspectionNotes());

        existing.setInternalNotes(
                updated.getInternalNotes());

        existing.setTechnician(
                updated.getTechnician());

        existing.setPriority(
                updated.getPriority());

        existing.setEstimatedCost(
                updated.getEstimatedCost());

        existing.setLabourCharge(
                updated.getLabourCharge());

        existing.setSparePartsCost(
                updated.getSparePartsCost());

        existing.setOtherCharges(
                updated.getOtherCharges());

        existing.setDiscount(
                updated.getDiscount());

        existing.setAdvancePayment(
                updated.getAdvancePayment());

        existing.setAdditionalPayment(
                updated.getAdditionalPayment());

        existing.setPaymentMethod(
                updated.getPaymentMethod());

        existing.setJobStatus(
                updated.getJobStatus());

        existing.setWarrantyDays(
                updated.getWarrantyDays());

        existing.setWarrantyConditions(
                updated.getWarrantyConditions());

        updateAutomaticFields(existing);

        return jobCardRepository.save(existing);
    }

    // =====================================
    // UPDATE JOB STATUS
    // =====================================

    @PatchMapping("/{id}/status")
    public JobCard updateJobStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        JobCard jobCard = findJobCard(id);

        if (!JOB_STATUSES.contains(status)) {
            throw badRequest("Invalid job status.");
        }

        if ("Cancelled".equals(jobCard.getJobStatus())
                || "Delivered".equals(jobCard.getJobStatus())) {

            throw badRequest(
                    "This job is already closed.");
        }

        jobCard.setJobStatus(status);

        updateAutomaticFields(jobCard);

        return jobCardRepository.save(jobCard);
    }

    // =====================================
    // CANCEL JOB CARD
    // =====================================

    @PatchMapping("/{id}/cancel")
    public JobCard cancelJobCard(@PathVariable Long id) {

        JobCard jobCard = findJobCard(id);

        if ("Delivered".equals(jobCard.getJobStatus())) {
            throw badRequest(
                    "Delivered jobs cannot be cancelled.");
        }

        if (jobCard.getTotalPaid().signum() > 0) {
            throw badRequest(
                    "Resolve customer payments before cancellation.");
        }

        jobCard.setJobStatus("Cancelled");

        updateAutomaticFields(jobCard);

        return jobCardRepository.save(jobCard);
    }

    // =====================================
    // DELETE JOB CARD
    // =====================================

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobCard(
            @PathVariable Long id) {

        JobCard jobCard = findJobCard(id);

        if (jobCard.getTotalPaid().signum() > 0) {
            throw badRequest(
                    "Jobs with payments cannot be deleted.");
        }

        if (!"Pending".equals(jobCard.getJobStatus())) {
            throw badRequest(
                    "Only pending jobs can be deleted.");
        }

        jobCardRepository.delete(jobCard);

        return ResponseEntity.noContent().build();
    }

    // =====================================
    // SEARCH JOB CARDS
    // =====================================

    @GetMapping("/search")
    public List<JobCard> searchJobCards(
            @RequestParam(defaultValue = "") String keyword) {

        String search = keyword.trim()
                .toLowerCase(Locale.ROOT);

        return getAllJobCards()
                .stream()
                .filter(job ->
                        contains(job.getJobCardNumber(), search)
                        || contains(job.getServiceType(), search)
                        || contains(job.getComponentName(), search)
                        || contains(job.getComponentBrand(), search)
                        || contains(job.getComponentModel(), search)
                        || contains(job.getSerialNumber(), search)
                        || contains(job.getPartNumber(), search)
                        || contains(job.getTechnician(), search)
                        || contains(job.getJobStatus(), search)
                        || contains(job.getCustomerComplaint(), search)
                        || contains(job.getDiagnosis(), search)
                        || (job.getCustomer() != null
                            && (
                                contains(
                                    job.getCustomer().getName(),
                                    search)
                                || contains(
                                    job.getCustomer().getPhone(),
                                    search)
                            ))
                        || (job.getVehicle() != null
                            && contains(
                                job.getVehicle().getVehicleNumber(),
                                search))
                )
                .toList();
    }

    // =====================================
    // CUSTOMER REPAIR HISTORY
    // =====================================

    @GetMapping("/customer/{customerId}")
    public List<JobCard> getCustomerHistory(
            @PathVariable Long customerId) {

        return getAllJobCards()
                .stream()
                .filter(job ->
                        job.getCustomer() != null
                        && Objects.equals(
                                job.getCustomer().getId(),
                                customerId))
                .toList();
    }

    // =====================================
    // VEHICLE REPAIR HISTORY
    // =====================================

    @GetMapping("/vehicle/{vehicleId}")
    public List<JobCard> getVehicleHistory(
            @PathVariable Long vehicleId) {

        return getAllJobCards()
                .stream()
                .filter(job ->
                        job.getVehicle() != null
                        && Objects.equals(
                                job.getVehicle().getId(),
                                vehicleId))
                .toList();
    }

    // =====================================
    // OVERDUE JOBS
    // =====================================

    @GetMapping("/overdue")
    public List<JobCard> getOverdueJobs() {

        return getAllJobCards()
                .stream()
                .filter(JobCard::isOverdue)
                .toList();
    }

    // =====================================
    // FILTER BY STATUS
    // =====================================

    @GetMapping("/status/{status}")
    public List<JobCard> getJobsByStatus(
            @PathVariable String status) {

        return getAllJobCards()
                .stream()
                .filter(job ->
                        status.equalsIgnoreCase(
                                job.getJobStatus()))
                .toList();
    }

    // =====================================
    // OUTSTANDING PAYMENTS
    // =====================================

    @GetMapping("/outstanding")
    public List<JobCard> getOutstandingJobs() {

        return getAllJobCards()
                .stream()
                .filter(job ->
                        job.getBalanceDue().signum() > 0
                        && !"Cancelled".equals(
                                job.getJobStatus()))
                .toList();
    }

    // =====================================
    // ACTIVE WARRANTIES
    // =====================================

    @GetMapping("/warranty/active")
    public List<JobCard> getActiveWarranties() {

        return getAllJobCards()
                .stream()
                .filter(JobCard::isWarrantyActive)
                .toList();
    }

    // =====================================
    // CUSTOMER & VEHICLE VALIDATION
    // =====================================

    private void assignCustomerAndVehicle(JobCard job) {

        if (job.getCustomer() == null
                || job.getCustomer().getId() == null) {

            throw badRequest("Customer is required.");
        }

        Customer customer = customerRepository
                .findById(job.getCustomer().getId())
                .orElseThrow(() ->
                        badRequest("Customer not found."));

        job.setCustomer(customer);

        if ("Vehicle Repair".equals(job.getJobType())) {

            if (job.getVehicle() == null
                    || job.getVehicle().getId() == null) {

                throw badRequest("Vehicle is required.");
            }

            Vehicle vehicle = vehicleRepository
                    .findById(job.getVehicle().getId())
                    .orElseThrow(() ->
                            badRequest("Vehicle not found."));

            if (!Objects.equals(
                    vehicle.getCustomer().getId(),
                    customer.getId())) {

                throw badRequest(
                        "Vehicle does not belong to this customer.");
            }

            job.setVehicle(vehicle);

        } else {

            job.setVehicle(null);
            job.setMileage(null);

            if (job.getComponentName() == null
                    || job.getComponentName().isBlank()) {

                throw badRequest(
                        "Component name is required.");
            }
        }
    }

    // =====================================
    // DEFAULT VALUES
    // =====================================

    private void applyDefaults(JobCard job) {

        if (job.getReceivedDate() == null) {
            job.setReceivedDate(LocalDate.now());
        }

        if (job.getJobType() == null) {
            job.setJobType("Vehicle Repair");
        }

        if (job.getJobStatus() == null) {
            job.setJobStatus("Pending");
        }

        if (job.getPriority() == null) {
            job.setPriority("Normal");
        }

        if (job.getWarrantyDays() == null) {
            job.setWarrantyDays(0);
        }

        job.setEstimatedCost(
                safeAmount(job.getEstimatedCost()));

        job.setLabourCharge(
                safeAmount(job.getLabourCharge()));

        job.setSparePartsCost(
                safeAmount(job.getSparePartsCost()));

        job.setOtherCharges(
                safeAmount(job.getOtherCharges()));

        job.setDiscount(
                safeAmount(job.getDiscount()));

        job.setAdvancePayment(
                safeAmount(job.getAdvancePayment()));

        job.setAdditionalPayment(
                safeAmount(job.getAdditionalPayment()));
    }

    // =====================================
    // AUTOMATIC FIELD MANAGEMENT
    // =====================================

    private void updateAutomaticFields(JobCard job) {

        LocalDate today = LocalDate.now();

        if ("Cancelled".equals(job.getJobStatus())
                && job.getTotalPaid().signum() > 0) {

            throw badRequest(
                    "Resolve payments before cancellation.");
        }

        if ("Completed".equals(job.getJobStatus())
                || "Delivered".equals(job.getJobStatus())) {

            if (job.getCompletedDate() == null) {
                job.setCompletedDate(today);
            }

        } else {

            job.setCompletedDate(null);
        }

        if ("Delivered".equals(job.getJobStatus())) {

            if (job.getDeliveredDate() == null) {
                job.setDeliveredDate(today);
            }

            if (job.getWarrantyDays() != null
                    && job.getWarrantyDays() > 0) {

                if (job.getWarrantyStartDate() == null) {
                    job.setWarrantyStartDate(
                            job.getDeliveredDate());
                }

            } else {
                job.setWarrantyStartDate(null);
            }

        } else {

            job.setDeliveredDate(null);
            job.setWarrantyStartDate(null);
        }

        if (job.getTotalPaid()
                .compareTo(job.getTotalAmount()) >= 0) {

            job.setPaymentStatus("Paid");

        } else if (job.getTotalPaid().signum() > 0) {

            job.setPaymentStatus("Partially Paid");

        } else {

            job.setPaymentStatus("Unpaid");
        }
    }

    // =====================================
    // INPUT VALIDATION
    // =====================================

    private void validateJobCard(JobCard job) {

        if (!JOB_TYPES.contains(job.getJobType())) {
            throw badRequest("Invalid job type.");
        }

        if (!JOB_STATUSES.contains(job.getJobStatus())) {
            throw badRequest("Invalid job status.");
        }

        if (!PRIORITIES.contains(job.getPriority())) {
            throw badRequest("Invalid priority.");
        }

        if (job.getServiceType() == null
                || job.getServiceType().isBlank()) {

            throw badRequest("Service type is required.");
        }

        if (job.getMileage() != null
                && job.getMileage() < 0) {

            throw badRequest("Mileage cannot be negative.");
        }

        if (job.getWarrantyDays() < 0) {

            throw badRequest(
                    "Warranty days cannot be negative.");
        }

        if (job.getReceivedDate().isAfter(LocalDate.now())) {

            throw badRequest(
                    "Received date cannot be in the future.");
        }

        if (job.getExpectedCompletionDate() != null
                && job.getExpectedCompletionDate()
                        .isBefore(job.getReceivedDate())) {

            throw badRequest(
                    "Expected completion date is invalid.");
        }

        List<BigDecimal> amounts = List.of(
                job.getEstimatedCost(),
                job.getLabourCharge(),
                job.getSparePartsCost(),
                job.getOtherCharges(),
                job.getDiscount(),
                job.getAdvancePayment(),
                job.getAdditionalPayment()
        );

        for (BigDecimal amount : amounts) {

            if (amount.signum() < 0) {
                throw badRequest(
                        "Amounts cannot be negative.");
            }

            if (amount.compareTo(
                    new BigDecimal("9999999999.99")) > 0
                    || amount.stripTrailingZeros().scale() > 2) {

                throw badRequest("Invalid monetary amount.");
            }
        }

        if (job.getDiscount()
                .compareTo(job.getSubtotal()) > 0) {

            throw badRequest(
                    "Discount cannot exceed subtotal.");
        }
    }

    // =====================================
    // HELPER METHODS
    // =====================================

    private JobCard findJobCard(Long id) {

        return jobCardRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Job card not found."));
    }

    private BigDecimal safeAmount(BigDecimal amount) {

        return amount == null
                ? BigDecimal.ZERO
                : amount;
    }

    private boolean contains(
            String value,
            String keyword) {

        return value != null
                && value.toLowerCase(Locale.ROOT)
                        .contains(keyword);
    }

    private ResponseStatusException badRequest(
            String message) {

        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message);
    }
}
