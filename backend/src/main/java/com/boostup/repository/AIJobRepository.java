package com.boostup.repository;

import com.boostup.model.AIJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIJobRepository extends JpaRepository<AIJob, Long> {
    Optional<AIJob> findByJobId(String jobId);
    List<AIJob> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}

