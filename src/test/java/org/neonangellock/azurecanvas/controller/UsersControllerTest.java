package org.neonangellock.azurecanvas.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.neonangellock.azurecanvas.dto.UserDTO;
import org.neonangellock.azurecanvas.exception.DuplicateUserFieldException;
import org.neonangellock.azurecanvas.model.User;
import org.neonangellock.azurecanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.servlet.http.Cookie;
import java.util.*;
import java.util.concurrent.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class UsersControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setUserId(userId);
        user.setUsername("testuser");
        user.setEmail("test@example.com");

        when(userService.findById(userId)).thenReturn(user);
        when(userService.findByIdWithInterests(userId)).thenReturn(user);
        when(userService.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);
    }

    @Test
    void testAvatarUpdateWithUuid() throws Exception {
        String avatarUuid = UUID.randomUUID().toString();
        Map<String, String> updates = Map.of("avatar", avatarUuid);

        mockMvc.perform(put("/api/users/me")
                .cookie(new Cookie("user_id", userId.toString()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar").value(avatarUuid));

        verify(userService).save(argThat(u -> avatarUuid.equals(u.getAvatarUrl())));
    }

    @Test
    void testInterestsDeduplicationAndOrdering() throws Exception {
        Map<String, String> updates = Map.of("interests", "reading, travel, reading, music");

        mockMvc.perform(put("/api/users/me")
                .cookie(new Cookie("user_id", userId.toString()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk());

        // Verify split, trim, distinct
        verify(userService).updateUserInterests(eq(user), argThat(list -> 
            list.size() == 3 && list.containsAll(List.of("reading", "travel", "music"))
        ));
    }

    @Test
    void testUniquenessCheck() throws Exception {
        String duplicateUsername = "existingUser";
        when(userService.existsByUsernameExcludingUser(duplicateUsername, userId)).thenReturn(true);

        Map<String, String> updates = Map.of("username", duplicateUsername);

        mockMvc.perform(put("/api/users/me")
                .cookie(new Cookie("user_id", userId.toString()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("DUPLICATE_FIELD"))
                .andExpect(jsonPath("$.field").value("username"));
    }

    @Test
    void testConcurrencyUniqueness() throws Exception {
        // This is a simplified concurrency test using MockMvc
        // In a real scenario, this would be an integration test with a real DB
        String username = "newUsername";
        
        // Reset mock to count calls
        reset(userService);
        when(userService.findById(userId)).thenReturn(user);
        
        // Simulate one success and then failures if needed, but here we test if the controller logic handles it
        // Since we are mocking the service, we can't fully test DB-level concurrency here, 
        // but we can test if multiple threads calling the controller result in multiple service calls.
        
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<Integer>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                latch.await();
                return mockMvc.perform(put("/api/users/me")
                        .cookie(new Cookie("user_id", userId.toString()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", username))))
                        .andReturn().getResponse().getStatus();
            }));
        }

        latch.countDown();
        for (Future<Integer> future : futures) {
            future.get();
        }
        executor.shutdown();

        // Verify service was called for uniqueness check
        verify(userService, atLeast(threadCount)).existsByUsernameExcludingUser(eq(username), eq(userId));
    }
}
