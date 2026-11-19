package com.boostup.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time-with-every-start data cleanup for databases created before the role model
 * changed. Old platform roles (OWNER/MEMBER/VIEWER) no longer exist in {@code User.Role},
 * so they are rewritten to USER before anything tries to read them as an enum.
 */
@Component
public class LegacyRoleDataMigration implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(LegacyRoleDataMigration.class);

    private final JdbcTemplate jdbcTemplate;

    public LegacyRoleDataMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        normalizePlatformRoles();
        normalizeLegacyProjectMemberships();
    }

    private void normalizePlatformRoles() {
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE users SET role = 'USER' WHERE role IS NOT NULL AND role NOT IN ('ADMINISTRATOR', 'USER')");
            if (updated > 0) {
                logger.warn("Migrated {} user account(s) with a legacy platform role to USER", updated);
            }
        } catch (Exception exception) {
            logger.debug("Skipping platform role migration: {}", exception.getMessage());
        }
    }

    private void normalizeLegacyProjectMemberships() {
        // The project_memberships table is no longer mapped; keep it readable if it exists.
        try {
            jdbcTemplate.update(
                    "UPDATE project_memberships SET role = 'MEMBER' WHERE role IS NOT NULL AND role NOT IN ('OWNER', 'MEMBER')");
        } catch (Exception exception) {
            logger.debug("No legacy project_memberships migration needed: {}", exception.getMessage());
        }
    }
}
