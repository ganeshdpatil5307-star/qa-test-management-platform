package com.example.qatesting.dto;

import com.example.qatesting.entity.BugPriority;
import com.example.qatesting.entity.BugSeverity;
import com.example.qatesting.entity.BugStatus;

import java.time.LocalDateTime;

public record BugResponse(
        Long id,
        String title,
        String description,
        String project,
        String environment,
        String stepsToReproduce,
        String expectedResult,
        String actualResult,
        BugSeverity severity,
        BugPriority priority,
        BugStatus status,
        String assignee,
        String reporter,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
