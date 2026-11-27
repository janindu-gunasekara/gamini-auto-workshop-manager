package com.gaminiauto.workshopmanager.repository;

import com.gaminiauto.workshopmanager.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository
        extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findAllByOrderByIdDesc();

    List<StockMovement> findByProduct_IdOrderByIdDesc(
            Long productId);

    List<StockMovement> findByMovementTypeOrderByIdDesc(
            String movementType);
}