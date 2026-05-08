package org.neonangellock.azurecanvas.controller;

import org.neonangellock.azurecanvas.model.ChatMessage;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.repository.ChatMessageRepository;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:8088", "http://127.0.0.1:5500", "http://localhost:5500"}, allowCredentials = "true")
public class MessageController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserService userService;

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, Object> body,
            @CookieValue(name = "user_id", required = false) UUID currentUserId) {

        String toUsername = (String) body.get("to");
        String text = (String) body.getOrDefault("text", "");
        String image = (String) body.getOrDefault("image", null);
        String msgType = (String) body.getOrDefault("msgType", "text");

        UUID senderId = currentUserId;
        User sender = null;
        if (senderId != null) {
            sender = userService.findById(senderId);
        }
        if (sender == null) {
            String fromName = (String) body.get("from");
            if (fromName != null) {
                sender = userService.findByUsername(fromName);
            }
        }
        if (sender == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Not logged in"));
        }

        User receiver = userService.findByUsername(toUsername);
        if (receiver == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Receiver not found"));
        }

        ChatMessage msg = new ChatMessage();
        msg.setSenderId(sender.getUserId());
        msg.setReceiverId(receiver.getUserId());
        msg.setSenderName(sender.getUsername());
        msg.setReceiverName(receiver.getUsername());
        msg.setText(text);
        msg.setImage(image);
        msg.setMsgType(image != null && !image.isEmpty() ? "image" : msgType);

        chatMessageRepository.save(msg);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "messageId", msg.getMessageId().toString(),
                "timestamp", msg.getCreatedAt().toString()
        ));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @RequestParam(required = false) String user) {

        UUID userId = currentUserId;
        if (userId == null && user != null) {
            User u = userService.findByUsername(user);
            if (u != null) userId = u.getUserId();
        }
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }

        List<ChatMessage> latest = chatMessageRepository.findLatestPerConversation(userId);
        UUID finalUserId = userId;

        List<Map<String, Object>> result = latest.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            boolean isSender = m.getSenderId().equals(finalUserId);
            map.put("partnerId", isSender ? m.getReceiverId() : m.getSenderId());
            map.put("partnerName", isSender ? m.getReceiverName() : m.getSenderName());
            map.put("lastMsg", m.getImage() != null && !m.getImage().isEmpty() ? "[Image]" : m.getText());
            map.put("lastTime", m.getCreatedAt());
            map.put("msgType", m.getMsgType());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @CookieValue(name = "user_id", required = false) UUID currentUserId,
            @RequestParam(required = false) String user,
            @RequestParam String partner) {

        UUID userId = currentUserId;
        if (userId == null && user != null) {
            User u = userService.findByUsername(user);
            if (u != null) userId = u.getUserId();
        }
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }

        User partnerUser = userService.findByUsername(partner);
        if (partnerUser == null) {
            return ResponseEntity.ok(List.of());
        }

        List<ChatMessage> messages = chatMessageRepository.findConversation(userId, partnerUser.getUserId());
        UUID finalUserId = userId;

        List<Map<String, Object>> result = messages.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("from", m.getSenderId().equals(finalUserId) ? "me" : "them");
            map.put("text", m.getText());
            map.put("image", m.getImage());
            map.put("msgType", m.getMsgType());
            map.put("timestamp", m.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
