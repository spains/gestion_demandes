// ============================================
// Configuration
// ============================================
const API_URL = "http://localhost:8080/api/demandes";

// ============================================
// Sélecteurs DOM
// ============================================
const form             = document.getElementById("form-demande");
const tbody            = document.getElementById("tbody-demandes");
const message          = document.getElementById("message");
const rechercheNpi     = document.getElementById("rechercheNpi");
const filtreStatut     = document.getElementById("filtre-statut");
const btnRechercher    = document.getElementById("btn-rechercher");
const btnTout          = document.getElementById("btn-tout");

// ============================================
// Libellés lisibles
// ============================================
const LIBELLES_ACTE = {
    "ACTE_NAISSANCE":      "Acte de naissance",
    "CASIER_JUDICIAIRE":   "Casier judiciaire",
    "CERTIFICAT_RESIDENCE":"Certificat de résidence"
};

const LIBELLES_STATUT = {
    "DEPOSEE":             "Déposée",
    "EN_COURS_TRAITEMENT": "En cours",
    "VALIDEE":             "Validée",
    "REJETEE":             "Rejetée"
};

// ============================================
// Affichage des messages
// ============================================
function afficherMessage(texte, type = "success") {
    message.textContent = texte;
    message.className = "message " + type;
    setTimeout(() => { message.className = "message"; }, 4000);
}

// ============================================
// Formater la date
// ============================================
function formaterDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

// ============================================
// Charger toutes les demandes
// ============================================
async function chargerToutesLesDemandes() {
    try {
        const response = await fetch(`${API_URL}/paginees?page=0&taille=20`);
        if (!response.ok) throw new Error("Erreur HTTP " + response.status);
        const data = await response.json();
        afficherDemandes(data.content || []);
    } catch (err) {
        afficherMessage("❌ Impossible de charger les demandes : " + err.message, "error");
        console.error(err);
    }
}

