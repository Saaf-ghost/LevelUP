package com.ehtp.kanban_backend.controller;

import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final ProjetRepository projetRepository;

    public HomeController(ProjetRepository projetRepository) {
        this.projetRepository = projetRepository;
    }

    @GetMapping
    public Map<String, Object> getHomeData(@RequestParam Long userId) {
        List<Projet> owned = projetRepository.findByOwnerId(userId);
        List<Projet> memberOf = projetRepository.findByMembersId(userId).stream()
                .filter(p -> p.getOwner() == null || p.getOwner().getId() != userId)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("ownedProjects", owned);
        response.put("memberProjects", memberOf);
        return response;
    }
}
