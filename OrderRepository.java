package org.neonangellock.azurecanvas.repository;

import org.neonangellock.azurecanvas.model.MarketOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<MarketOrder, UUID> {

    List<MarketOrder> findByBuyer_UserIdOrderByCreatedAtDesc(UUID buyerId);

    List<MarketOrder> findBySeller_UserIdOrderByCreatedAtDesc(UUID sellerId);

    List<MarketOrder> findByBuyer_UserIdAndStatusOrderByCreatedAtDesc(UUID buyerId, String status);

    List<MarketOrder> findBySeller_UserIdAndStatusOrderByCreatedAtDesc(UUID sellerId, String status);

    List<MarketOrder> findByItem_ItemId(UUID itemId);
}
