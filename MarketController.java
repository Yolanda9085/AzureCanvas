package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.dto.ItemDTO;
import org.neonangellock.azurecanvas.model.*;
import org.neonangellock.azurecanvas.model.es.EsItem;
import org.neonangellock.azurecanvas.service.EsItemService;
import org.neonangellock.azurecanvas.service.IMarketService;
import org.neonangellock.azurecanvas.service.ItemFavoriteService;
import org.neonangellock.azurecanvas.service.UserService;
import org.neonangellock.azurecanvas.repository.ItemReviewRepository;
import org.neonangellock.azurecanvas.repository.ItemCommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "*")
public class MarketController {

    @Autowired
    private IMarketService marketService;

    @Autowired
    private ItemFavoriteService itemFavoriteService;

    @Autowired
    private UserService userService;

    @Autowired
    private EsItemService esItemService;

    @Autowired
    private ItemReviewRepository itemReviewRepository;

    @Autowired
    private ItemCommentRepository itemCommentRepository;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByUsername(username);
    }

    @GetMapping("/search/es")
    public ResponseEntity<List<Map<String, Object>>> searchItemsEs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {

        SearchHits<EsItem> searchHits = esItemService.searchItems(keyword, page - 1, limit);

        List<Map<String, Object>> results = searchHits.getSearchHits().stream().map(hit -> {
            EsItem item = hit.getContent();
            Map<String, Object> map = new HashMap<>();
            map.put("itemId", item.getId());
            map.put("title", item.getTitle());
            map.put("description", item.getDescription());
            map.put("price", item.getPrice());
            map.put("category", item.getCategory());
            map.put("status", item.getStatus());
            map.put("location", item.getLocation());
            map.put("views", item.getViews());
            map.put("quality", item.getQuality());
            map.put("createdAt", item.getCreatedAt());

            // Get highlights
            Map<String, List<String>> highlights = hit.getHighlightFields();
            if (highlights.containsKey("title")) {
                map.put("highlightTitle", highlights.get("title").get(0));
            }
            if (highlights.containsKey("description")) {
                map.put("highlightDescription", highlights.get("description").get(0));
            }

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/items")
    public ResponseEntity<List<ItemDTO>> getAllItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search) {
        
        Page<Item> items = marketService.findAllItems(category, sortBy, order, page, limit, search);
        return ResponseEntity.ok(items.getContent().stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<ItemDTO> getItemDetail(@PathVariable UUID itemId) {
        Item item = marketService.findItemById(itemId);
        if (item == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(convertToDTO(item));
    }

    @GetMapping("/users/me/items")
    public ResponseEntity<List<ItemDTO>> getMyItems(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        User currentUser = getCurrentUser();
        Page<Item> items = marketService.findItemsBySeller(currentUser, status, page, limit);
        return ResponseEntity.ok(items.getContent().stream().map(this::convertToDTO).collect(Collectors.toList()));
    }
    @GetMapping("/users/{sellerId}/items")
    public ResponseEntity<List<ItemDTO>> getSpecifiedSellerItems(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit, @PathVariable UUID sellerId) {

        User currentUser = userService.findById(sellerId);
        Page<Item> items = marketService.findItemsBySeller(currentUser, status, page, limit);
        return ResponseEntity.ok(items.getContent().stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    @PostMapping("/item/{itemId}/images")
    public ResponseEntity<?> createItemImage(@PathVariable UUID itemId, @RequestBody Map<String, Object> request) {
        List<String> images = (List<String>) request.get("images");
        if (images != null && !images.isEmpty()) {
            marketService.addImages(images, itemId);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/items")
    public ResponseEntity<?> createItem(@RequestBody Map<String, Object> request, @CookieValue(name = "user_id", required = false) UUID userId) {
        User user = this.userService.findById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "not logged in", "redirect", "/login/index.html?redirect=/azure_trade/trade.html"));
        }

        Item item = new Item();
        item.setTitle((String) request.get("title"));
        item.setDescription((String) request.get("description"));
        item.setPrice(new BigDecimal(request.get("price").toString()));
        item.setCategory((String) request.get("category"));
        item.setSeller(user);

        Item savedItem = marketService.saveItem(item);
        return ResponseEntity.ok(Map.of("itemId", savedItem.getItemId()));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Map<String, Object>> deleteItem(@PathVariable UUID itemId) {
        marketService.deleteItem(itemId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Item deleted successfully."));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateItem(@PathVariable UUID itemId, @RequestBody Map<String, Object> request) {
        Item item = marketService.findItemById(itemId);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.containsKey("title")) item.setTitle((String) request.get("title"));
        if (request.containsKey("description")) item.setDescription((String) request.get("description"));
        if (request.containsKey("price")) item.setPrice(new BigDecimal(request.get("price").toString()));
        if (request.containsKey("category")) item.setCategory((String) request.get("category"));
        if (request.containsKey("status")) item.setStatus((String) request.get("status"));
        if (request.containsKey("condition") && request.get("condition") != null) {
            item.setQuality(Byte.valueOf(request.get("condition").toString()));
        }
        Item saved = marketService.saveItem(item);
        return ResponseEntity.ok(Map.of("success", true, "itemId", saved.getItemId()));
    }

    @PutMapping("/items/{itemId}/off")
    public ResponseEntity<?> offShelfItem(@PathVariable UUID itemId) {
        Item item = marketService.findItemById(itemId);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        item.setStatus("off");
        marketService.saveItem(item);
        return ResponseEntity.ok(Map.of("success", true));
    }


    @PostMapping("/items/favorite")
    public ResponseEntity<?> favoriteItem(@CookieValue(name = "user_id", required = false) UUID userId, @RequestParam(defaultValue = "10") UUID itemId) {
        ItemFavorite itemFavorite = new ItemFavorite();
        itemFavorite.setUser(userService.findById(userId));
        itemFavorite.setItem(marketService.findItemById(itemId));

        itemFavoriteService.favourite(itemFavorite);
        return ResponseEntity.ok(Map.of());
    }

    @GetMapping("/items/favorites")
    public ResponseEntity<?> getFavoriteItems(@CookieValue(name = "user_id", required = false) UUID userId) {
        if(userId == null){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "message", "not logged in"));
        }
        List<Item> items = itemFavoriteService.findFavoriteItems(userId);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, String>>> getCategories() {
        List<ItemCategory> categories = marketService.findAllCategories();
        return ResponseEntity.ok(categories.stream()
            .map(c -> Map.of("categoryId", c.getCategoryId().toString(), "name", c.getName()))
            .collect(Collectors.toList()));
    }

    @PostMapping("/{sellerId}/contact")
    public ResponseEntity<Map<String, Object>> contactSeller(
            @PathVariable UUID sellerId,
            @RequestBody Map<String, Object> request) {
        // Implementation for contact logic
        return ResponseEntity.ok(Map.of(
            "messageId", UUID.randomUUID().toString(),
            "sentAt", java.time.OffsetDateTime.now().toString()
        ));
    }

    private ItemDTO convertToDTO(Item item) {

        List<String> images = marketService.findImagesByItem(item);

        return ItemDTO.builder()
                .itemId(item.getItemId())
                .title(item.getTitle())
                .description(item.getDescription())
                .price(item.getPrice())
                .sellerId(item.getSeller().getUserId())
                .sellerUsername(item.getSeller().getUsername())
                .sellerAvatarUrl(item.getSeller().getAvatarUrl())
                .createdAt(item.getCreatedAt())
                .status(item.getStatus())
                .category(item.getCategory())
                .views(item.getViews())
                .location(item.getLocation())
                .images(images) // images are in a separate table
                .build();
    }

    // ========== 信用及评价 API ==========

    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<?> getUserReviews(
            @PathVariable UUID userId,
            @RequestParam(required = false) String filter) {
        User targetUser = userService.findById(userId);
        if (targetUser == null) return ResponseEntity.notFound().build();

        List<ItemReview> reviews;
        if ("good".equals(filter)) {
            reviews = itemReviewRepository.findByTargetUserAndRatingOrderByCreatedAtDesc(targetUser, "good");
        } else if ("buyer".equals(filter)) {
            reviews = itemReviewRepository.findByTargetUserAndRoleOrderByCreatedAtDesc(targetUser, "buyer");
        } else if ("seller".equals(filter)) {
            reviews = itemReviewRepository.findByTargetUserAndRoleOrderByCreatedAtDesc(targetUser, "seller");
        } else {
            reviews = itemReviewRepository.findByTargetUserOrderByCreatedAtDesc(targetUser);
        }

        long countAll = itemReviewRepository.countByTargetUser(targetUser);
        long countGood = itemReviewRepository.countByTargetUserAndRating(targetUser, "good");
        long countBuyer = itemReviewRepository.countByTargetUserAndRole(targetUser, "buyer");
        long countSeller = itemReviewRepository.countByTargetUserAndRole(targetUser, "seller");

        List<Map<String, Object>> reviewList = reviews.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("reviewId", r.getReviewId());
            map.put("reviewerName", r.getReviewer().getUsername());
            map.put("reviewerAvatar", r.getReviewer().getAvatarUrl());
            map.put("rating", r.getRating());
            map.put("role", r.getRole());
            map.put("content", r.getContent());
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "reviews", reviewList,
                "countAll", countAll,
                "countGood", countGood,
                "countBuyer", countBuyer,
                "countSeller", countSeller
        ));
    }

    @PostMapping("/users/{userId}/reviews")
    public ResponseEntity<?> createReview(
            @PathVariable UUID userId,
            @RequestBody Map<String, Object> request,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "请先登录"));
        }
        User targetUser = userService.findById(userId);
        User reviewer = userService.findById(currentUserId);
        if (targetUser == null || reviewer == null) return ResponseEntity.notFound().build();

        ItemReview review = new ItemReview();
        review.setTargetUser(targetUser);
        review.setReviewer(reviewer);
        review.setRating((String) request.getOrDefault("rating", "good"));
        review.setRole((String) request.getOrDefault("role", "buyer"));
        review.setContent((String) request.get("content"));

        String itemIdStr = (String) request.get("itemId");
        if (itemIdStr != null) {
            Item item = marketService.findItemById(UUID.fromString(itemIdStr));
            if (item != null) review.setItem(item);
        }

        itemReviewRepository.save(review);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ========== 商品评论 API ==========

    @GetMapping("/items/{itemId}/comments")
    public ResponseEntity<?> getItemComments(@PathVariable UUID itemId) {
        List<ItemComment> comments = itemCommentRepository.findByItem_ItemIdOrderByCreatedAtDesc(itemId);
        List<Map<String, Object>> result = comments.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("commentId", c.getCommentId());
            map.put("userId", c.getUser().getUserId());
            map.put("username", c.getUser().getUsername());
            map.put("avatar", c.getUser().getAvatarUrl());
            map.put("content", c.getContent());
            map.put("parentId", c.getParentId());
            map.put("likes", c.getLikes());
            map.put("createdAt", c.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/items/{itemId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable UUID itemId,
            @RequestBody Map<String, Object> request,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "请先登录"));
        }
        Item item = marketService.findItemById(itemId);
        User user = userService.findById(currentUserId);
        if (item == null || user == null) return ResponseEntity.notFound().build();

        ItemComment comment = new ItemComment();
        comment.setItem(item);
        comment.setUser(user);
        comment.setContent((String) request.get("content"));
        String parentId = (String) request.get("parentId");
        if (parentId != null) comment.setParentId(UUID.fromString(parentId));

        itemCommentRepository.save(comment);
        return ResponseEntity.ok(Map.of(
                "commentId", comment.getCommentId(),
                "username", user.getUsername(),
                "avatar", user.getAvatarUrl(),
                "createdAt", comment.getCreatedAt()
        ));
    }

    @PostMapping("/items/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(
            @PathVariable UUID commentId,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "请先登录"));
        }
        Optional<ItemComment> opt = itemCommentRepository.findById(commentId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        ItemComment comment = opt.get();
        comment.setLikes(comment.getLikes() + 1);
        itemCommentRepository.save(comment);
        return ResponseEntity.ok(Map.of("likes", comment.getLikes()));
    }

    // ========== 想要人数 & 浏览量 API ==========

    @PostMapping("/items/{itemId}/want")
    public ResponseEntity<?> wantItem(
            @PathVariable UUID itemId,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "请先登录"));
        }
        Item item = marketService.findItemById(itemId);
        if (item == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/items/{itemId}/view")
    public ResponseEntity<?> viewItem(@PathVariable UUID itemId) {
        Item item = marketService.findItemById(itemId);
        if (item == null) return ResponseEntity.notFound().build();
        item.setViews(item.getViews() + 1);
        marketService.saveItem(item);
        return ResponseEntity.ok(Map.of("views", item.getViews()));
    }

    
    // ========== 聊天消息 API ==========

    private static final Map<String, List<Map<String, Object>>> chatMessages = new HashMap<>();
    private static final Map<String, Map<String, Object>> chatConversations = new HashMap<>();

    @PostMapping("/msg/send")
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody Map<String, Object> body) {
        String from = (String) body.get("from");
        String to = (String) body.get("to");
        String text = (String) body.getOrDefault("text", "");
        String image = (String) body.getOrDefault("image", null);
        long timestamp = System.currentTimeMillis();

        Map<String, Object> msg = new HashMap<>();
        msg.put("sender", from);
        msg.put("receiver", to);
        msg.put("text", text);
        msg.put("image", image);
        msg.put("timestamp", timestamp);

        String key = from.compareTo(to) < 0 ? from + "|" + to : to + "|" + from;
        chatMessages.computeIfAbsent(key, k -> new ArrayList<>()).add(msg);

        String lastMsg = text.isEmpty() ? (image != null ? "[Image]" : "") : text;
        chatConversations.put(from + "|" + to, Map.of("partner", to, "lastMsg", lastMsg, "lastTime", timestamp));
        chatConversations.put(to + "|" + from, Map.of("partner", from, "lastMsg", lastMsg, "lastTime", timestamp));

        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/msg/list")
    public ResponseEntity<List<Map<String, Object>>> getMsgList(@RequestParam String user) {
        List<Map<String, Object>> list = new ArrayList<>();
        chatConversations.forEach((k, v) -> {
            if (k.startsWith(user + "|")) list.add(v);
        });
        list.sort((a, b) -> Long.compare(
            (Long) b.getOrDefault("lastTime", 0L),
            (Long) a.getOrDefault("lastTime", 0L)
        ));
        return ResponseEntity.ok(list);
    }

    @GetMapping("/msg/history")
    public ResponseEntity<List<Map<String, Object>>> getMsgHistory(
            @RequestParam String user, @RequestParam String partner) {

        String key = user.compareTo(partner) < 0 ? user + "|" + partner : partner + "|" + user;
        List<Map<String, Object>> allMsgs = chatMessages.getOrDefault(key, new ArrayList<>());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> msg : allMsgs) {
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("from", msg.get("sender").equals(user) ? "me" : "them");
            formatted.put("text", msg.get("text"));
            formatted.put("image", msg.get("image"));
            formatted.put("timestamp", msg.get("timestamp"));
            result.add(formatted);
        }
        return ResponseEntity.ok(result);
    }
}