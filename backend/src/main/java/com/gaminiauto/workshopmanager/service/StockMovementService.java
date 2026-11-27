
package com.gaminiauto.workshopmanager.service;

import com.gaminiauto.workshopmanager.entity.Product;
import com.gaminiauto.workshopmanager.entity.StockMovement;

import com.gaminiauto.workshopmanager.repository.ProductRepository;
import com.gaminiauto.workshopmanager.repository.StockMovementRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class StockMovementService {

    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;

    private static final Set<String> IN_TYPES = Set.of(
        "STOCK_IN",
        "CUSTOMER_RETURN",
        "ADJUSTMENT_IN"
    );

    private static final Set<String> OUT_TYPES = Set.of(
        "STOCK_OUT",
        "SUPPLIER_RETURN",
        "ADJUSTMENT_OUT"
    );

    public StockMovementService(
            ProductRepository productRepository,
            StockMovementRepository movementRepository) {

        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
    }

    public List<StockMovement> getAllMovements() {
        return movementRepository.findAllByOrderByIdDesc();
    }

    public StockMovement getMovement(Long id) {
        return movementRepository.findById(id)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Stock movement not found"
                    )
                );
    }

    public List<StockMovement> getProductMovements(
            Long productId) {

        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
            );
        }

        return movementRepository
                .findByProduct_IdOrderByIdDesc(productId);
    }

    public List<StockMovement> getMovementsByType(
            String type) {

        return movementRepository
                .findByMovementTypeOrderByIdDesc(
                    type.trim().toUpperCase(Locale.ROOT)
                );
    }

    @Transactional
    public StockMovement createMovement(
            StockMovement request) {

        if (request.getProduct() == null
                || request.getProduct().getId() == null) {

            throw badRequest("Product ID is required");
        }

        if (request.getMovementType() == null
                || request.getMovementType().isBlank()) {

            throw badRequest("Movement type is required");
        }

        String type = request.getMovementType()
                .trim()
                .toUpperCase(Locale.ROOT);

        boolean stockIn = IN_TYPES.contains(type);
        boolean stockOut = OUT_TYPES.contains(type);

        if (!stockIn && !stockOut) {
            throw badRequest("Invalid movement type");
        }

        if (request.getQuantity() == null
                || request.getQuantity() <= 0) {

            throw badRequest(
                "Quantity must be greater than zero"
            );
        }

        if (request.getReason() == null
                || request.getReason().isBlank()) {

            throw badRequest("Movement reason is required");
        }

        validateLength(
            request.getReferenceNumber(),
            "Reference number"
        );

        validateLength(
            request.getPerformedBy(),
            "Performed by"
        );

        Product product = productRepository
                .findByIdForUpdate(
                    request.getProduct().getId()
                )
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                    )
                );

        if (!Boolean.TRUE.equals(product.getActive())) {
            throw badRequest("Product is inactive");
        }

        int quantity = request.getQuantity();
        int previousStock = product.getStockQuantity();
        int reservedStock = product.getReservedQuantity();

        int availableStock = previousStock - reservedStock;

        if (stockOut && quantity > availableStock) {
            throw badRequest("Insufficient available stock");
        }

        long calculatedStock = stockIn
                ? (long) previousStock + quantity
                : (long) previousStock - quantity;

        if (calculatedStock < reservedStock
                || calculatedStock > Integer.MAX_VALUE) {

            throw badRequest("Invalid resulting stock quantity");
        }

        int newStock = (int) calculatedStock;

        BigDecimal unitCost = request.getUnitCost();

        if (unitCost == null
                || unitCost.compareTo(BigDecimal.ZERO) == 0) {

            unitCost = product.getPurchasePrice();
        }

        validateCost(unitCost);

        StockMovement movement = new StockMovement();

        movement.setProduct(product);
        movement.setMovementType(type);
        movement.setQuantity(quantity);
        movement.setPreviousStock(previousStock);
        movement.setNewStock(newStock);
        movement.setUnitCost(unitCost);
        movement.setReferenceNumber(
            request.getReferenceNumber()
        );
        movement.setReason(request.getReason());
        movement.setNotes(request.getNotes());
        movement.setPerformedBy(request.getPerformedBy());

        product.setStockQuantity(newStock);

        productRepository.save(product);

        return movementRepository.save(movement);
    }

    private void validateCost(BigDecimal cost) {

        if (cost == null
                || cost.compareTo(BigDecimal.ZERO) < 0) {

            throw badRequest("Invalid unit cost");
        }

        if (cost.compareTo(
                new BigDecimal("9999999999.99")) > 0) {

            throw badRequest("Unit cost exceeds maximum");
        }

        if (cost.stripTrailingZeros().scale() > 2) {
            throw badRequest("Invalid cost decimal places");
        }
    }

    private void validateLength(
            String value, String field) {

        if (value != null && value.length() > 255) {
            throw badRequest(field + " is too long");
        }
    }

    private ResponseStatusException badRequest(
            String message) {

        return new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            message
        );
    }
}
