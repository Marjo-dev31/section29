const path = require('path');

const express = require('express');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session');

const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const MongoDBStore = mongoDbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  uri: 'mongodb://localhost:27017',
  databaseName: 'auth-demo',
  collection: 'sessions',
}); /*permet de creer la db et la collection pour stocker la session*/

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'super-secret',
  resave: false, /*permet de garder en memoire la session et de pas en recreer une a chaque requete */
  saveUninitialized: false, /* sauvegarde in database seulement une fois qu'il y a des data */
  store: sessionStore, /* permet de creer le chemin vers la collection sessions*/
  /*cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 (se calcule toujours en milliseconde donc jour*heure*min*seconde*milliseconde = 30jours) -> exemple de session qui expire au bout d un mois
    si pas de precision pas d'expiration sauf si le browser delete the sessions cookies lorsqu il shutdown
  }*/
}));

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
