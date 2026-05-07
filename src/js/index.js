import './config/load.js';
import '../app/config/load.js';

Urso.config = Urso.Core.Config.Main;
Urso.config.extendingChain = ['Urso.Core', 'Urso.App'];

Urso.runGame = (new Urso.Core.App()).setup;
