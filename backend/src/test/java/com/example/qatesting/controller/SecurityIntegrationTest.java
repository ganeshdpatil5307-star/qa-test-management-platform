package com.example.qatesting.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousBugRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/bugs"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bugs").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/bugs/999").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/bugs/999"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "TESTER")
    void testerCanReadButCannotEditOrDelete() throws Exception {
        mockMvc.perform(get("/api/bugs")).andExpect(status().isOk());
        mockMvc.perform(put("/api/bugs/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/bugs/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "DEVELOPER")
    void developerCanUseEditEndpointButCannotDelete() throws Exception {
        mockMvc.perform(put("/api/bugs/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(delete("/api/bugs/999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanReachDeleteEndpoint() throws Exception {
        mockMvc.perform(delete("/api/bugs/999"))
                .andExpect(status().isNotFound());
    }

        @Test
        @WithMockUser(roles = "TESTER")
        void testerCanCreateBugs() throws Exception {
                mockMvc.perform(post("/api/bugs")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(validBugJson()))
                                .andExpect(status().isCreated());
        }

        @Test
        @WithMockUser(roles = "DEVELOPER")
        void developerCanCreateBugs() throws Exception {
                mockMvc.perform(post("/api/bugs")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(validBugJson()))
                                .andExpect(status().isCreated());
        }

    @Test
    void logoutRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }

                private String validBugJson() {
                                return """
                                                                {
                                                                        "title": "Permission test",
                                                                        "description": "Testing role access",
                                                                        "project": "Portal",
                                                                        "environment": "QA",
                                                                        "stepsToReproduce": "Open the app",
                                                                        "expectedResult": "Access works",
                                                                        "actualResult": "Access works",
                                                                        "severity": "LOW",
                                                                        "priority": "LOW",
                                                                        "status": "OPEN",
                                                                        "assignee": "owner",
                                                                        "reporter": "reporter"
                                                                }
                                                                """;
                }
}
