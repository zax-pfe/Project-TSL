# Guide du projet

## Objectif et méthode d'accompagnement

Ce jeu est un projet d'apprentissage en JavaScript vanilla et en TSL (Three.js Shading Language), avec Three.js, WebGPU et Vite.

Le joueur se déplace sur une dalle pour éviter des lasers qui traversent le terrain. Chaque laser émet un signal lumineux avant de devenir dangereux : le joueur doit pouvoir anticiper son activation. Une collision avec un faisceau actif provoquera, pour le premier prototype, la fin de la partie.

Accompagner la réalisation progressivement : expliquer les concepts, proposer une petite étape concrète, puis vérifier son comportement avant de passer à la suivante. Ne pas livrer toute l'implémentation d'un coup sans demande. Privilégier des classes simples, des modules ES et des noms explicites. Ne pas ajouter de framework ni de bibliothèque de state machine pour ce prototype.

Ce document définit une direction ; les éléments décrits comme futurs ne sont pas encore implémentés. La demande initiale porte uniquement sur ce fichier.

## Point de départ

- `src/script.js` initialise la scène, la caméra, le rendu, le terrain et un laser, puis exécute la boucle d'animation. Il joue le rôle d'expérience et de point d'assemblage.
- `src/Character.js` crée une capsule, mais le personnage n'est pas encore instancié dans `script.js` et ne possède pas de déplacement.
- `src/Ground.js` crée la dalle.
- `src/Laser.js` crée actuellement un cube représentant le canon. Le faisceau, l'avertissement et les collisions restent à construire.
- `src/Explosions.js` contient un effet TSL dont l'instanciation est commentée dans `script.js`.

Conserver ce découpage. Une classe `Experience` séparée n'est pas nécessaire pour commencer.

## Répartition des responsabilités

| Élément | Responsabilité visée |
| --- | --- |
| `script.js` | Créer les instances, relier les objets, gérer les entrées et coordonner les mises à jour et les collisions. |
| `Character` | Déplacement, position et forme de collision du joueur. |
| `Ground` | Apparence du terrain et limites de déplacement. |
| `Laser` | Canon, faisceau, avertissement lumineux, durées et état dangereux. |
| `Explosions` | Effet visuel déclenché lors d'un impact, dans une étape ultérieure. |
| Futur `StateMachine.js` | Gérer l'état courant et les transitions, sans connaître Three.js ni les règles du jeu. |

## Une state machine simple

Une state machine représente un objet qui possède un seul état courant parmi plusieurs états possibles. Une transition remplace cet état par un autre. Chaque état peut définir trois fonctions :

- `enter()` : exécutée une fois à l'entrée, par exemple pour afficher un faisceau.
- `update(deltaTime)` : exécutée à chaque frame, par exemple pour compter le temps écoulé.
- `exit()` : exécutée une fois à la sortie, par exemple pour masquer un faisceau.

Contrat proposé pour la future classe :

- `constructor(states)` reçoit un dictionnaire de définitions d'états.
- `changeState(name)` vérifie que l'état existe, appelle `exit()` sur l'ancien état, sélectionne le nouveau, puis appelle son `enter()`.
- `update(deltaTime)` appelle le `update()` de l'état courant s'il existe.
- `currentStateName` permet de lire l'état courant pour comprendre et déboguer le comportement.

Les trois fonctions d'un état sont optionnelles. Une transition vers l'état déjà courant ne fait rien. L'état initial est activé explicitement après la création de la machine. Signaler clairement un nom d'état inconnu. Éviter les transitions en cascade dans `enter()` pour ce premier exercice.

### Faut-il passer tous les objets à la machine ?

Non. La machine générique ne reçoit que ses états. Les fonctions de ces états peuvent accéder aux objets nécessaires grâce à leur portée JavaScript, sans que la machine connaisse ces objets.

Par exemple, les états définis dans une instance de `Laser` utiliseront des fonctions fléchées pour accéder à `this` : leur `enter()` pourra modifier le matériau de ce laser. Les états de la partie définis dans `script.js` pourront accéder au personnage et au tableau de lasers créés dans ce fichier.

Cette approche évite un constructeur comme `StateMachine(character, ground, lasers, explosions, scene, ...)`. Un objet de contexte explicite pourra être introduit plus tard si les états sont déplacés dans d'autres fichiers, avec uniquement les dépendances nécessaires.

## Deux niveaux, à introduire progressivement

### D'abord : le cycle d'un laser

Chaque laser possède sa propre instance de `StateMachine`. Commencer avec un seul laser, puis réutiliser cette classe pour plusieurs lasers avec des durées ou des décalages différents.

Cycle proposé : `idle → warning → active → cooldown → idle`.

| État | Apparence | Dangereux | Transition |
| --- | --- | --- | --- |
| `idle` | Faisceau masqué, canon au repos | Non | Après le délai d'attente |
| `warning` | Signal lumineux lisible annonçant la trajectoire | Non | Après la durée d'avertissement |
| `active` | Faisceau visible | Oui | Après la durée de tir |
| `cooldown` | Faisceau masqué, retour au repos | Non | Après la durée de récupération |

