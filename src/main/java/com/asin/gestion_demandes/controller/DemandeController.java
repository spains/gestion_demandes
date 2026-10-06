package com.asin.gestion_demandes.controller;

import com.asin.gestion_demandes.model.Demande;
import com.asin.gestion_demandes.model.Statut;
import com.asin.gestion_demandes.service.DemandeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@CrossOrigin(origins = "*")
public class DemandeController {

    private final DemandeService service;

    public DemandeController(DemandeService service) {
        this.service = service;
    }

    // SOCLE 1 : Déposer une demande
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Demande deposer(@Valid @RequestBody Demande demande) {
        return service.deposer(demande);
    }

    // SOCLE 2 : Consulter les demandes d'un usager
    @GetMapping("/usager/{npi}")
    public List<Demande> listerParUsager(
            @PathVariable String npi,
            @RequestParam(required = false) Statut statut) {
        return service.listerParUsager(npi, statut);
    }

    // SOCLE 3 : Faire avancer le traitement
    @PutMapping("/{id}/avancer")
    public Demande faireAvancer(
            @PathVariable Long id,
            @RequestParam Statut statut,
            @RequestParam(required = false) String motifRejet) {
        return service.faireAvancer(id, statut, motifRejet);
    }

    // BONUS 1 : Pagination
    @GetMapping("/paginees")
    public Page<Demande> listerPaginees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int taille) {
        return service.listerPaginees(page, taille);
    }

    // BONUS 2 : Nombre par statut
    @GetMapping("/stats")
    public Map<Statut, Long> stats() {
        return service.compterParStatut();
    }

    @GetMapping("/{id}")
    public Demande getById(@PathVariable Long id) {
        return service.findById(id);
    }
}