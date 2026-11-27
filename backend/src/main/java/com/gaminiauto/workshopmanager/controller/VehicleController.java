
package com.gaminiauto.workshopmanager.controller;

import com.gaminiauto.workshopmanager.entity.Vehicle;
import com.gaminiauto.workshopmanager.entity.Customer;
import com.gaminiauto.workshopmanager.repository.VehicleRepository;
import com.gaminiauto.workshopmanager.repository.CustomerRepository;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;

    public VehicleController(
            VehicleRepository vehicleRepository,
            CustomerRepository customerRepository) {

        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
    }

    // Get all vehicles
    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    // Add a new vehicle
    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(
            @RequestBody Vehicle vehicle) {

        if (vehicle.getCustomer() == null ||
            vehicle.getCustomer().getId() == null) {
            return ResponseEntity.badRequest().build();
        }

        Long customerId = vehicle.getCustomer().getId();

        return customerRepository.findById(customerId)
                .map(customer -> {
                    vehicle.setId(null);
                    vehicle.setCustomer(customer);

                    Vehicle saved = vehicleRepository.save(vehicle);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() ->
                    ResponseEntity.badRequest().build());
    }

    // Update an existing vehicle
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(
            @PathVariable Long id,
            @RequestBody Vehicle updatedVehicle) {

        return vehicleRepository.findById(id)
                .map(vehicle -> {

                    vehicle.setVehicleNumber(
                        updatedVehicle.getVehicleNumber());

                    vehicle.setBrand(
                        updatedVehicle.getBrand());

                    vehicle.setModel(
                        updatedVehicle.getModel());

                    vehicle.setVehicleType(
                        updatedVehicle.getVehicleType());

                    Vehicle saved = vehicleRepository.save(vehicle);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() ->
                    ResponseEntity.notFound().build());
    }

    // Delete a vehicle
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(
            @PathVariable Long id) {

        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
