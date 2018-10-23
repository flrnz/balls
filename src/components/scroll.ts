import { Point } from "paper";

export class ScrollService {
    gameRef:any;

    constructor(gameRef:any) {
        this.gameRef = gameRef;
    }

    onFrame() {
        const viewCenter = this.gameRef.view.center;
    
        const viewDistanceFromCenter = new Point(this.gameRef.center.x - viewCenter.x, this.gameRef.center.y - viewCenter.y).length;
        const mouseDistanceFromCenter = new Point(this.gameRef.center.x - this.gameRef.mousePos.x, this.gameRef.center.y - this.gameRef.mousePos.y).length;
    
        //console.log(mouseDistanceFromCenter);
        //abort if we are already too far away from the center
        if (viewDistanceFromCenter > this.gameRef.boundRadius*1 && mouseDistanceFromCenter > viewDistanceFromCenter) {
            return;
        }
    
        const mouseOffsetX = this.gameRef.mousePos.x - viewCenter.x;
        const mouseOffsetY = this.gameRef.mousePos.y - viewCenter.y;
        
        let scrollX = 0;
        let scrollY = 0;
    
    
        if (mouseOffsetX > this.gameRef.scrollThreshold.w) {
            scrollX = (mouseOffsetX - this.gameRef.scrollThreshold.w)/(this.gameRef.scrollArea.w/this.gameRef.maxScrollSpeed.x);
        } else if (this.gameRef.mousePos.x < viewCenter.x - this.gameRef.scrollThreshold.w) {
            scrollX = (mouseOffsetX + this.gameRef.scrollThreshold.w)/(this.gameRef.scrollArea.w/this.gameRef.maxScrollSpeed.x);
        }
    
        if (mouseOffsetY > this.gameRef.scrollThreshold.h) {
            scrollY = (mouseOffsetY - this.gameRef.scrollThreshold.h)/(this.gameRef.scrollArea.h/this.gameRef.maxScrollSpeed.y);
        } else if (this.gameRef.mousePos.y < viewCenter.y - this.gameRef.scrollThreshold.h) {
            scrollY = (mouseOffsetY + this.gameRef.scrollThreshold.h)/(this.gameRef.scrollArea.h/this.gameRef.maxScrollSpeed.y);
        }
    
        this.gameRef.view.scrollBy(new Point(scrollX, scrollY));
    
        this.gameRef.mousePos.x += scrollX;
        this.gameRef.mousePos.y += scrollY;
    }
}