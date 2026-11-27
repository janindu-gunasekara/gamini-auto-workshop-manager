
package com.gaminiauto.workshopmanager.service;

import com.gaminiauto.workshopmanager.entity.Product;
import com.gaminiauto.workshopmanager.repository.ProductRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public List<Product> getAllProducts() {
        return repository.findAll(
            org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC,
                "id"
            )
        );
    }

    public Product getProduct(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                    )
                );
    }

    @Transactional
    public Product createProduct(Product product) {

        product.setId(null);
        applyDefaults(product);
        validate(product);

        if (repository.existsBySkuIgnoreCase(product.getSku())) {
            throw badRequest("SKU already exists");
        }

        if (product.getStockQuantity() != 0
                || product.getReservedQuantity() != 0) {
            throw badRequest(
                "New products must start with zero stock"
            );
        }

        product.setActive(true);

        return repository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product updated) {

        Product existing = repository.findByIdForUpdate(id)
        .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
        ));

        if (!Boolean.TRUE.equals(existing.getActive())) {
            throw badRequest("Inactive product cannot be edited");
        }

        updated.setStockQuantity(existing.getStockQuantity());
        updated.setReservedQuantity(existing.getReservedQuantity());

        applyDefaults(updated);
        validate(updated);

        if (repository.existsBySkuIgnoreCaseAndIdNot(
                updated.getSku(), id)) {
            throw badRequest("SKU already exists");
        }

        existing.setSku(updated.getSku());
        existing.setProductName(updated.getProductName());
        existing.setBarcode(updated.getBarcode());
        existing.setPartNumber(updated.getPartNumber());
        existing.setCategory(updated.getCategory());
        existing.setBrand(updated.getBrand());
        existing.setModel(updated.getModel());
        existing.setProductCondition(updated.getProductCondition());

        existing.setVehicleBrand(updated.getVehicleBrand());
        existing.setVehicleModel(updated.getVehicleModel());
        existing.setEngineType(updated.getEngineType());

        existing.setVoltage(updated.getVoltage());
        existing.setAmperage(updated.getAmperage());
        existing.setSpecifications(updated.getSpecifications());
        existing.setDescription(updated.getDescription());

        existing.setStorageLocation(updated.getStorageLocation());
        existing.setUnit(updated.getUnit());
        existing.setMinimumStock(updated.getMinimumStock());

        existing.setPurchasePrice(updated.getPurchasePrice());
        existing.setSellingPrice(updated.getSellingPrice());
        existing.setWholesalePrice(updated.getWholesalePrice());

        existing.setWarrantyDays(updated.getWarrantyDays());
        existing.setWarrantyConditions(updated.getWarrantyConditions());

        return repository.save(existing);
    }

    @Transactional
    public Product deactivateProduct(Long id) {

        Product product = repository.findByIdForUpdate(id)
        .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
        ));

        if (product.getStockQuantity() > 0
                || product.getReservedQuantity() > 0) {
            throw badRequest(
                "Cannot deactivate a product with remaining stock"
            );
        }

        product.setActive(false);

        return repository.save(product);
    }

    @Transactional
    public Product activateProduct(Long id) {

        Product product = repository.findByIdForUpdate(id)
        .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
        ));

        product.setActive(true);

        return repository.save(product);
    }

    public List<Product> searchProducts(String keyword) {

        String search = Objects.toString(keyword, "")
                .trim()
                .toLowerCase(Locale.ROOT);

        return getAllProducts().stream()
                .filter(product ->
                    contains(product.getSku(), search)
                    || contains(product.getProductName(), search)
                    || contains(product.getBarcode(), search)
                    || contains(product.getPartNumber(), search)
                    || contains(product.getCategory(), search)
                    || contains(product.getBrand(), search)
                    || contains(product.getModel(), search)
                    || contains(product.getVehicleBrand(), search)
                    || contains(product.getVehicleModel(), search)
                    || contains(product.getEngineType(), search)
                    || contains(product.getProductCondition(), search)
                )
                .toList();
    }

    public List<Product> getActiveProducts() {
        return getAllProducts().stream()
                .filter(product ->
                    Boolean.TRUE.equals(product.getActive())
                )
                .toList();
    }

    public List<Product> getLowStockProducts() {
        return getActiveProducts().stream()
                .filter(Product::isLowStock)
                .toList();
    }

    public List<Product> getOutOfStockProducts() {
        return getActiveProducts().stream()
                .filter(product ->
                    product.getAvailableQuantity() == 0
                )
                .toList();
    }

    private boolean contains(String value, String search) {
        return value != null
                && value.toLowerCase(Locale.ROOT)
                        .contains(search);
    }

    private void applyDefaults(Product product) {

        if (product.getSku() != null) {
            product.setSku(
                product.getSku().trim()
                    .toUpperCase(Locale.ROOT)
            );
        }

        if (product.getProductName() != null) {
            product.setProductName(
                product.getProductName().trim()
            );
        }

        if (product.getUnit() == null
                || product.getUnit().isBlank()) {
            product.setUnit("PCS");
        }

        if (product.getStockQuantity() == null) {
            product.setStockQuantity(0);
        }

        if (product.getReservedQuantity() == null) {
            product.setReservedQuantity(0);
        }

        if (product.getMinimumStock() == null) {
            product.setMinimumStock(0);
        }

        if (product.getPurchasePrice() == null) {
            product.setPurchasePrice(BigDecimal.ZERO);
        }

        if (product.getSellingPrice() == null) {
            product.setSellingPrice(BigDecimal.ZERO);
        }

        if (product.getWholesalePrice() == null) {
            product.setWholesalePrice(BigDecimal.ZERO);
        }

        if (product.getWarrantyDays() == null) {
            product.setWarrantyDays(0);
        }
    }

    private void validate(Product product) {

        if (product.getSku() == null
                || product.getSku().isBlank()) {
            throw badRequest("SKU is required");
        }

        if (product.getSku().length() > 80) {
            throw badRequest("SKU is too long");
        }

        if (product.getProductName() == null
                || product.getProductName().isBlank()) {
            throw badRequest("Product name is required");
        }

        if (product.getProductName().length() > 200) {
            throw badRequest("Product name is too long");
        }

        if (product.getStockQuantity() < 0
                || product.getReservedQuantity() < 0
                || product.getMinimumStock() < 0) {
            throw badRequest("Quantity cannot be negative");
        }

        if (product.getReservedQuantity()
                > product.getStockQuantity()) {
            throw badRequest("Reserved quantity exceeds stock");
        }

        if (product.getWarrantyDays() < 0) {
            throw badRequest("Invalid warranty period");
        }

        validatePrice(product.getPurchasePrice(), "Purchase price");
        validatePrice(product.getSellingPrice(), "Selling price");
        validatePrice(product.getWholesalePrice(), "Wholesale price");
    }

    private void validatePrice(BigDecimal value, String field) {

        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw badRequest(field + " cannot be negative");
        }

        if (value.compareTo(
                new BigDecimal("9999999999.99")) > 0) {
            throw badRequest(field + " exceeds maximum value");
        }

        if (value.stripTrailingZeros().scale() > 2) {
            throw badRequest(field + " has too many decimal places");
        }
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
            HttpStatus.BAD_REQUEST, message
        );
    }
}
