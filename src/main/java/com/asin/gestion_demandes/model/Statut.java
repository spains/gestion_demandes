package com.asin.gestion_demandes.model;

public enum Statut {
    DEPOSEE,
    EN_COURS_TRAITEMENT,
    VALIDEE,
    REJETEE;

    public boolean estFinal() {
        return this == VALIDEE || this == REJETEE;
    }
}