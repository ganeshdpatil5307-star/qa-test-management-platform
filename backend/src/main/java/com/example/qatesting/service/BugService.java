package com.example.qatesting.service;

import com.example.qatesting.dto.BugRequest;
import com.example.qatesting.dto.BugResponse;
import com.example.qatesting.entity.Bug;
import com.example.qatesting.entity.BugPriority;
import com.example.qatesting.entity.BugSeverity;
import com.example.qatesting.entity.BugStatus;
import com.example.qatesting.exception.ResourceNotFoundException;
import com.example.qatesting.repository.BugRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@Service
public class BugService {

    private final BugRepository bugRepository;

    public BugService(BugRepository bugRepository) {
        this.bugRepository = bugRepository;
    }

    @Transactional
    public BugResponse create(BugRequest request) {
        Bug bug = new Bug();
        applyRequest(bug, request);
        return toResponse(bugRepository.save(bug));
    }

    @Transactional(readOnly = true)
    public Page<BugResponse> findAll(String search, BugStatus status, BugPriority priority,
                                     BugSeverity severity, String assignee, String project,
                                     Pageable pageable) {
        Specification<Bug> specification = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String searchTerm = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("title")), searchTerm),
                    builder.like(builder.lower(root.get("description")), searchTerm)
            ));
        }
        if (status != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("status"), status));
        }
        if (priority != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("priority"), priority));
        }
        if (severity != null) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("severity"), severity));
        }
        if (assignee != null && !assignee.isBlank()) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("assignee"), assignee.trim()));
        }
        if (project != null && !project.isBlank()) {
            specification = specification.and((root, query, builder) -> builder.equal(root.get("project"), project.trim()));
        }
        return bugRepository.findAll(specification, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public BugResponse findById(Long id) {
        return toResponse(findBug(id));
    }

    @Transactional
    public BugResponse update(Long id, BugRequest request) {
        Bug bug = findBug(id);
        applyRequest(bug, request);
        return toResponse(bugRepository.save(bug));
    }

    @Transactional
    public void delete(Long id) {
        Bug bug = findBug(id);
        bugRepository.delete(bug);
    }

    private Bug findBug(Long id) {
        return bugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with id: " + id));
    }

    private void applyRequest(Bug bug, BugRequest request) {
        bug.setTitle(request.title());
        bug.setDescription(request.description());
        bug.setProject(request.project());
        bug.setEnvironment(request.environment());
        bug.setStepsToReproduce(request.stepsToReproduce());
        bug.setExpectedResult(request.expectedResult());
        bug.setActualResult(request.actualResult());
        bug.setSeverity(request.severity());
        bug.setPriority(request.priority());
        bug.setStatus(request.status());
        bug.setAssignee(request.assignee());
        bug.setReporter(request.reporter());
    }

    private BugResponse toResponse(Bug bug) {
        return new BugResponse(
                bug.getId(),
                bug.getTitle(),
                bug.getDescription(),
                bug.getProject(),
                bug.getEnvironment(),
                bug.getStepsToReproduce(),
                bug.getExpectedResult(),
                bug.getActualResult(),
                bug.getSeverity(),
                bug.getPriority(),
                bug.getStatus(),
                bug.getAssignee(),
                bug.getReporter(),
                bug.getCreatedAt(),
                bug.getUpdatedAt()
        );
    }
}
