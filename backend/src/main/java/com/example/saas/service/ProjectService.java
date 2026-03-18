package com.example.saas.service;

import com.example.saas.model.Project;
import com.example.saas.model.User;
import com.example.saas.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final AuditLogService auditLogService;

    public Page<Project> getAllProjects(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return projectRepository.findAll(pageable);
    }

    public Project getProject(UUID id) {
        return projectRepository.findById(id).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Transactional
    public Project createProject(String name, String description) {
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setOwnerId(currentUser.getId());

        Project saved = projectRepository.save(project);
        auditLogService.log("PROJECT_CREATED", "PROJECT", saved.getId(), "Created project: " + name);
        return saved;
    }
}
