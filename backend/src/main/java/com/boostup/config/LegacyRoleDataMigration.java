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
        ensureAdministratorExists();
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

    private void ensureAdministratorExists() {
        try {
            Integer users = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            if (users == null || users == 0) {
                return;
            }
            Integer administrators = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE role = 'ADMINISTRATOR'", Integer.class);
            if (administrators != null && administrators > 0) {
                return;
            }
            jdbcTemplate.update(
                    "UPDATE users SET role = 'ADMINISTRATOR' WHERE id = (SELECT MIN(id) FROM users)");
            logger.warn("No platform administrator existed; promoted the oldest account");
        } catch (Exception exception) {
            logger.debug("Skipping administrator bootstrap check: {}", exception.getMessage());
        }
    }
}
