package com.boostup;

import com.boostup.model.User;
import com.boostup.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
        userRepository.deleteAll();
    }

    @Test
    void registrationCreatesARegularUser() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@boostup.com",
                                  "password": "password",
                                  "fullName": "BoostUP Owner",
                                  "capacityPoints": 40
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(blankOrNullString())))
                .andExpect(jsonPath("$.user.email").value("owner@boostup.com"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.capacityPoints").value(40));
    }

    @Test
    void adminApiRejectsRegularUsers() throws Exception {
        String token = register("member@boostup.com", "Regular Member");

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminApiAcceptsPromotedAdministrator() throws Exception {
        register("promoted@boostup.com", "Promoted Admin");
        User promoted = userRepository.findByEmail("promoted@boostup.com").orElseThrow();
        promoted.setRole(User.Role.ADMINISTRATOR);
        userRepository.save(promoted);

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "promoted@boostup.com",
                                  "password": "password"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = response.replaceAll(".*\\\"token\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("promoted@boostup.com"));
    }

    @Test
    void registrationCannotEscalateItsOwnRole() throws Exception {
        register("owner@boostup.com", "BoostUP Owner");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "intruder@boostup.com",
                                  "password": "password",
                                  "fullName": "Intruder",
                                  "role": "ADMINISTRATOR"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void loginReturnsTokenForRegisteredUser() throws Exception {
        register("owner@boostup.com", "BoostUP Owner");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "owner@boostup.com",
                                  "password": "password"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", not(blankOrNullString())))
                .andExpect(jsonPath("$.user.fullName").value("BoostUP Owner"));
    }

    @Test
    void protectedApiRejectsMissingToken() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedApiAcceptsBearerToken() throws Exception {
        String token = register("owner@boostup.com", "BoostUP Owner");

        mockMvc.perform(get("/api/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private String register(String email, String fullName) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "password",
                                  "fullName": "%s",
                                  "capacityPoints": 40
                                }
                                """.formatted(email, fullName)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.replaceAll(".*\\\"token\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
