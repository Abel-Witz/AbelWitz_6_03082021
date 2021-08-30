# Backend Piiquante
## Installation
1. Vous avez besoin d'installer les dépendances en faisant un ```npm install```

2. Vous devez créer un fichier .env

3. Vous pouvez lancer le serveur avec ```node app```

## Configuration du fichier .env
|Variable|Utilité|Exemple|
|----------------|--------------------|------------
|HOST|L'adresse de l'application|localhost|
|PORT|Le port de l'application|3000|
|FRONTEND_ADRESS|L'adresse ainsi que le port du frontend autorisé à faire des requêtes (renseigné à CORS)|http://127.0.0.1:8081|
|DB_URL|La phrase pour se connecter à votre cluster MongoDB|phraseDeConnexion|
|JWT_SECRET|La phrase secrète utilisée pour chiffrer les tokens d'authentification|yourJwtSecret|
|NODE_ENV|Changer le mode de l'application: "development" ou "production"|development|
