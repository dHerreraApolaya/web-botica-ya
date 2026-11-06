package com.boticaya.api_botica_ya;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {
    private final JdbcTemplate jdbc;

    public ProductController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/products")
    public List<Map<String, Object>> getProducts() {
        return jdbc.queryForList("""
            SELECT id, sku, name, category, brand, presentation,
                   price_in_cents AS "priceInCents",
                   available_quantity AS "availableQuantity",
                   available_quantity > 0 AS "inStock",
                   requires_prescription AS "requiresPrescription",
                   is_featured AS "isFeatured"
            FROM public.products
            ORDER BY id
            """);
    }
}