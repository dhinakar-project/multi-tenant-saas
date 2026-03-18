package com.example.saas.controller;

import com.example.saas.model.Project;
import com.example.saas.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public Page<Project> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return projectService.getAllProjects(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TENANT_ADMIN', 'MEMBER')")
    public Project getProject(@PathVariable UUID id) {
        return projectService.getProject(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('TENANT_ADMIN')")
    public Project createProject(@RequestBody Map<String, String> body) {
        return projectService.createProject(
                body.get("name"),
                body.get("description"));
    }
}
