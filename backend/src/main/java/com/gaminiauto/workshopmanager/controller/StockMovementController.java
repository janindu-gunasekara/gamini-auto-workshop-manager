
package com.gaminiauto.workshopmanager.controller;

import com.gaminiauto.workshopmanager.entity.StockMovement;
import com.gaminiauto.workshopmanager.service.StockMovementService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementService service;

    public StockMovementController(
            StockMovementService service) {

        this.service = service;
    }

    @GetMapping
    public List<StockMovement> getAllMovements() {
        return service.getAllMovements();
    }

    @GetMapping("/{id}")
    public StockMovement getMovement(
            @PathVariable Long id) {

        return service.getMovement(id);
    }

    @PostMapping
    public ResponseEntity<StockMovement> createMovement(
            @RequestBody StockMovement movement) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createMovement(movement));
    }

    @GetMapping("/product/{productId}")
    public List<StockMovement> getProductMovements(
            @PathVariable Long productId) {

        return service.getProductMovements(productId);
    }

    @GetMapping("/type/{type}")
    public List<StockMovement> getMovementsByType(
            @PathVariable String type) {

        return service.getMovementsByType(type);
    }
}
