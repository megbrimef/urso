require('./config/load.js');

//main config
Urso.config = Urso.Core.Config.Main;

//function to run game with engine
Urso.runGame = (new Urso.Core.App()).setup;
