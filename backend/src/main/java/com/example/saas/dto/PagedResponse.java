package com.example.saas.dto;

import lombok.Data;
import java.util.List;

/**
 * Generic paginated response wrapper.
 * Replaces returning raw Spring {@code Page<T>} from controllers, which exposes
 * Spring internals in the API contract. This wrapper gives a stable, documented shape.
 */
@Data
public class PagedResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    /**
     * Factory method — converts a Spring Data {@code Page<T>} into our stable DTO.
     */
    public static <T> PagedResponse<T> of(org.springframework.data.domain.Page<T> springPage) {
        PagedResponse<T> resp = new PagedResponse<>();
        resp.setContent(springPage.getContent());
        resp.setPage(springPage.getNumber());
        resp.setSize(springPage.getSize());
        resp.setTotalElements(springPage.getTotalElements());
        resp.setTotalPages(springPage.getTotalPages());
        resp.setLast(springPage.isLast());
        return resp;
    }
}
