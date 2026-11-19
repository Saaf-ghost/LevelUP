package com.boostup.config;

import com.boostup.model.User;
import com.boostup.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the platform administrator from configuration supplied by the developer
 * ({@code ADMIN_EMAIL} / {@code ADMIN_PASSWORD} / {@code ADMIN_FULL_NAME}).
 *
 * <p>Self-service registration never grants the platform role: every account created
 * through the public API is a plain USER. The only way to get an ADMINISTRATOR is to
 * be seeded here or to be promoted by an existing administrator.
 */
@Component
public class AdministratorSeeder implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdministratorSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFullName;

    public AdministratorSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.email:}") String adminEmail,
            @Value("${app.admin.password:}") String adminPassword,
            @Value("${app.admin.full-name:Platform Administrator}") String adminFullName
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminFullName = adminFullName;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (isBlank(adminEmail) || isBlank(adminPassword)) {
            logger.warn("No platform administrator configured. Set ADMIN_EMAIL and ADMIN_PASSWORD "
                    + "to provision one; registrations only create USER accounts.");
            return;
        }

        String email = adminEmail.trim().toLowerCase();
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            if (existing.getRole() != User.Role.ADMINISTRATOR) {
                existing.setRole(User.Role.ADMINISTRATOR);
                userRepository.save(existing);
                logger.info("Granted the platform administrator role to the configured account {}", email);
            }
            return;
        }

        User administrator = new User();
        administrator.setEmail(email);
        administrator.setFullName(isBlank(adminFullName) ? "Platform Administrator" : adminFullName.trim());
        administrator.setPasswordHash(passwordEncoder.encode(adminPassword));
        administrator.setRole(User.Role.ADMINISTRATOR);
        administrator.setCapacityPoints(40);
        userRepository.save(administrator);
        logger.info("Created the configured platform administrator account {}", email);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
