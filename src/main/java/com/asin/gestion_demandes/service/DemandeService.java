package com.asin.gestion_demandes.service;

import com.asin.gestion_demandes.exception.RegleMetierException;
import com.asin.gestion_demandes.model.Demande;
import com.asin.gestion_demandes.model.Statut;
import com.asin.gestion_demandes.repository.DemandeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DemandeService {

    private final DemandeRepository repository;

    public DemandeService(DemandeRepository repository) {
        this.repository = repository;
    }

    // === SOCLE 1 : Déposer une demande ===
    public Demande deposer(Demande demande) {
        demande.setReference("DEM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        demande.setStatut(Statut.DEPOSEE);
        demande.setDateCreation(LocalDateTime.now());
        demande.setMotifRejet(null);
        return repository.save(demande);
    }

    // === SOCLE 2 : Consulter les demandes d'un usager ===
    public List<Demande> listerParUsager(String npi, Statut statut) {
        if (statut == null) {
            return repository.findByNpiOrderByDateCreationDesc(npi);
        }
        return repository.findByNpiAndStatutOrderByDateCreationDesc(npi, statut);
    }

    // === SOCLE 3 : Faire avancer le traitement ===
    public Demande faireAvancer(Long id, Statut nouveauStatut, String motifRejet) {
        Demande demande = findById(id);

        // Règle : une demande validée ou rejetée ne change plus
        if (demande.getStatut().estFinal()) {
            throw new RegleMetierException("Cette demande est déjà clôturée (" + demande.getStatut() + ")");
        }

        // Règle : transitions autorisées
        Statut actuel = demande.getStatut();
        boolean transitionValide =
                (actuel == Statut.DEPOSEE && nouveauStatut == Statut.EN_COURS_TRAITEMENT) ||
                (actuel == Statut.EN_COURS_TRAITEMENT && nouveauStatut == Statut.VALIDEE) ||
                (actuel == Statut.EN_COURS_TRAITEMENT && nouveauStatut == Statut.REJETEE);

        if (!transitionValide) {
            throw new RegleMetierException("Transition invalide : " + actuel + " → " + nouveauStatut);
        }

        // Règle : un rejet doit être motivé
        if (nouveauStatut == Statut.REJETEE) {
            if (motifRejet == null || motifRejet.isBlank()) {
                throw new RegleMetierException("Un rejet doit obligatoirement être motivé");
            }
            demande.setMotifRejet(motifRejet);
        }

        demande.setStatut(nouveauStatut);
        demande.setDateTraitement(LocalDateTime.now());
        return repository.save(demande);
    }

    // === BONUS 1 : Pagination ===
    public Page<Demande> listerPaginees(int page, int taille) {
        if (taille > 20) taille = 20; // max 20 par page
        Pageable pageable = PageRequest.of(page, taille);
        return repository.findAllByOrderByDateCreationDesc(pageable);
    }

    // === BONUS 2 : Nombre par statut ===
    public Map<Statut, Long> compterParStatut() {
        Map<Statut, Long> resultat = new LinkedHashMap<>();
        for (Statut s : Statut.values()) {
            resultat.put(s, repository.countByStatut(s));
        }
        return resultat;
    }

    public Demande findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RegleMetierException("Demande introuvable : id=" + id));
    }
}