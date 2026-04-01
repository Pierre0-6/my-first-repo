// Différentes étapes du projet 
// J'ai demandé à l'IA de réaliser les filtres dynamiques : d'abord le calendrier, puis le prix, puis le genre, puis le théâtre puis le "dernière minute"
// Prompt : Donne moi le code js script permettant de réaliser ce filtre (photo) de manière dynamique 
// Résultat : Toutes les réponses obtenues fonctionnaient correctement, mais les filtres fonctionnaient indépendamment mais pas ensemble (cad si on filtrait sur catégorie après le prix on obtenait la catégorie pour tous les prix).
// Cela venait du fait que j'ai ajouté les morceaux de codes independamment sans structure. 
// J'ai donc pris les différentes parties du code et demandé de faire en sorte que les filtres fonctionnent ensemble, j'ai obtenu la structure ci dessous et fonctionnelle
// J'ai également du corriger certaine partie comme le nom des catégories exactes pour aller les chercher dans le dataset 
// J'ai également changé le html et mis certaines parties en commentaire pour les générer ensuite automatiquement 












console.log("hello world"); //affiche un message dans la console du navigateur 

// const = permet de creer une variable qui ne changera pas 
const myUrl = "https://makerslab.em-lyon.com/dww/data/shows.json";// dataset en json contenant toutes les pièces  

const getData = async (doStuffs) => {
    try {
        const response = await fetch(myUrl); //récupération des données
        if (!response.ok) throw new Error("Network response not ok: " + response.statusText);
        const data = await response.json(); // Convertir les données reçues en JSON
        doStuffs(data);
    } catch (error) {
        console.error("Problem occurred while getting your data: " + error);
    }
};

