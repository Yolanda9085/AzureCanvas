package org.neonangellock.azurecanvas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OllamaService {

    @Value("${ollama.api.url:http://192.168.1.100:11434}")
    private String apiUrl;

    public Flux<String> chatCompletionStream(String model, List<Map<String, Object>> messages, Map<String, Object> options) {
        log.info("正在调用 Ollama API (流式)，模型: {}，消息数量: {}", model, messages.size());

        Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();

        Schedulers.boundedElastic().schedule(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(apiUrl + "/api/chat");
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Accept", "application/json");
                connection.setDoOutput(true);
                connection.setDoInput(true);
                connection.setConnectTimeout(30000);
                connection.setReadTimeout(120000);
                connection.setChunkedStreamingMode(0);

                String requestBody = buildRequestBody(model, messages, options);
                log.debug("Ollama 请求体: {}", requestBody);

                try (var os = connection.getOutputStream()) {
                    os.write(requestBody.getBytes(StandardCharsets.UTF_8));
                }

                int responseCode = connection.getResponseCode();
                log.info("Ollama API 响应码: {}", responseCode);

                if (responseCode != 200) {
                    String errorBody = "";
                    try (var reader = new BufferedReader(new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                        errorBody = reader.lines().collect(Collectors.joining("\n"));
                    }
                    log.error("Ollama API 错误响应: {}", errorBody);
                    sink.tryEmitNext("{\"error\": \"HTTP " + responseCode + "\n" + errorBody + "\"}");
                    sink.tryEmitComplete();
                    return;
                }

                try (var reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    int lineCount = 0;
                    while ((line = reader.readLine()) != null) {
                        lineCount++;
                        log.debug("原始行 #{}: [{}]", lineCount, line);

                        if (line.trim().isEmpty()) continue;

                        try {
                            Map<String, Object> data = parseJson(line);
                            if (Boolean.TRUE.equals(data.get("done"))) {
                                log.info("🏁 收到 done 结束标记");
                                sink.tryEmitNext("[DONE]");
                                break;
                            }

                            Map<String, Object> message = (Map<String, Object>) data.get("message");
                            if (message != null && message.get("content") != null) {
                                String content = (String) message.get("content");
                                if (!content.isEmpty()) {
                                    log.info("✅ 发送数据到前端: {}...", content.length() > 80 ? content.substring(0, 80) : content);
                                    Sinks.EmitResult result = sink.tryEmitNext(content);
                                    if (result.isFailure()) {
                                        log.warn("发送数据失败: {}", result);
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("解析 JSON 失败: {}", e.getMessage());
                        }
                    }
                    log.info("✅ 读取完成，共 {} 行", lineCount);
                }

                sink.tryEmitComplete();

            } catch (Exception e) {
                log.error("❌ Ollama API call exception: {}", e.getMessage(), e);
                sink.tryEmitNext("{\"error\": \"Ollama API error: " + e.getMessage() + "\"}");
                sink.tryEmitComplete();
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });

        return sink.asFlux()
                .timeout(Duration.ofSeconds(120))
                .doOnError(error -> log.error("❌ Flux 错误: {}", error.getMessage()))
                .onErrorResume(error -> {
                    log.error("❌ 流处理错误: {}", error.getMessage());
                    return Flux.just("{\"error\": \"流处理错误: " + error.getMessage() + "\"}");
                });
    }

    private String buildRequestBody(String model, List<Map<String, Object>> messages, Map<String, Object> options) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"model\":\"").append(escapeJson(model)).append("\",");
        sb.append("\"messages\":[");

        for (int i = 0; i < messages.size(); i++) {
            Map<String, Object> msg = messages.get(i);
            if (i > 0) sb.append(",");
            sb.append("{");
            sb.append("\"role\":\"").append(escapeJson((String) msg.get("role"))).append("\",");
            sb.append("\"content\":\"").append(escapeJson((String) msg.get("content"))).append("\"");
            sb.append("}");
        }

        sb.append("],");
        sb.append("\"stream\":true");

        if (options != null && !options.isEmpty()) {
            sb.append(",");
            sb.append("\"options\":");
            sb.append("{");
            int idx = 0;
            for (Map.Entry<String, Object> entry : options.entrySet()) {
                if (idx > 0) sb.append(",");
                sb.append("\"").append(escapeJson(entry.getKey())).append("\":");
                Object value = entry.getValue();
                if (value instanceof Number) {
                    sb.append(value);
                } else {
                    sb.append("\"").append(escapeJson(value.toString())).append("\"");
                }
                idx++;
            }
            sb.append("}");
        }

        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) throws Exception {
        return new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, Map.class);
    }
}
