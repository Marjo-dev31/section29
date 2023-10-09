const express = require('express');
const bcrypt = require('bcryptjs');

const db = require('../data/database');

const router = express.Router();

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  res.render('signup');
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/signup', async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData['confirm-email']; /*id car n'est pas dans la bdd*/
  const enteredPassword = userData.password;

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim() < 6 || /*trim efface les blancs*/
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes('@')
  ) {
    console.log('Incorrect data');
    return res.redirect('/signup');
  };

  const existingUser = await db.getDb().collection('users').findOne({ email: enteredEmail });

  if (existingUser) {
    console.log('User already exist!');
    return res.redirect('/signup');
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12); /*crypte en 12 caractères*/

  const user = {
    email: enteredEmail,
    password: hashedPassword,
  };

  await db.getDb().collection('users').insertOne(user);
  res.redirect('/login');
});

router.post('/login', async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db.getDb().collection('users').findOne({ email: enteredEmail });

  if (!existingUser) {
    console.log('Could not log in!');
    return res.redirect('/login');
  }

  const passwordsAreEgal = await bcrypt.compare(enteredPassword, existingUser.password); /*compar en decryptant*/


  if (!passwordsAreEgal) {
    console.log('Could not log on - passwords are not egal!');
    return res.redirect('/login');
  }

  req.session.user = { id: existingUser._id, email: existingUser.email }; /* creer les datas a stocker, express-session va les stocker automatiquement dans la db/collection*/
  req.session.isAuthenticated = true;
  req.session.save(function () { /*function cb qui permet d attendre que les data soient stocker avant de redirect*/
    res.redirect('/admin');
  });
});

router.get('/admin', function (req, res) {
  if (!req.session.isAuthenticated) /* = if isA is faulse*/ {
    return res.status(401).render('401');
  }
  res.render('admin');
});

router.post('/logout', function (req, res) { });

module.exports = router;
