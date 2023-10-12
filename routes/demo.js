const express = require('express');
const bcrypt = require('bcryptjs');

const db = require('../data/database');

const router = express.Router();

router.get('/', function (req, res) {
  res.render('welcome');
});

router.get('/signup', function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: '',
      confirmEmail: '',
      password: ''
    };
  }

  req.session.inputData = null;

  res.render('signup', { inputData: sessionInputData });
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
    enteredPassword.trim().length < 6 || /*trim efface les blancs*/
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes('@')
  ) {
    console.log('Incorrect data');

    req.session.inputData = {
      hasError: true,
      message: 'Invalid input - Please check your data.',
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword
    };

    req.session.save(function () {
      res.redirect('/signup');
    });

    return;
  };

  const existingUser = await db.getDb().collection('users').findOne({ email: enteredEmail });

  console.log(existingUser)

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
    res.redirect('/profile');
  });
});

router.get('/admin', async function (req, res) {
  if (!req.session.isAuthenticated) /* = if isA is faulse*/ {
    return res.status(401).render('401');
  };

  const user =  await db.getDb().collection('users').findOne({_id: req.session.user.id});
  if ( !user || !user.isAdmin) {
   return res.status(403).render('403');
  };

  res.render('admin');
});

router.get('/profile', function (req, res) {
  if (!req.session.isAuthenticated) /* = if isA is faulse*/ {
    return res.status(401).render('401');
  }
  res.render('profile');
});

router.post('/logout', function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect('/');
});

module.exports = router;
