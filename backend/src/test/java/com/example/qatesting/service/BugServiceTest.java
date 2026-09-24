package com.example.qatesting.service;

import com.example.qatesting.dto.BugRequest;
import com.example.qatesting.dto.BugResponse;
import com.example.qatesting.entity.Bug;
import com.example.qatesting.entity.BugPriority;
import com.example.qatesting.entity.BugSeverity;
import com.example.qatesting.entity.BugStatus;
import com.example.qatesting.exception.ResourceNotFoundException;
import com.example.qatesting.repository.BugRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BugServiceTest {

    @Mock
    private BugRepository bugRepository;

    @InjectMocks
    private BugService bugService;

    @Test
    void createMapsRequestAndSavesBug() {
        BugRequest request = request();
        when(bugRepository.save(any(Bug.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BugResponse response = bugService.create(request);

        ArgumentCaptor<Bug> bugCaptor = ArgumentCaptor.forClass(Bug.class);
        verify(bugRepository).save(bugCaptor.capture());
        Bug savedBug = bugCaptor.getValue();
        assertThat(savedBug.getTitle()).isEqualTo("Login fails");
        assertThat(savedBug.getSeverity()).isEqualTo(BugSeverity.HIGH);
        assertThat(response.title()).isEqualTo("Login fails");
        assertThat(response.status()).isEqualTo(BugStatus.OPEN);
    }

    @Test
    void findByIdThrowsWhenBugDoesNotExist() {
        when(bugRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bugService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Bug not found with id: 99");
    }

    private BugRequest request() {
        return new BugRequest(
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
        );
    }
}
