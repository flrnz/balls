import './index.css'; 
import { Path, Point, PaperScope, view } from 'paper';

import { Game } from './components/game';


window.addEventListener('DOMContentLoaded', () => {
    const pScope = new PaperScope();
    
    pScope.install(window);
    pScope.setup('myCanvas');
    
    let g = new Game(pScope);
    g.initialize();
    console.log(g);
});

