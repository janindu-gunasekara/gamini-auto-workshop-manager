
package com.gaminiauto.workshopmanager.controller;

import com.gaminiauto.workshopmanager.entity.Product;
import com.gaminiauto.workshopmanager.service.ProductService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<Product> getAllProducts() {
        return service.getAllProducts();
    }

    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return service.getProduct(id);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestBody Product product) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createProduct(product));
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Long id,
            @RequestBody Product product) {

        return service.updateProduct(id, product);
    }

    @PatchMapping("/{id}/deactivate")
    public Product deactivateProduct(@PathVariable Long id) {
        return service.deactivateProduct(id);
    }

    @PatchMapping("/{id}/activate")
    public Product activateProduct(@PathVariable Long id) {
        return service.activateProduct(id);
    }

    @GetMapping("/search")
    public List<Product> searchProducts(
            @RequestParam(defaultValue = "") String keyword) {

        return service.searchProducts(keyword);
    }

    @GetMapping("/active")
    public List<Product> getActiveProducts() {
        return service.getActiveProducts();
    }

    @GetMapping("/low-stock")
    public List<Product> getLowStockProducts() {
        return service.getLowStockProducts();
    }

    @GetMapping("/out-of-stock")
    public List<Product> getOutOfStockProducts() {
        return service.getOutOfStockProducts();
    }
}
