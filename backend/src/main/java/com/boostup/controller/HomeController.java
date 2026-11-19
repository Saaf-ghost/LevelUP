package com.boostup.controller;

import com.boostup.model.Projet;
import com.boostup.model.User;
import com.boostup.repository.ProjetRepository;
import com.boostup.service.AuthorizationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    private final ProjetRepository projetRepository;
    private final AuthorizationService authorizationService;

    public HomeController(ProjetRepository projetRepository, AuthorizationService authorizationService) {
        this.projetRepository = projetRepository;
        this.authorizationService = authorizationService;
    }

    @GetMapping
    public Map<String, Object> getHomeData() {
        User user = authorizationService.currentUser();
        List<Projet> owned = projetRepository.findByOwnerId(user.getId());
        List<Projet> memberOf = projetRepository.findByMembersId(user.getId()).stream()
                .filter(project -> project.getOwner() == null || project.getOwner().getId() != user.getId())
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("ownedProjects", owned);
        response.put("memberProjects", memberOf);
        return response;
    }
}
