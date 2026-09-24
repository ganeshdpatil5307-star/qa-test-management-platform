package com.example.qatesting.controller;

import com.example.qatesting.entity.Bug;
import com.example.qatesting.entity.BugPriority;
import com.example.qatesting.entity.BugSeverity;
import com.example.qatesting.entity.BugStatus;
import com.example.qatesting.repository.BugRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser(username = "admin", roles = "ADMIN")
class BugControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BugRepository bugRepository;

    @BeforeEach
    void cleanDatabase() {
        bugRepository.deleteAll();
    }

    @Test
    void createAndListBugs() throws Exception {
        mockMvc.perform(post("/api/bugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBugJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title", is("Login fails")))
                .andExpect(jsonPath("$.severity", is("HIGH")))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        mockMvc.perform(get("/api/bugs"))
                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content", hasSize(1)))
                                .andExpect(jsonPath("$.content[0].project", is("Portal")))
                                .andExpect(jsonPath("$.totalElements", is(1)))
                                .andExpect(jsonPath("$.totalPages", is(1)));
    }

        @Test
        void filtersAndPaginatesBugs() throws Exception {
                bugRepository.save(new Bug("Login fails", "Users cannot log in", "Portal", "QA", "Open login", "Dashboard", "Error", BugSeverity.HIGH, BugPriority.HIGH, BugStatus.OPEN, "qa-owner", "reporter"));
                bugRepository.save(new Bug("Checkout fails", "Users cannot pay", "Portal", "QA", "Open checkout", "Payment succeeds", "Error", BugSeverity.CRITICAL, BugPriority.HIGH, BugStatus.OPEN, "qa-owner", "reporter"));
                bugRepository.save(new Bug("Search polish", "Copy issue", "Admin", "QA", "Open search", "Copy is correct", "Copy is wrong", BugSeverity.LOW, BugPriority.LOW, BugStatus.RESOLVED, "design-owner", "reporter"));

                mockMvc.perform(get("/api/bugs")
                                                .param("search", "checkout")
                                                .param("status", "OPEN")
                                                .param("priority", "HIGH")
                                                .param("severity", "CRITICAL")
                                                .param("assignee", "qa-owner")
                                                .param("project", "Portal")
                                                .param("page", "0")
                                                .param("size", "1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content", hasSize(1)))
                                .andExpect(jsonPath("$.content[0].title", is("Checkout fails")))
                                .andExpect(jsonPath("$.number", is(0)))
                                .andExpect(jsonPath("$.size", is(1)))
                                .andExpect(jsonPath("$.totalElements", is(1)))
                                .andExpect(jsonPath("$.totalPages", is(1)));
        }

        @Test
        void returnsSecondPageMetadata() throws Exception {
                bugRepository.save(new Bug("First bug", "Description", "Portal", "QA", "Steps", "Expected", "Actual", BugSeverity.MEDIUM, BugPriority.MEDIUM, BugStatus.OPEN, "owner", "reporter"));
                bugRepository.save(new Bug("Second bug", "Description", "Portal", "QA", "Steps", "Expected", "Actual", BugSeverity.MEDIUM, BugPriority.MEDIUM, BugStatus.OPEN, "owner", "reporter"));

                mockMvc.perform(get("/api/bugs").param("page", "1").param("size", "1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content", hasSize(1)))
                                .andExpect(jsonPath("$.totalElements", is(2)))
                                .andExpect(jsonPath("$.totalPages", is(2)))
                                .andExpect(jsonPath("$.number", is(1)));
        }

        @Test
        void searchesTitleAndDescriptionAndSortsResults() throws Exception {
                bugRepository.save(new Bug("Zebra issue", "A checkout rendering problem", "Portal", "QA", "Steps", "Expected", "Actual", BugSeverity.MEDIUM, BugPriority.MEDIUM, BugStatus.OPEN, "owner", "reporter"));
                bugRepository.save(new Bug("Alpha issue", "A login rendering problem", "Portal", "QA", "Steps", "Expected", "Actual", BugSeverity.MEDIUM, BugPriority.MEDIUM, BugStatus.OPEN, "owner", "reporter"));

                mockMvc.perform(get("/api/bugs")
                                                .param("search", "rendering")
                                                .param("sortBy", "title")
                                                .param("sortDirection", "ASC"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content", hasSize(2)))
                                .andExpect(jsonPath("$.content[0].title", is("Alpha issue")))
                                .andExpect(jsonPath("$.content[1].title", is("Zebra issue")));
        }

                    @Test
                    void appliesEachFilterAndReturnsEmptyOutOfRangePages() throws Exception {
                        bugRepository.save(new Bug("Login issue", "Authentication description", "Portal", "QA", "Steps", "Expected", "Actual", BugSeverity.HIGH, BugPriority.URGENT, BugStatus.OPEN, "alice", "reporter"));
                        bugRepository.save(new Bug("Checkout issue", "Payment description", "Store", "QA", "Steps", "Expected", "Actual", BugSeverity.CRITICAL, BugPriority.HIGH, BugStatus.IN_PROGRESS, "bob", "reporter"));

                        mockMvc.perform(get("/api/bugs").param("search", "authentication"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
                        mockMvc.perform(get("/api/bugs").param("status", "IN_PROGRESS"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
                        mockMvc.perform(get("/api/bugs").param("priority", "URGENT"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
                        mockMvc.perform(get("/api/bugs").param("severity", "CRITICAL"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
                        mockMvc.perform(get("/api/bugs").param("assignee", "alice"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
                        mockMvc.perform(get("/api/bugs").param("project", "Store"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)));
                        mockMvc.perform(get("/api/bugs").param("page", "99").param("size", "1"))
                                .andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(0)))
                                .andExpect(jsonPath("$.totalElements", is(2)));
                    }

                    @Test
                    void validatesUpdateAndMissingDelete() throws Exception {
                        Bug bug = bugRepository.save(new Bug("Existing", "Description", "Portal", "QA", "Steps", "Expected", "Actual", BugSeverity.LOW, BugPriority.LOW, BugStatus.OPEN, "owner", "reporter"));
                        mockMvc.perform(put("/api/bugs/{id}", bug.getId())
                                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").isNotEmpty());
                        mockMvc.perform(delete("/api/bugs/99999"))
                                .andExpect(status().isNotFound());
                    }

    @Test
    void getUpdateAndDeleteBug() throws Exception {
        Bug bug = bugRepository.save(new Bug(
                "Login fails",
                "Users cannot log in",
                "Portal",
                "QA",
                "Open the login page",
                "Dashboard is displayed",
                "An error is displayed",
                BugSeverity.HIGH,
                BugPriority.HIGH,
                BugStatus.OPEN,
                "qa-owner",
                "reporter"
        ));

        mockMvc.perform(get("/api/bugs/{id}", bug.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Login fails")));

        mockMvc.perform(put("/api/bugs/{id}", bug.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validBugJson().replace("Login fails", "Login still fails")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Login still fails")));

        mockMvc.perform(delete("/api/bugs/{id}", bug.getId()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get("/api/bugs/{id}", bug.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Bug not found with id: " + bug.getId())));
    }

    @Test
    void rejectsInvalidBugAndMissingBug() throws Exception {
        mockMvc.perform(post("/api/bugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty());

        mockMvc.perform(get("/api/bugs/{id}", 99999L))
                .andExpect(status().isNotFound());
    }

    private String validBugJson() {
        return """
                {
                  "title": "Login fails",
                  "description": "Users cannot log in",
                  "project": "Portal",
                  "environment": "QA",
                  "stepsToReproduce": "Open the login page",
                  "expectedResult": "Dashboard is displayed",
                  "actualResult": "An error is displayed",
                  "severity": "HIGH",
                  "priority": "HIGH",
                  "status": "OPEN",
                  "assignee": "qa-owner",
                  "reporter": "reporter"
                }
                """;
    }

}
