import { Point, Path, PaperScope, View, Layer, PointText } from "paper";
import { IWH, IXY } from "../sharedInterfaces";
import { EnemyCircle } from "./enemy";
import { ScrollService } from "./scroll";



export class Game {
    private scope:PaperScope;

    center:Point;
    view:View
    scrollThreshold:IWH
    maxScrollSpeed:IXY
    scrollArea:IWH
    mousePos:Point
    boundRadius:number
    playerCircleSpeed:number

    paused:boolean
    lost:boolean
    enemySlowdownFactor:number;

    score:number;
    scoreText:PointText
    health: {
        max:number,
        current:number,
        enemyPenalty:number,
        outOfBoundsPenalty:number,
        regen:number,
    }

    gravity:Point

    newEnemyCounter:number;
    dimEnemyBoundCounter:number;
    dimEnemyBoundStop:number;

    scrollService:any;

    player:any
    enemies:any[]

    mouseDown:boolean

    playerBound:Path.Circle
    enemyBound:Path.Circle

    //FIXME: remove?
    layers: {
        boundLayer?:Layer,
        playerLayer?:Layer,
        enemyLayer?:Layer,
    }

    constructor(scope:PaperScope) {
        this.scope = scope;
        this.center = scope.view.center;

        this.view = this.scope.view;

        this.scrollThreshold = {
            w: 0,
            h: 0
        }

        this.maxScrollSpeed = {
            x: 0,
            y: 0
        }

        this.scrollArea = {
            w: 0,
            h: 0
        }

        console.log(this.scope.view);
    };

    onResize() {
        //Scrolling stuff
        this.scrollThreshold.w = ((this.view.bounds.width/2)*0.15);
        this.scrollThreshold.h = ((this.view.bounds.height/2)*0.15);
        this.maxScrollSpeed.x = this.view.bounds.width/120;
        this.maxScrollSpeed.y = this.view.bounds.height/65;
        this.scrollArea.w = (this.view.bounds.width/2 - this.scrollThreshold.w);
        this.scrollArea.h = (this.view.bounds.height/2 - this.scrollThreshold.h);

        //Debug stuff
        this.mousePos = this.scope.view.center;
    }

    initialize() {
        this.onResize();

        this.mouseDown = false;

        //Bound stuff
        this.boundRadius = Math.min(this.view.bounds.width, this.view.bounds.height) / 2.52;
        console.log(this.boundRadius);

        //FIXME: Debug stuff for mobile devices
        // if (this.boundRadius < 350) {
        //     this.boundRadius *= 1.1;
        // }

        //Movement stuff
        this.playerCircleSpeed = 3;

        //Game state stuff
        this.paused = false;
        this.lost = false;
        this.enemySlowdownFactor = 1;

        //Health stuff
        this.health = {
            max: 100,
            current: 100,
            enemyPenalty: 1.5,
            outOfBoundsPenalty: 3,
            regen: 0.01,
        }

        //Score stuff
        this.score = 0;

        //Gravity stuff
        this.gravity = new Point(1, 1);
        this.gravity.length = this.boundRadius/880;
        this.gravity.angle = -90;

        //Difficulty stuff
        this.newEnemyCounter = 0;
        this.dimEnemyBoundCounter = 0;


        //create a bunch of objects
        this.scrollService = new ScrollService(this);

        let background = new Path.Rectangle({
            size: this.view.viewSize,
            fillColor: "black"
        })

        this.enemyBound = new Path.Circle(this.center, this.boundRadius*1.5);
        this.dimEnemyBoundStop = 1;
        (this.enemyBound.fillColor as any) = {
            gradient: {
                stops: [['white', 0], ['black', this.dimEnemyBoundStop]],
                radial: true,
            },
            origin: this.enemyBound.position,
            destination: (this.enemyBound as any).rightCenter
        }

        this.playerBound = new Path.Circle(this.center, this.boundRadius);
        this.playerBound.style = {
            fillColor: "white",
            strokeColor: "black",
            strokeWidth: 2
        };

        this.scoreText = new PointText(new Point(this.center.x, this.center.y + this.boundRadius/1.65/2.9));
        this.scoreText.fillColor = "black";
        this.scoreText.justification = "center";
        this.scoreText.opacity = 0.1;
        this.scoreText.fontSize = this.boundRadius/1.65;
        this.scoreText.fontWeight = "700";
        this.scoreText.fontFamily = "Overpass Mono", "monospace";
        this.scoreText.content = "0";

        this.player = new PlayerCircle(this, {});

        this.player.paperObj.fillColor = "white";
        this.player.paperObj.fillColor.lightness = 1;

        this.enemies = [new EnemyCircle(this, {})];
        
        //MAIN LOOP
        this.view.onFrame = (e) => {
            //If paused
            if (this.paused) {
                return;
            }

            //If lost
            if (this.lost) {
                this.enemySlowdownFactor = Math.min(this.enemySlowdownFactor * 1.03, 30);

                this.enemies.forEach((enemy) => {
                    enemy.paperObj.opacity = Math.max(enemy.paperObj.opacity - 0.0008, 0.1);
                });

                this.scoreText.opacity = Math.min(this.scoreText.opacity + 0.0008, 1);
            } 

            //Default
            else {
                this.onFrameDefault();
            }

            //Always
            this.player.onFrame();

            this.enemies.forEach((e) => {
                e.onFrame();
            });

            //this.scrollService.onFrame();
        }

        this.view.onMouseMove = (e) => {
            this.mousePos = e.point;
        }

        this.view.onMouseUp = () => {
            this.mouseDown = false;
        }

        this.view.onMouseDown = () => {
            this.mouseDown = true;
        }

        this.view.element.addEventListener("contextmenu", (e) => {
            if (!(this.lost || this.paused)) {
                e.preventDefault();
            }
        })

        this.view.element.addEventListener("wheel", (e) => {
            if (e.deltaY < 0) {
                this.view.scale(1.01);
            } else {
                this.view.scale(0.99);
            }
        })

        onkeydown = (e) => {
            if (e.code === "KeyP" || e.code === "Space") {
                this.paused = !this.paused;
            }

            if (e.code === "KeyW") {
                this.view.scale(1.05);
            }

            if (e.code === "KeyS") {
                this.view.scale(0.95);
            }
        }
    }

