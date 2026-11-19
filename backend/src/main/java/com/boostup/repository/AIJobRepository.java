package com.boostup.repository;

import com.boostup.model.AIJob;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIJobRepository extends JpaRepository<AIJob, Long> {
    Optional<AIJob> findByJobId(String jobId);

    /** Serializes worker callbacks so a retried delivery cannot insert the backlog twice. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select job from AIJob job where job.jobId = :jobId")
    Optional<AIJob> findWithLockByJobId(@Param("jobId") String jobId);
    List<AIJob> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}

