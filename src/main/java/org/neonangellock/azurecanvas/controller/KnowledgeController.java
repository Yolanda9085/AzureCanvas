package org.neonangellock.azurecanvas.controller;

import lombok.extern.slf4j.Slf4j;
import org.neonangellock.azurecanvas.service.DeepSeekService;
import org.neonangellock.azurecanvas.service.KnowledgeService;
import org.neonangellock.azurecanvas.service.OllamaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    @Autowired
    private KnowledgeService knowledgeService;

    @Autowired
    private DeepSeekService deepSeekService;

    @Autowired
    private OllamaService ollamaService;

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchKnowledge(
            @RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "3") int maxResults) {
        try {
            log.info("收到知识库搜索请求: keyword={}, maxResults={}", keyword, maxResults);

            String context = knowledgeService.getKnowledgeContext(keyword, maxResults);

            Map<String, Object> response = Map.of(
                    "success", true,
                    "keyword", keyword,
                    "hasContext", !context.isEmpty(),
                    "context", context.isEmpty() ? null : context
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("知识库搜索接口异常: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "知识库搜索失败: " + e.getMessage()
            ));
        }
    }

    @PostMapping(value = "/deepseek/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> deepseekChat(@RequestBody Map<String, Object> request) {
        log.info("📥 收到 DeepSeek 流式聊天请求");

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> messages = (List<Map<String, String>>) request.get("messages");

            if (messages == null || messages.isEmpty()) {
                log.warn("❌ 消息列表为空");
                return Flux.just(
                        ServerSentEvent.<String>builder()
                                .data("{\"error\": \"消息列表不能为空\"}")
                                .build()
                );
            }

            log.info("🚀 开始流式转发 DeepSeek API 响应，消息数量: {}", messages.size());

            return deepSeekService.chatCompletionStream(messages)
                    .map(data -> {
                        if (!data.equals("[DONE]")) {
                            log.info("📤 转发SSE事件: {}...", data.length() > 50 ? data.substring(0, 50) : data);
                        } else {
                            log.info("🏁 转发结束标记");
                        }
                        return ServerSentEvent.<String>builder()
                                .data(data)
                                .build();
                    })
                    .doOnComplete(() -> log.info("✅ Controller 流式响应完成"));
        } catch (Exception e) {
            log.error("❌ DeepSeek 聊天接口异常: {}", e.getMessage(), e);
            return Flux.just(
                    ServerSentEvent.<String>builder()
                            .data("{\"error\": \"DeepSeek API 调用失败: " + e.getMessage() + "\"}")
                            .build()
            );
        }
    }

    @PostMapping(value = "/ollama/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> ollamaChat(@RequestBody Map<String, Object> request) {
        log.info("📥 收到 Ollama 流式聊天请求");

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> messages = (List<Map<String, Object>>) request.get("messages");
            String model = (String) request.get("model");
            @SuppressWarnings("unchecked")
            Map<String, Object> options = (Map<String, Object>) request.get("options");

            if (messages == null || messages.isEmpty()) {
                log.warn("❌ 消息列表为空");
                return Flux.just(
                        ServerSentEvent.<String>builder()
                                .data("{\"error\": \"消息列表不能为空\"}")
                                .build()
                );
            }

            if (model == null || model.isEmpty()) {
                model = "qwen:4b";
            }

            log.info("🚀 开始流式转发 Ollama API 响应，模型: {}，消息数量: {}", model, messages.size());

            return ollamaService.chatCompletionStream(model, messages, options)
                    .map(data -> {
                        if (!data.equals("[DONE]")) {
                            log.info("📤 转发SSE事件: {}...", data.length() > 50 ? data.substring(0, 50) : data);
                        } else {
                            log.info("🏁 转发结束标记");
                        }
                        return ServerSentEvent.<String>builder()
                                .data(data)
                                .build();
                    })
                    .doOnComplete(() -> log.info("✅ Controller 流式响应完成"));
        } catch (Exception e) {
            log.error("❌ Ollama 聊天接口异常: {}", e.getMessage(), e);
            return Flux.just(
                    ServerSentEvent.<String>builder()
                            .data("{\"error\": \"Ollama API 调用失败: " + e.getMessage() + "\"}")
                            .build()
            );
        }
    }
}
