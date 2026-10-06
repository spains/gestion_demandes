package com.asin.gestion_demandes.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demandes")
public class Demande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    @NotBlank(message = "Le NPI est obligatoire")
    @Pattern(regexp = "^\\d{10}$", message = "Le NPI doit contenir exactement 10 chiffres")
    @Column(nullable = false, length = 10)
    private String npi;

    @NotNull(message = "Le type d'acte est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "type_acte", nullable = false)
    private TypeActe typeActe;

    @NotNull(message = "Le nombre de copies est obligatoire")
    @Min(value = 1, message = "Le nombre de copies doit être au moins 1")
    @Max(value = 5, message = "Le nombre de copies ne peut pas dépasser 5")
    @Column(name = "nombre_copies", nullable = false)
    private Integer nombreCopies;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut;

    @Column(name = "motif_rejet", length = 500)
    private String motifRejet;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    // =====================
    // Getters et Setters
    // =====================

    public Long getId() { return id; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNpi() { return npi; }
    public void setNpi(String npi) { this.npi = npi; }

    public TypeActe getTypeActe() { return typeActe; }
    public void setTypeActe(TypeActe typeActe) { this.typeActe = typeActe; }

    public Integer getNombreCopies() { return nombreCopies; }
    public void setNombreCopies(Integer nombreCopies) { this.nombreCopies = nombreCopies; }

    public Statut getStatut() { return statut; }
    public void setStatut(Statut statut) { this.statut = statut; }

    public String getMotifRejet() { return motifRejet; }
    public void setMotifRejet(String motifRejet) { this.motifRejet = motifRejet; }

    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }

    public LocalDateTime getDateTraitement() { return dateTraitement; }
    public void setDateTraitement(LocalDateTime dateTraitement) { this.dateTraitement = dateTraitement; }
}