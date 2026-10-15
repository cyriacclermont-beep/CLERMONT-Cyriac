# CLERMONT-Cyriac

Portfolio personnel d'un apprenti technicien titulaire du **Bac Pro CIEL**
(Cybersécurité, Informatique et réseaux, Électronique).

## Aperçu

- Présentation, compétences, projets, parcours et contact
- **Lab 3D** : baie de serveurs, switch, serveur ouvert, Raspberry Pi et routeur Wi-Fi
  à faire tourner, éclater pièce par pièce et inspecter
- Animations liées au défilement (« hyper motion »), défilement doux, mode clair / sombre
- Version adaptée au téléphone, animations coupées si l'appareil demande moins de mouvement

## Structure

```
.
├── Portofolio/
│   ├── HTML/
│   │   └── index.html   # structure de la page
│   ├── CSS/
│   │   └── style.css    # mise en page, couleurs, animations CSS
│   └── JS/
│       ├── main.js      # thème, texte tapé, particules, défilement, hyper motion
│       └── lab3d.js     # modèles 3D (Three.js), vue éclatée, fenêtre d'inspection
├── README.md
├── LICENSE
└── .gitignore
```

## Lancer le site

Ouvre `Portofolio/HTML/index.html` dans un navigateur (Chrome, Firefox, Edge).
Une connexion internet est nécessaire : les polices et les bibliothèques sont chargées en ligne.
Garde les trois dossiers ensemble : la page va chercher `../CSS/` et `../JS/`.

Pour développer, l'extension **Live Server** de VS Code recharge la page à chaque enregistrement.

## Mettre en ligne avec GitHub Pages

1. Dans **Settings → Pages**, choisis la branche `main` et le dossier `/ (root)`.
2. Le site sera disponible à l'adresse `https://cyriacclermont-beep.github.io/CLERMONT-Cyriac/Portofolio/HTML/`.

## Bibliothèques utilisées

| Bibliothèque | Rôle |
| --- | --- |
| [Three.js r128](https://threejs.org/) | rendu 3D du Lab |
| [GSAP 3.12 + ScrollTrigger](https://gsap.com/) | animations au défilement |
| [Lenis](https://github.com/darkroomengineering/lenis) | défilement doux |
| Google Fonts | Bricolage Grotesque, Manrope, JetBrains Mono |

## À personnaliser

- Projets, parcours (lycée, entreprise) et pourcentages de compétences dans `index.html`
- Liens GitHub, LinkedIn et Root-Me dans la section contact
- Le formulaire de contact est une démo : relie-le à un service comme Formspree pour recevoir les messages

## Licence

Code sous licence MIT : voir [LICENSE](LICENSE).

## Auteur

Cyriac Clermont
