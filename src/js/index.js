window.Urso = { Core: {} };

require('./config/load.js');
Urso.config = require('./config/main.js');
Urso.Core.App = require('./app.js');

//function to run game with engine
Urso.runGame = (new Urso.Core.App()).setup;