Le délai `idle` sert à espacer ou décaler les tirs ; `cooldown` représente la récupération après un tir. Si ces deux phases n'ont pas de différence utile dans le prototype, elles peuvent être fusionnées.

Remettre le compteur de l'état à zéro dans `enter()`, puis ajouter `deltaTime` dans `update()`. Exprimer toutes les durées en secondes. Éviter les `setTimeout` pour le cycle de jeu : un compteur mis à jour dans la boucle sera plus facile à arrêter et à réinitialiser.

Exposer une propriété calculée `isDangerous`, vraie uniquement lorsque l'état est `active`, pour éviter deux sources de vérité. La visibilité seule ne doit pas déterminer les dégâts.

### Ensuite : l'état de la partie

Introduire une seconde instance de la même classe dans `script.js` lorsque le déplacement et un cycle de laser fonctionnent :

`ready → playing → gameOver`, puis `gameOver → ready` lors d'un redémarrage.

- `ready` : remettre le personnage à sa position initiale et réinitialiser les lasers ; attendre une action de démarrage.
- `playing` : autoriser le déplacement, faire avancer les lasers et vérifier les collisions.
- `gameOver` : arrêter les mises à jour de gameplay et afficher le résultat ; conserver le rendu de la scène.

Le terrain n'a pas besoin de sa propre machine tant qu'il ne possède pas de comportements distincts. Il peut changer de couleur à l'entrée d'un état de partie via une méthode simple. Ne pas créer une machine pour chaque classe par principe.

## Boucle d'animation et lien avec TSL

Conserver une seule boucle dans `script.js`, celle de `renderer.setAnimationLoop(tick)`. Calculer une seule fois le temps écoulé depuis la frame précédente, en secondes, puis transmettre ce `deltaTime` aux mises à jour.

Pendant `playing`, suivre cet ordre : déplacement du personnage, mise à jour des lasers, vérification des collisions. Mettre ensuite à jour les contrôles de caméra et rendre la scène, quel que soit l'état de la partie. Chaque objet doit être mis à jour une seule fois par frame.

Prévoir un traitement du retour d'un onglet masqué pour éviter un grand saut temporel qui escamoterait l'avertissement : pause ou limitation du delta pour ce prototype.

La logique de jeu et les transitions restent en JavaScript. TSL gère l'apparence : pulsation d'avertissement, couleur, intensité, animation du faisceau. Les états pilotent des uniforms détenus par `Laser`, sans reconstruire le matériau à chaque frame. Le temps visuel TSL ne doit pas servir de compteur de référence pour les dégâts ; il peut continuer d'animer un effet alors que le gameplay est arrêté.

Un matériau émissif et le bloom peuvent suffire à rendre l'avertissement visible. Si le signal doit réellement éclairer la dalle, prévoir une lumière dédiée : l'émission du matériau seule ne remplace pas cet éclairage.

## Première approche des collisions

Commencer avec des lasers horizontaux dont la hauteur traverse le personnage, et un joueur se déplaçant uniquement sur le plan XZ. Dans ce cadre, représenter le joueur par un disque et chaque faisceau par un segment doté d'une épaisseur.

Il y a collision si la distance entre le centre du disque et le point le plus proche du segment est inférieure ou égale au rayon du joueur plus le demi-diamètre du faisceau. Utiliser des coordonnées monde cohérentes pour le segment et le joueur. Si des lasers passent ensuite au-dessus ou au-dessous du personnage, ajouter une vérification verticale ou passer à une collision 3D.

Vérifier cette collision uniquement pendant `playing`, pour les lasers dont `isDangerous` est vrai. Au premier impact, passer à `gameOver` et arrêter la recherche d'autres impacts pour cette frame. Les effets visuels ne doivent pas décider de la collision.

Ce test discret convient à un premier prototype lent ; à grande vitesse, il faudra traiter le déplacement entre deux frames pour éviter de traverser un faisceau sans détection.

## Progression pédagogique et vérifications

1. Instancier le personnage, définir sa hauteur sur la dalle, implémenter le déplacement et les limites du terrain. Vérifier les quatre directions et les bords.
2. Écrire la petite classe `StateMachine` et comprendre l'ordre `exit → enter`, puis les appels à `update`.
3. Brancher un laser avec ses états et des changements visuels simples. Vérifier que chaque entrée d'état n'est appelée qu'une fois par transition.
4. Ajouter un avertissement TSL bien lisible et un faisceau. Vérifier que la trajectoire annoncée correspond à celle du tir et que l'avertissement laisse le temps de réagir.
5. Ajouter la collision d'un laser actif. Vérifier les cas : joueur éloigné, au centre du faisceau, à sa limite, et sur la trajectoire pendant `warning` sans dégâts.
6. Ajouter les états de partie et le redémarrage. Vérifier qu'un impact termine une seule fois la partie et que les compteurs, positions et visuels repartent correctement.
7. Multiplier les lasers et décaler leurs cycles, puis améliorer les effets et la difficulté. Préserver des possibilités d'esquive.

Pour chaque étape, expliquer le rôle du code et proposer une vérification visible dans le navigateur. Exécuter `npm run build` après une modification de code pertinente ; ce contrôle ne remplace pas l'observation du rendu WebGPU et du gameplay. Pour une simple modification de ce document, une relecture suffit.
