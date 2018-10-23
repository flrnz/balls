import { Path, Point } from "paper";

interface IEnemyArguments {
    minSpeed?:number,
    maxSpeed?:number,
    minRadius?:number,
    maxRadius?:number
    angleRandomFactor?:number,
}

export class EnemyCircle {
    speed:{
        curr:number,
        min:number,
        max:number,
    }

    radius:{
        curr:number,
        min:number,
        max:number,
    }


    angleRandomFactor:number
    gameRef:any
    spawnPoint:Point
    movementVector:Point
    paperObj:Path.Circle

    constructor(gameRef:any, args:IEnemyArguments) {
        this.gameRef = gameRef;

        this.speed = {
            min: args.minSpeed || this.gameRef.boundRadius/500,
            max: args.maxSpeed || this.gameRef.boundRadius/150,
            curr: args.minSpeed || this.gameRef.boundRadius/500
        }

        this.radius = {
            min: args.minRadius || this.gameRef.boundRadius/9,
            max: args.maxRadius || this.gameRef.boundRadius/3,
            curr: args.minRadius || this.gameRef.boundRadius/9
        }

        this.angleRandomFactor = args.angleRandomFactor || 30;

        this.spawn();
    }

    spawn() {
        this.spawnPoint = this.randomizeSpawnPoint(this.gameRef.boundRadius);

        this.paperObj = new Path.Circle(this.spawnPoint, this.radius.curr);
        
        this.paperObj.style = {
            fillColor: "black",
            strokeColor: "black",
            strokeWidth: 2
        };

        this.movementVector = new Point(1,1);
        this.movementVector.angle = 90;

        this.randomizeSpeed();
    }

    onFrame() {
        this.checkIfOutOfBounds(this.gameRef.enemyBound);

        this.paperObj.position.x += this.movementVector.x / this.gameRef.enemySlowdownFactor;
        this.paperObj.position.y += this.movementVector.y / this.gameRef.enemySlowdownFactor;
    }

    private checkIfOutOfBounds(boundCircle:Path) {
        if (!boundCircle.contains(this.paperObj.position)) {
            this.onOutOfBounds(); 
        }
    }

    private randomizeSpawnPoint(distFromCenter:number) {
        let offsetFromCenter = new Point(0,0);
        offsetFromCenter.angle = Math.random()*360;
        offsetFromCenter.length = distFromCenter;

        let spawnPoint = new Point(this.gameRef.center.x + offsetFromCenter.x, this.gameRef.center.y + offsetFromCenter.y);
        
        return spawnPoint;
    }

    private randomizeSpeed() {
        this.speed.curr = this.speed.min + Math.random()*(this.speed.max-this.speed.min);
        this.movementVector.length = this.speed.curr;
    }

    private randomizeRadius() {
        const oldRadius = this.paperObj.bounds.width/2
        this.radius.curr = this.radius.min + Math.random()*(this.radius.max-this.radius.min);
 
        this.paperObj.scale(this.radius.curr/oldRadius);
    }

    private aimAtPlayer() {
        const offsetToPlayer = new Point(this.gameRef.player.paperObj.position.x - this.paperObj.position.x, this.gameRef.player.paperObj.position.y - this.paperObj.position.y);
        this.movementVector.angle = offsetToPlayer.angle + Math.random()*this.angleRandomFactor*2 - Math.random()*this.angleRandomFactor;
    }

    private aimAtCenter() {
        const offsetToCenter = new Point(this.gameRef.center.x - this.paperObj.position.x, this.gameRef.center.y - this.paperObj.position.y);
        this.movementVector.angle = offsetToCenter.angle + Math.random()*this.angleRandomFactor*2 - Math.random()*this.angleRandomFactor;
    }

    private onOutOfBounds() {
        if (!this.gameRef.lost) {
            this.aimAtPlayer();
        } else {
            this.aimAtCenter();
        }
        
        this.randomizeRadius();
        this.randomizeSpeed();
    }
}