// ============================================
// Charger les demandes d'un usager (NPI)
// ============================================
async function chargerDemandesParUsager() {
    const npi = rechercheNpi.value.trim();
    const statut = filtreStatut.value;

    if (!npi) {
        afficherMessage("⚠️ Veuillez saisir un NPI (10 chiffres)", "error");
        return;
    }
    if (!/^\d{10}$/.test(npi)) {
        afficherMessage("⚠️ Le NPI doit contenir exactement 10 chiffres", "error");
        return;
    }

    let url = `${API_URL}/usager/${npi}`;
    if (statut) url += `?statut=${statut}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur HTTP " + response.status);
        const demandes = await response.json();
        afficherDemandes(demandes);

        if (demandes.length === 0) {
            afficherMessage(`ℹ️ Aucune demande trouvée pour le NPI ${npi}`, "error");
        } else {
            afficherMessage(`✅ ${demandes.length} demande(s) trouvée(s) pour le NPI ${npi}`);
        }
    } catch (err) {
        afficherMessage("❌ Erreur : " + err.message, "error");
        console.error(err);
    }
}

// ============================================
// Afficher les demandes dans le tableau
// ============================================
function afficherDemandes(demandes) {
    tbody.innerHTML = "";

    if (!demandes || demandes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty">Aucune demande à afficher</td></tr>`;
        return;
    }

    demandes.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${d.reference}</strong></td>
            <td>${d.npi}</td>
            <td>${LIBELLES_ACTE[d.typeActe] || d.typeActe}</td>
            <td>${d.nombreCopies}</td>
            <td><span class="badge badge-${d.statut}">${LIBELLES_STATUT[d.statut] || d.statut}</span></td>
            <td>${formaterDate(d.dateCreation)}</td>
            <td>${d.motifRejet ? `<span class="motif-rejet">${d.motifRejet}</span>` : "—"}</td>
            <td>${construireActions(d)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================
// Construire les actions selon le statut
// ============================================
function construireActions(d) {
    // Une demande validée ou rejetée ne change plus
    if (d.statut === "VALIDEE" || d.statut === "REJETEE") {
        return `<span style="color:#999;font-size:0.8rem;">Clôturée</span>`;
    }

    // DEPOSEE → peut passer à EN_COURS_TRAITEMENT
    if (d.statut === "DEPOSEE") {
        return `<button class="btn-primary btn-small" onclick="avancer(${d.id}, 'EN_COURS_TRAITEMENT')">
                    ▶️ Mettre en cours
                </button>`;
    }

    // EN_COURS_TRAITEMENT → peut être VALIDEE ou REJETEE
    if (d.statut === "EN_COURS_TRAITEMENT") {
        return `
            <div class="actions">
                <button class="btn-success btn-small" onclick="avancer(${d.id}, 'VALIDEE')">
                    ✅ Valider
                </button>
                <button class="btn-danger btn-small" onclick="rejeter(${d.id})">
                    ❌ Rejeter
                </button>
            </div>`;
    }

    return "—";
}

// ============================================
// Faire avancer une demande (PUT)
// ============================================
async function avancer(id, nouveauStatut) {
    try {
        const response = await fetch(`${API_URL}/${id}/avancer?statut=${nouveauStatut}`, {
            method: "PUT"
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.erreur || "Erreur HTTP " + response.status);
        }

        afficherMessage(`✅ Demande mise à jour : ${LIBELLES_STATUT[nouveauStatut]}`);
        rafraichirVue();
    } catch (err) {
        afficherMessage("❌ " + err.message, "error");
    }
}

// ============================================
// Rejeter une demande (motif obligatoire)
// ============================================
async function rejeter(id) {
    const motif = prompt("Motif du rejet (obligatoire) :");
    if (motif === null) return; // annulé

    if (!motif.trim()) {
        afficherMessage("⚠️ Un rejet doit obligatoirement être motivé", "error");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/${id}/avancer?statut=REJETEE&motifRejet=${encodeURIComponent(motif)}`,
            { method: "PUT" }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.erreur || "Erreur HTTP " + response.status);
        }

        afficherMessage("✅ Demande rejetée avec motif");
        rafraichirVue();
    } catch (err) {
        afficherMessage("❌ " + err.message, "error");
    }
}

// ============================================
// Déposer une nouvelle demande (POST)
// ============================================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const npi = document.getElementById("npi").value.trim();
    const typeActe = document.getElementById("typeActe").value;
    const nombreCopies = parseInt(document.getElementById("nombreCopies").value, 10);

    // Validations côté client
    if (!/^\d{10}$/.test(npi)) {
        afficherMessage("⚠️ Le NPI doit contenir exactement 10 chiffres", "error");
        return;
    }
    if (!typeActe) {
        afficherMessage("⚠️ Veuillez choisir un type d'acte", "error");
        return;
    }
    if (nombreCopies < 1 || nombreCopies > 5) {
        afficherMessage("⚠️ Le nombre de copies doit être entre 1 et 5", "error");
        return;
    }

    const nouvelleDemande = { npi, typeActe, nombreCopies };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nouvelleDemande)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            // Gestion des erreurs de validation Spring
            if (err.erreurs) {
                const details = Object.values(err.erreurs).join(" • ");
                throw new Error(details);
            }
            throw new Error(err.erreur || "Erreur HTTP " + response.status);
        }

        const created = await response.json();
        afficherMessage(`✅ Demande ${created.reference} déposée avec succès !`);
        form.reset();
        document.getElementById("nombreCopies").value = 1;
        rafraichirVue();
    } catch (err) {
        afficherMessage("❌ " + err.message, "error");
        console.error(err);
    }
});

// ============================================
// Statistiques par statut (bonus)
// ============================================
async function chargerStatistiques() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        if (!response.ok) throw new Error("Erreur HTTP " + response.status);
        const stats = await response.json();

        document.getElementById("stat-DEPOSEE").textContent            = stats.DEPOSEE || 0;
        document.getElementById("stat-EN_COURS_TRAITEMENT").textContent = stats.EN_COURS_TRAITEMENT || 0;
        document.getElementById("stat-VALIDEE").textContent            = stats.VALIDEE || 0;
        document.getElementById("stat-REJETEE").textContent            = stats.REJETEE || 0;
    } catch (err) {
        console.error("Erreur stats :", err);
    }
}

// ============================================
// Rafraîchir la vue
// ============================================
function rafraichirVue() {
    const npi = rechercheNpi.value.trim();
    if (npi && /^\d{10}$/.test(npi)) {
        chargerDemandesParUsager();
    } else {
        chargerToutesLesDemandes();
    }
    chargerStatistiques();
}

// ============================================
// Événements
// ============================================
btnRechercher.addEventListener("click", chargerDemandesParUsager);
btnTout.addEventListener("click", () => {
    rechercheNpi.value = "";
    filtreStatut.value = "";
    chargerToutesLesDemandes();
});

rechercheNpi.addEventListener("keypress", (e) => {
    if (e.key === "Enter") chargerDemandesParUsager();
});

filtreStatut.addEventListener("change", () => {
    if (rechercheNpi.value.trim()) chargerDemandesParUsager();
});

// ============================================
// Démarrage
// ============================================
chargerToutesLesDemandes();
chargerStatistiques();