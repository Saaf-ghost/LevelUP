package com.ehtp.kanban_backend.repository;

import com.ehtp.kanban_backend.model.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjetRepository extends JpaRepository<Projet, Long> {
    Optional<Projet> findById(Long id);
    List<Projet> findDistinctByOwnerIdOrMembersId(Long ownerId, Long memberId);
    List<Projet> findByOwnerId(Long ownerId);
    List<Projet> findByMembersId(Long memberId);
}