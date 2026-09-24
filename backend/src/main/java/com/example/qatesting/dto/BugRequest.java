package com.example.qatesting.dto;

import com.example.qatesting.entity.BugPriority;
import com.example.qatesting.entity.BugSeverity;
import com.example.qatesting.entity.BugStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BugRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String project,
        @NotBlank String environment,
        @NotBlank String stepsToReproduce,
        @NotBlank String expectedResult,
        @NotBlank String actualResult,
        @NotNull BugSeverity severity,
        @NotNull BugPriority priority,
        @NotNull BugStatus status,
        @NotBlank String assignee,
        @NotBlank String reporter
) {
}
