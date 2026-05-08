package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.Item;
import org.neonangellock.azurecanvas.model.MarketOrder;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.repository.OrderRepository;
import org.neonangellock.azurecanvas.service.IMarketService;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:8088", "http://127.0.0.1:5500", "http://localhost:5500"}, allowCredentials = "true")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private IMarketService marketService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody Map<String, Object> body,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Please log in first"));
        }

        String itemIdStr = (String) body.get("itemId");
        if (itemIdStr == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Item ID is required"));
        }

        UUID itemId = UUID.fromString(itemIdStr);
        Item item = marketService.findItemById(itemId);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Item not found"));
        }

        if ("sold".equals(item.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Item is already sold"));
        }

        User buyer = userService.findById(currentUserId);
        if (buyer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "User not found"));
        }

        if (item.getSeller().getUserId().equals(currentUserId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Cannot buy your own item"));
        }

        MarketOrder order = new MarketOrder();
        order.setBuyer(buyer);
        order.setSeller(item.getSeller());
        order.setItem(item);
        order.setPrice(item.getPrice());
        order.setStatus("pending");
        order.setShippingAddress((String) body.getOrDefault("address", ""));
        order.setPaymentMethod((String) body.getOrDefault("paymentMethod", "online"));
        order.setNote((String) body.getOrDefault("note", ""));

        orderRepository.save(order);

        item.setStatus("sold");
        marketService.saveItem(item);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "orderId", order.getOrderId().toString(),
                "message", "Order created successfully"
        ));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrder(
            @PathVariable UUID orderId,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Please log in first"));
        }

        Optional<MarketOrder> opt = orderRepository.findById(orderId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Order not found"));
        }

        MarketOrder order = opt.get();
        if (!order.getBuyer().getUserId().equals(currentUserId) &&
            !order.getSeller().getUserId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied"));
        }

        return ResponseEntity.ok(convertOrderToMap(order, currentUserId));
    }

    @GetMapping("/my/purchases")
    public ResponseEntity<List<Map<String, Object>>> getMyPurchases(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @RequestParam(required = false) String status) {

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }

        List<MarketOrder> orders;
        if (status != null && !status.isEmpty()) {
            orders = orderRepository.findByBuyer_UserIdAndStatusOrderByCreatedAtDesc(currentUserId, status);
        } else {
            orders = orderRepository.findByBuyer_UserIdOrderByCreatedAtDesc(currentUserId);
        }

        return ResponseEntity.ok(orders.stream()
                .map(o -> convertOrderToMap(o, currentUserId))
                .collect(Collectors.toList()));
    }

    @GetMapping("/my/sales")
    public ResponseEntity<List<Map<String, Object>>> getMySales(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @RequestParam(required = false) String status) {

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }

        List<MarketOrder> orders;
        if (status != null && !status.isEmpty()) {
            orders = orderRepository.findBySeller_UserIdAndStatusOrderByCreatedAtDesc(currentUserId, status);
        } else {
            orders = orderRepository.findBySeller_UserIdOrderByCreatedAtDesc(currentUserId);
        }

        return ResponseEntity.ok(orders.stream()
                .map(o -> convertOrderToMap(o, currentUserId))
                .collect(Collectors.toList()));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody Map<String, Object> body,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {

        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Please log in first"));
        }

        Optional<MarketOrder> opt = orderRepository.findById(orderId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Order not found"));
        }

        MarketOrder order = opt.get();
        String newStatus = (String) body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Status is required"));
        }

        order.setStatus(newStatus);
        orderRepository.save(order);

        return ResponseEntity.ok(Map.of("success", true, "status", newStatus));
    }

    private Map<String, Object> convertOrderToMap(MarketOrder order, UUID currentUserId) {
        Map<String, Object> map = new HashMap<>();
        map.put("orderId", order.getOrderId().toString());
        map.put("itemId", order.getItem().getItemId().toString());
        map.put("itemTitle", order.getItem().getTitle());
        map.put("price", order.getPrice());
        map.put("status", order.getStatus());
        map.put("buyerId", order.getBuyer().getUserId().toString());
        map.put("buyerName", order.getBuyer().getUsername());
        map.put("sellerId", order.getSeller().getUserId().toString());
        map.put("sellerName", order.getSeller().getUsername());
        map.put("shippingAddress", order.getShippingAddress());
        map.put("paymentMethod", order.getPaymentMethod());
        map.put("note", order.getNote());
        map.put("createdAt", order.getCreatedAt().toString());
        map.put("updatedAt", order.getUpdatedAt().toString());
        map.put("role", order.getBuyer().getUserId().equals(currentUserId) ? "buyer" : "seller");
        return map;
    }
}