    onFrameDefault = () => {
        //Score & Counters
        if (this.player.movementVector.length >= 3.5 * (this.boundRadius/450)) {
            this.score += this.player.movementVector.length * (450/this.boundRadius);
            this.newEnemyCounter += this.player.movementVector.length * (450/this.boundRadius);
            this.dimEnemyBoundCounter += this.player.movementVector.length * (450/this.boundRadius);
        }

        if (this.newEnemyCounter > 4000) {
            this.newEnemyCounter = 0;
            this.enemies.push(new EnemyCircle(this, {}));
        }

        if (this.dimEnemyBoundCounter > 100) {
            this.dimEnemyBoundCounter = 0;

            this.dimEnemyBoundStop *= 0.995;

            //console.log(this.score, this.dimEnemyBoundStop);

            (this.enemyBound.fillColor as any) = {
                gradient: {
                    stops: [['white', 0], ['black', this.dimEnemyBoundStop]],
                    radial: true,
                },
                origin: this.enemyBound.position,
                destination: (this.enemyBound as any).rightCenter
            }
        }

        this.scoreText.content = Math.floor(this.score).toString();

        if (this.mouseDown) {
            let vectorToPlayerCircle = new Point(this.mousePos.x - this.player.paperObj.position.x, this.mousePos.y - this.player.paperObj.position.y);

            let acc = new Point(1, 1);
            acc.angle = vectorToPlayerCircle.angle;

            let accL = (this.boundRadius*1.5)/vectorToPlayerCircle.length;
            if (accL < 3) {accL = 0};
            if (accL > 50) {accL = 50};

            acc.length = accL;

            this.player.movementVector = new Point(this.player.movementVector.x + acc.x, this.player.movementVector.y + acc.y);
        }

        this.handleHealth();
    }

    handleHealth() {
        this.health.current = Math.min(this.health.current + this.health.regen, this.health.max);

        if (!this.playerBound.contains(this.player.paperObj.position)) {
            this.health.current -= this.health.outOfBoundsPenalty; 
        }

        if (this.player.insideEnemy()) {
            this.health.current -= this.health.enemyPenalty;
        }

        this.player.paperObj.fillColor.lightness = this.health.current/100;

        if (this.health.current <= 0) {
            this.onNoHealth();
        }
    }

    onNoHealth() {
        this.lost = true;

        let restartThingy = new Path.Circle(new Point(this.center.x, this.center.y + this.boundRadius/1.8), 20);

        restartThingy.fillColor = "white";
        restartThingy.strokeColor = "black";
        restartThingy.strokeWidth = 3;
        
        restartThingy.onMouseDown = () => {
            restartThingy.remove();
            this.newGame();
        }
    }

    newGame() {
        //FIXME: Refactor!
        this.lost = false;
        this.score = 0;
        
        this.enemySlowdownFactor = 1;

        this.health.current = 100;
        this.player.paperObj.fillColor.lightness = this.health.current/100;
        this.player.paperObj.position = this.center;
        this.player.movementVector.length = 0;

        for (let enemy of this.enemies) {
            enemy.paperObj.remove();
        }
        this.enemies = [new EnemyCircle(this, {})];

        this.dimEnemyBoundStop = 1;

        (this.enemyBound.fillColor as any) = {
            gradient: {
                stops: [['white', 0], ['black', this.dimEnemyBoundStop]],
                radial: true,
            },
            origin: this.enemyBound.position,
            destination: (this.enemyBound as any).rightCenter
        }

        this.scoreText.opacity = 0.1;

        this.dimEnemyBoundCounter = 0;
        this.newEnemyCounter = 0;
    }
}


interface IPlayerArguments {
    spawnPoint?:Point,
}

class PlayerCircle {
    spawnPoint:Point
    gameRef:any
    movementVector:Point
    paperObj:Path.Circle

    constructor(gameRef:any, args:IPlayerArguments) {
        this.gameRef = gameRef;
        this.spawnPoint = args.spawnPoint || gameRef.center;
        this.movementVector = new Point(0,0);
        this.movementVector.angle = 0;

        this.paperObj = new Path.Circle(this.spawnPoint, this.gameRef.boundRadius/20) ;
        
        this.paperObj.style = {
            fillColor: "blue",
            strokeColor: "black",
            strokeWidth: 2
        };
    }

    onFrame() {
        this.applyGravity();

        this.movementVector.length *= 0.95;

        this.paperObj.position.x -= this.movementVector.x;
        this.paperObj.position.y -= this.movementVector.y;
    }

    insideEnemy():boolean {
        for (let enemy of this.gameRef.enemies) {
            if (enemy.paperObj.contains(this.paperObj.position)) {
                return true;
            }
        }
        return false;
    }

    private applyGravity() {
        this.movementVector = new Point(this.movementVector.x + this.gameRef.gravity.x, this.movementVector.y + this.gameRef.gravity.y);
    }
}