getData((data) => {
    console.log(data);

    const container = document.querySelector(".spectacles"); // sélectionne l’élément HTML ayant la classe spectacles
    container.innerHTML = ""; // vide le contenu du conteneur.

    const categories = data.categories; // liste des types de spectacles.
    const allTheatres = new Set(); //Un Set est comme un tableau, mais sans doublons.Chaque fois qu’on voit un nouveau théâtre on l’ajoute.

    //Etablir la référence du calendrier 
    const CALENDAR_YEAR = 2022; // Année choisie 2022
    const CALENDAR_MONTH = 2; // 0=jan, 1=fev, 2=mars, Mois choisi mars 


    let selectedDay = null; // Pas de jour séléctionné, mais pourra être modifié plus tard si on clique sur un jour du calendrier

    categories.forEach(categoryName => { //Parcours des catégories du JSON
        const shows = data[categoryName]; //Récupération des spectacles de la catégorie
        shows.forEach(show => { //Parcours des spectacles
            allTheatres.add(show.location);//Ajout du théâtre dans la liste

            const card = document.createElement("div"); //Création d’une carte HTML pour un spectacle
            
            
            // Stockage de données dans les attributs HTML
            card.classList.add("card");
            card.dataset.category = categoryName;
            card.dataset.theatre = show.location;
            card.dataset.dateFrom = show.dates?.from || "";
            card.dataset.dateTo = show.dates?.to || "";
            


            // Contenu HTML de la carte
            card.innerHTML = `
                <img src="${show.image}" alt="${show.title}">
                <div class="info">
                    <h3>${show.title}</h3>
                    <p class="theatre"><strong>${show.location}</strong></p>
                    <p>Catégorie : ${categoryName}</p>
                    <p class="description">${show.description}</p>
                    <p>⭐ ⭐ ⭐ ⭐ ⭐ (${show.reviews} avis)</p>
                    <p class="price">$${show.price} (${show.tickets_remaining} tickets restants)</p>
                </div>
            `;
            container.appendChild(card); // Ajout de la carte dans le conteneur
        });
    });

    //  Génération du menu déroulant (select) pour les théâtres
    const theatreSelect = document.querySelector(".theatre-select"); // Sélection du select en HTML
    theatreSelect.innerHTML = `<option value="">Tous</option>`; // On met l’option “Tous”
    Array.from(allTheatres).sort().forEach(theatre => { //On transforme le Set des théâtres en liste triée
        const option = document.createElement("option");
        option.value = theatre;
        option.textContent = theatre;
        theatreSelect.appendChild(option);
    });

    // ---- Fonction centrale de filtrage ---- C’est la fonction qui va afficher ou cacher les cartes selon les filtres choisis.
    const applyFilters = () => {
        const selectedCategory = document.querySelector(".category-select").value; // Récupération des filtres sélectionnés
        const selectedTheatre = document.querySelector(".theatre-select").value;  // Sélectionne l’élément HTML qui possède la classe .theatre-select
        const priceSlider = document.querySelector(".price-filter input[type='range']"); //  Sélectionne l’élément <input type="range"> qui se trouve à l’intérieur d’un élément ayant la classe .price-filter.
        const maxPrice = parseFloat(priceSlider.value); // Récupère la valeur actuelle du slider
        const lastMinuteActive = document.querySelector(".last-minute").classList.contains("active"); //Sélectionne l’élément HTML ayant la classe .last-minute

        // Calculer les 5 spectacles avec la durée la plus longue
        let top5Cards = new Set(); // Crée un ensemble vide pour stocker les 5 cartes sélectionnées sans doublons
        if (lastMinuteActive) { // Exécute le filtrage spécial uniquement si le mode "last minute" est activé
            const allCards = document.querySelectorAll(".spectacles .card"); // Récupère toutes les cartes de spectacles affichées
            const withDuration = Array.from(allCards).map(card => {  // Transforme la liste des cartes en tableau puis calcule la durée de chaque spectacle
                const from = new Date(card.dataset.dateFrom); // Convertit la date de début en objet Date
                const to = new Date(card.dataset.dateTo); // Convertit la date de fin en objet Date
                const duration = to - from; // Calcule la durée en millisecondes entre les deux dates
                return { card, duration }; // Retourne un objet contenant la carte et sa durée
            }).filter(item => !isNaN(item.duration));  // Ne garde que les éléments dont la durée est valide (pas NaN)

            withDuration
                .sort((a, b) => b.duration - a.duration) // Trie les spectacles par durée décroissante (du plus long au plus court)
                .slice(0, 5) // Prend seulement les 5 premiers après le tri (les 5 plus longs)
                .forEach(item => top5Cards.add(item.card)); // Ajoute les 5 cartes sélectionnées dans l'ensemble top5Cards
        }

        const cards = document.querySelectorAll(".spectacles .card");// Sélectionne toutes les cartes de spectacles 
        cards.forEach(card => { // Parcourt chaque carte une par une
            const cardCategory = card.dataset.category; // Récupère la catégorie stockée dans l'attribut data-category de la carte
            const cardTheatre = card.dataset.theatre; // Récupère le théâtre stocké dans l'attribut data-theatre de la carte
            const priceText = card.querySelector(".price").textContent; // Extrait le texte brut du prix affiché dans l'élément .price
            const cardPrice = parseFloat(priceText.replace(/[^0-9.]/g, "")); // Convertit le texte du prix en nombre flottant en supprimant les caractères non numériques

            const matchCategory = selectedCategory === "" || cardCategory === selectedCategory; // Vérifie si la carte correspond au filtre catégorie (ou si aucun filtre n'est actif)
            const matchTheatre = selectedTheatre === "" || cardTheatre === selectedTheatre; // Vérifie si la carte correspond au filtre théâtre (ou si aucun filtre n'est actif)
            const matchPrice = cardPrice <= maxPrice;  // Vérifie si le prix de la carte est dans la limite du prix maximum sélectionné
            const matchLastMinute = !lastMinuteActive || top5Cards.has(card); // Vérifie si le filtre "last minute" est inactif ou si la carte fait partie du top 5

            //  Filtre calendrier
            let matchDay = true; // Par défaut, la carte passe le filtre jour
            if (selectedDay !== null) { // Applique le filtre seulement si un jour est sélectionné
                const from = new Date(card.dataset.dateFrom); // Crée un objet Date à partir de la date de début stockée dans la carte
                const to = new Date(card.dataset.dateTo); // Crée un objet Date à partir de la date de fin stockée dans la carte
                const clickedDate = new Date(CALENDAR_YEAR, CALENDAR_MONTH, selectedDay); // Crée la date correspondant au jour cliqué dans le calendrier


                from.setHours(0, 0, 0, 0); // Normalise la date de début à minuit pour une comparaison exacte
                to.setHours(23, 59, 59, 999); // Normalise la date de fin à la dernière milliseconde du jour

                matchDay = !isNaN(from) && !isNaN(to) && clickedDate >= from && clickedDate <= to;  // Vérifie que les dates sont valides et que le jour cliqué est dans la plage
            }

            card.style.display = (matchCategory && matchTheatre && matchPrice && matchLastMinute && matchDay) ? "" : "none"; // Affiche ou masque la carte selon que tous les filtres sont satisfaits
        });
    };

    // Gestion du clic sur le calendrier
    const calendarDays = document.querySelectorAll(".calendar td[data-day]"); // Sélectionne toutes les cellules du calendrier ayant un attribut data-day
    calendarDays.forEach(td => { // Parcourt chaque cellule de jour du calendrier
        td.addEventListener("click", () => { // Ajoute un écouteur de clic sur chaque cellule
            const day = parseInt(td.dataset.day); // Convertit la valeur data-day en entier

            if (selectedDay === day) { // Réinitialise le jour sélectionné si on reclique sur le même
                // Re-clic sur le même jour = désélectionner
                selectedDay = null;
                calendarDays.forEach(el => el.classList.remove("selected"));// Retire la classe "selected" de toutes les cellules
            } else {
                // Nouveau jour sélectionné
                selectedDay = day; // Enregistre le nouveau jour sélectionné
                calendarDays.forEach(el => el.classList.remove("selected")); // Retire la classe "selected" de toutes les cellules
                td.classList.add("selected"); // Ajoute la classe "selected" uniquement sur la cellule cliquée
            }

            applyFilters(); // Relance les filtres pour mettre à jour l'affichage des cartes
        });
    });

    
    theatreSelect.addEventListener("change", applyFilters); // Déclenche applyFilters à chaque changement du sélecteur de théâtre
    document.querySelector(".category-select").addEventListener("change", applyFilters); // Déclenche applyFilters à chaque changement du sélecteur de catégorie

    const priceSlider = document.querySelector(".price-filter input[type='range']"); // Récupère l'input range du filtre de prix
    const maxPriceDisplay = document.getElementById("max-price"); // Récupère l'élément affichant le prix maximum sélectionné
    priceSlider.addEventListener("input", () => { // Écoute les modifications du slider de prix
        if (maxPriceDisplay) maxPriceDisplay.textContent = `${priceSlider.value}€`; // Met à jour l'affichage du prix maximum si l'élément existe
        applyFilters(); // Relance les filtres avec le nouveau prix maximum
    });

    const lastMinuteBtn = document.querySelector(".last-minute"); // Récupère le bouton "last minute"
    lastMinuteBtn.addEventListener("click", () => { // Écoute le clic sur le bouton "last minute"
        lastMinuteBtn.classList.toggle("active"); // Bascule la classe "active" pour activer ou désactiver le filtre
        applyFilters(); // Relance les filtres en tenant compte du nouvel état du bouton
    });
});