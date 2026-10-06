package com.asin.gestion_demandes.repository;

import com.asin.gestion_demandes.model.Demande;
import com.asin.gestion_demandes.model.Statut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {

    List<Demande> findByNpiOrderByDateCreationDesc(String npi);

    List<Demande> findByNpiAndStatutOrderByDateCreationDesc(String npi, Statut statut);

    Page<Demande> findAllByOrderByDateCreationDesc(Pageable pageable);

    long countByStatut(Statut statut);
}