package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :user1 AND m.receiverId = :user2) OR " +
           "(m.senderId = :user2 AND m.receiverId = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(@Param("user1") UUID user1, @Param("user2") UUID user2);

    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :userId OR m.receiverId = :userId ORDER BY m.createdAt DESC")
    List<ChatMessage> findAllByUser(@Param("userId") UUID userId);

    @Query(value = "SELECT m.* FROM chat_messages m " +
           "INNER JOIN (" +
           "  SELECT " +
           "    CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END AS partner_id, " +
           "    MAX(created_at) AS max_time " +
           "  FROM chat_messages " +
           "  WHERE sender_id = :userId OR receiver_id = :userId " +
           "  GROUP BY partner_id" +
           ") latest ON m.created_at = latest.max_time " +
           "AND (CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END) = latest.partner_id " +
           "WHERE m.sender_id = :userId OR m.receiver_id = :userId " +
           "ORDER BY m.created_at DESC", nativeQuery = true)
    List<ChatMessage> findLatestPerConversation(@Param("userId") UUID userId);
}
