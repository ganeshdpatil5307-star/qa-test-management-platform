package com.example.qatesting.controller;

import com.example.qatesting.dto.BugRequest;
import com.example.qatesting.dto.BugResponse;
import com.example.qatesting.entity.BugPriority;
import com.example.qatesting.entity.BugSeverity;
import com.example.qatesting.entity.BugStatus;
import com.example.qatesting.service.BugService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/bugs")
public class BugController {

    private final BugService bugService;

    public BugController(BugService bugService) {
        this.bugService = bugService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BugResponse create(@Valid @RequestBody BugRequest request) {
        return bugService.create(request);
    }

    @GetMapping
    public Page<BugResponse> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BugStatus status,
            @RequestParam(required = false) BugPriority priority,
            @RequestParam(required = false) BugSeverity severity,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String project,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDirection,
            @PageableDefault(size = 10, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        String safeSortField = switch (sortBy) {
            case "title", "status", "priority", "severity", "assignee", "project", "createdAt", "updatedAt" -> sortBy;
            default -> "updatedAt";
        };
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(sortDirection, safeSortField)
        );
        return bugService.findAll(search, status, priority, severity, assignee, project, sortedPageable);
    }

    @GetMapping("/{id}")
    public BugResponse findById(@PathVariable Long id) {
        return bugService.findById(id);
    }

    @PutMapping("/{id}")
    public BugResponse update(@PathVariable Long id, @Valid @RequestBody BugRequest request) {
        return bugService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bugService.delete(id);
    }
}
