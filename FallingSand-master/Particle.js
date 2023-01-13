class Particle extends Placeable {

    static BASE_COLOR = '#FFFFFF';
    static BURNING_COLOR = '#E65C00';

    /**
    * @param {World} world
    */
    constructor(x, y, world) {
        super(x, y, world);

        let c = this.constructor.BASE_COLOR;
        this.color = adjustHSBofString(c, 1, random(0.95, 1.05), random(0.95, 1.05));
        this.originalColor = this.color;

        this.flammability = 0;
        this.fuel = Infinity;
        this.originalFuel = 0;
        this._burning = false;
    }

    /**
    * @param {boolean} b
    */
    set burning(b) {
        if (b) {
            if (!this._burning) {
                this.originalFuel = max(this.originalFuel, this.fuel);
                this.originalColor = this.color;
            }
        }
        else {
            if (this instanceof FluidParticle) {
                this.color = this.originalColor;
            }
            else {
                this.color = adjustHSBofString(
                    this.originalColor, 1, 1, map(this.fuel, 0, this.originalFuel, 0.2, 1));
            }
        }
        this._burning = b;
    }

    get burning() {
        return this._burning;
    }

    update() {
        if (this.burning) {
            this.burn();
        }

        return super.update();
    }

    burn() {
        this.color = this.burningFlickerColor();

        let neighbourList = [
            [0, -1],
            [+1, 0],
            [-1, 0],
            [0, +1],
        ];

        for (let i = 0; i < neighbourList.length; i++) {
            let d = neighbourList[i];
            let xn = this.x + d[0];
            let yn = this.y + d[1];
            let neighbour = this.world.getParticle(xn, yn);
            if (neighbour.flammability > 0 && !neighbour.burning) {
                if (neighbour.flammability * (1 - 0.5 * d[1]) > random()) {
                    neighbour.burning = true;
                }
            }
            else if (!neighbour && this.fuel > 0) {
                if (d[1] < 1
                    && this.world.getParticle(this.x - 1, this.y).burning
                    && this.world.getParticle(this.x + 1, this.y).burning
                ) {
                    this.world.addParticle(
                        new FlameParticle(xn, yn, this.world,
                            random([...Array(this.fuel).keys()]))
                    );
                }
            }
            else if (neighbour instanceof WaterParticle) {
                neighbour.evaporate();
                this.burning = false;
                break;
            }
        }

        this.fuel--;
        if (this.fuel < 0) {
            this.delete();
        }
    }

    burningFlickerColor() {
        return adjustHSBofString(this.constructor.BURNING_COLOR,
            random(0.95, 1.05), random(0.95, 1.05), random(0.95, 1.05));
    }
}


class WallParticle extends Particle {

    static BASE_COLOR = '#626770';

    constructor(x, y, world) {
        super(x, y, world);
    }
}


// class WoodParticle extends Particle {
//     static BASE_COLOR = '#C17736'

//     constructor(x, y, world) {
//         super(x, y, world);
//         this.flammability = 0.1;
//         this.fuel = 200;
//     }
// }


class IndestructibleWallParticle extends WallParticle {

    static BASE_COLOR = '#6C727B';

    // These are the particles used to define the border of the world so I don't
    // have to worry about checking the edges of the array. They are
    // indesctructible so sinks can't destroy them.
    constructor(x, y, world) {
        super(x, y, world);
        this.indestructible = true;
    }
}


// class FlameParticle extends Particle {
//     static BASE_COLOR = '#ff7700'
//     static BURNING_COLOR = '#ff7700'

//     constructor(x, y, world, fuel = 0) {
//         super(x, y, world);
//         this.fuel = fuel;
//         this.burning = true;
//         this.fresh = true;
//         this.color = this.constructor.BASE_COLOR;
//     }

//     update() {
//         // this.color = adjustHSBofString(this.constructor.BASE_COLOR,
//         //     random(0.9, 1.1), random(0.95, 1.05), random(0.5, 1.5));

//         if (!this.fresh) {
//             super.update();
//         }
//         else {
//             this.fresh = false;
//         }

//         if (!this.burning) {
//             this.delete();
//         }
//     }

//     burningFlickerColor() {
//         return adjustHSBofString(this.constructor.BURNING_COLOR,
//             random(0.9, 1.1), random(0.95, 1.05), random(0.5, 1.5));
//     }
// }


class MoveableParticle extends Particle {
    // Parent for particles that can move and displace each other.
    constructor(x, y, world) {
        super(x, y, world);
        this.weight = Infinity;
        this.hasBeenDisplaced = false;
    }

    update() {
        this.hasBeenDisplaced = false;
        super.update();
    }

    tryGridPosition(x, y, trySwap = true) {

        // Do we move up or down in empty space?
        // uses weight to determine
        let rises = this.weight < AIR_WEIGHT;

        let p = this.world.getParticle(x, y);
        // Move to the given position if it's empty.
        if (!p) {
            if (
                // Whether to check if we're heavier than air or air's heavier than us
                // depends on if we move up or down
                (!rises && (this.weight * random() > AIR_WEIGHT))
                ||
                (rises && (AIR_WEIGHT * random() > this.weight))
            ) {
                this.moveToGridPosition(x, y);
                return true;
            }
        }
        // If there's something there maybe displace it as long as it's not the
        // thing that's trying to displace us and it's moveable
        else if (
            trySwap
            && p instanceof MoveableParticle
            && !p.hasBeenDisplaced
        ) {
            // Whether to check if we're heavier than it or it's heavier than us
            // depends on if we move up or down
            if (
                (!rises && (this.weight * random() > p.weight))
                ||
                (rises && (p.weight * random() > this.weight))
            ) {
                this.displaceParticle(p, rises);
                return true;
            }
        }
        // We failed to move to the given grid position
        return false;
    }

    moveToGridPosition(x, y) {
        this.world.moveParticleInGrid(this, x, y);
        this.x = x;
        this.y = y;
    }

    displaceParticle(otherParticle, rises) {
        // Move another particle so we can take its spot
        //if rises is true -1 if not +1
        let dir = (rises) ? -1 : +1;

        // Positions relative to the other particle to try moving it to
        let positionsToTry = [
            [+1, +0],
            [-1, +0],
            [+1, dir],
            [-1, dir]
        ]

        let moved = false;
        for (let i = 0; i < positionsToTry.length; i++) {
            let p = positionsToTry[i];
            // Get the other particle to try the potential grid positions.
            moved = otherParticle.tryGridPosition(
                otherParticle.x + p[0],
                otherParticle.y + p[1],
                false
            );
            if (moved) {
                break;
            }
        }

        let otherX = otherParticle.x;
        let otherY = otherParticle.y;

        if (moved) {
            // If we got the other particle to move, then we can take its spot.
            this.moveToGridPosition(otherX, otherY);
        }
        else {
            // Worst case we put the other particle in our position and then move to
            // its position
            otherParticle.moveToGridPosition(this.x, this.y);
            // this.world.grid[tempX][tempY] = this;
            this.world.moveParticleInGrid(this, otherX, otherY, false);
            this.x = otherX;
            this.y = otherY;
        }

        otherParticle.hasBeenDisplaced = true;
    }
}

class BacteriaParticle extends Particle {
    constructor(x, y, world){
        super(x, y, world);
        //does the bacteria have nutrients to share with the plant?
        let fixation = false;

        this.neighbourList = [
            [0, -1], //up
            [-1, -1], //up left
            [+1, -1], //up right
            [+1, +1], //down right
            [0, +1], //down
            [-1, +1], //down left
            [+1, 0], //right
            [-1, 0] //left
        ]
    }

    update() {
        //choose a random direction
        let d = random(this.neighbourList);

        //get new positions and particle
        let xn = this.x + d[0];
        let yn = this.y + d[1];
        let neighbour = this.world.getParticle(xn, yn);

        if(neighbour instanceof SoilParticle){
            //what is the soil like?
            let soilState = neighbour.state;
            let bacteriaState = this.fixation;
            this.world.addParticle(new BacteriaParticle(xn, yn, this.world), true);
            this.world.addParticle(new SoilParticle(this.x, this.y, this.world), true);
            // let newParticle = this.world.getParticle(this.x, this.y);

            // newParticle.setState('poor');

            // if(bacteriaState == true || soilState == 'healthy'){
            //     this.world.getParticle(xn, yn).fixation = true;
            // }

        }else if(neighbour instanceof PlantParticle || neighbour instanceof RootParticle){
            //transfer nutrients
        }
    }
}

class SandParticle extends MoveableParticle {

    static BASE_COLOR = '#e5b55f';

    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 90;
        this.updateList = [
            [+0, +1],
            [-1, +1],
            [+1, +1]
        ]

        if (random() > 0.5) {
            let temp = this.updateList[1];
            this.updateList[1] = this.updateList[2];
            this.updateList[2] = temp;
        }
    }

    update() {
        let moved = false;
        let i = 0;

        for (let i = 0; i < this.updateList.length; i++) {
            let u = this.updateList[i];
            moved = this.tryGridPosition(this.x + u[0], this.y + u[1]);
            if (moved) {
                super.update();
                return moved;
            }
        }
        super.update();
        return moved;

    }
}

class SoilParticle extends SandParticle {
    static BASE_COLOR = '#755127';

    constructor(x, y, world) {
        super(x, y, world);
        let state;
        let watered;
        this.watered = 0;
        this.color_healthy = this.color;
        this.color_poor = adjustHSBofString(this.color, 0.5, 1, 1);
        this.weight = 50;

        if(random() > 0.5){
            state = 'healthy';
        }else{
            state = 'poor';
        }

        this.setState(state);
    }

    setState(ns){
        this.state = ns;
        if(ns == 'healthy'){
            if(this.watered > 0){
                this.color = adjustHSBofString(this.color_healthy, pow(0.9, this.watered), pow(1.1, this.watered), pow(0.9, this.watered))
            }else{
                this.color = this.color_healthy;
            }
        }else if (random() < 0.5){
            if(this.watered > 0){
                this.color = adjustHSBofString(this.color_poor, pow(0.9, this.watered), pow(1.1, this.watered), pow(0.9, this.watered));
            }else{
                this.color = this.color_poor;
            }
        }
    }

    getWater(){
        return this.watered;
    }

    setWater(nw){
        this.color = adjustHSBofString(this.color, 0.9, 1.1, 0.9);
        this.watered = this.watered + nw;
    }

    update(){
        super.update();
    }
}

class Syn_FertParticle extends SandParticle {
    static BASE_COLOR = '#4f7052';
    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 53;

        this.neighbourList = [
            [+0, +1],
            [-1, +1],
            [+1, +1]
        ]
    }

    update(){
        super.update();
        for(let i = 0; i < this.neighbourList.length; i++) {
            let dn = this.neighbourList[i];
            let xnn = this.x + dn[0];
            let ynn = this.y + dn[1];
            let neighbour = this.world.getParticle(xnn, ynn);

            if(random() < 0.3 && neighbour instanceof SoilParticle){
                if(neighbour.state == 'healthy'){
                    neighbour.setState('poor');
                    this.delete();
                    break;
                }
            }
        }
    }
}

class Org_FertParticle extends SandParticle {
    static BASE_COLOR = '#705d4f';
    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 54;

        this.neighbourList = [
            [+0, +1],
            [-1, +1],
            [+1, +1]
        ]
    }

    update(){
        super.update();
        for(let i = 0; i < this.neighbourList.length; i++) {
            let dn = this.neighbourList[i];
            let xnn = this.x + dn[0];
            let ynn = this.y + dn[1];
            let neighbour = this.world.getParticle(xnn, ynn);

            if(random() < 0.3 && neighbour instanceof SoilParticle){
                if(neighbour.state == 'poor'){
                    neighbour.setState('healthy');
                    this.delete();
                    break;
                }
            }
        }
    }
}

class PlantParticle extends Particle {

    static BASE_COLOR = '#338A1B';

    constructor(x, y, world) {
        super(x, y, world);
        this.color_watered = this.color;
        this.color_dry = adjustHSBofString(this.color, 0.8, 1, 1);
        this.watered = false;
        this.fuel = 35;

        this.neighbourList = [
            [0, -1],
            [-1, -1],
            [+1, -1],

            [+1, +1],
            [0, +1],
            [-1, +1],
            [+1, 0],
            [-1, 0]
        ]
    }

    set watered(w) {
        this._watered = w;
        if (w) {
            this.color = this.color_watered;
            this.flammability = 0.025;
        }
        else {
            this.color = this.color_dry;
            this.flammability = 0.10;
        }
    }

    get watered() {
        return this._watered;
    }

    update() {
        //choose a random direction from the top 3 tiles
        let d;
        if (random() < 0.6) {
            d = this.neighbourList[0];
        } else {
            d = random(this.neighbourList.slice(0, 3));
        }

        //get new positions and particle
        let xn = this.x + d[0];
        let yn = this.y + d[1];
        let neighbour = this.world.getParticle(xn, yn);

        if (this.watered) {
            if (!neighbour || neighbour instanceof SoilParticle) {
                // Check if the empty space I want to grow into doesn't have too
                // many neighbours
                let count = 0;
                for (let i = 0; i < this.neighbourList.length; i++) {
                    let dn = this.neighbourList[i];
                    let xnn = xn + dn[0];
                    let ynn = yn + dn[1];
                    if (this.world.getParticle(xnn, ynn) instanceof PlantParticle) {
                        count++;
                    }
                }
                //if the plant particle has already grown 2 times, don't grow
                if (count < 2) {
                    if (neighbour instanceof SoilParticle) {
                        neighbour.delete();
                    }
                    // If it doesn't, grow into it
                    if (random() > 0.5) {
                        this.world.addParticle(new PlantParticle(xn, yn, this.world));
                        this.watered = false;
                    }
                }
            }
            //if the place you want to grow has a plant particle there
            //give it your watered state
            else if (neighbour instanceof PlantParticle) {
                if (!neighbour.watered) {
                    neighbour.watered = true;
                    this.watered = false;
                }
            }

        }
        else {
            // If we're not watered look for water
            if (neighbour instanceof WaterParticle) {
                // if the random neighbour is water, delete it and we are now watered
                neighbour.delete();
                this.watered = true;
            }
        }

        super.update();
    }
}

class RootParticle extends PlantParticle {

    static BASE_COLOR = '#828051';

    constructor(x, y, world) {
        super(x, y, world);

        this.neighbourList = [
            [0, +1], //down
            [+1, +1], //
            [-1, +1], 

            [+1, 0],
            [-1, 0],

            [0, -1],
            [+1, -1],
            [-1, -1]
        ]
    }

    update() {
        //choose a random direction from the top 3 tiles
        let d;
        if (random() < 0.6) {
            d = this.neighbourList[0];
        } else {
            d = random(this.neighbourList.slice(0, 3));
        }

        //get new positions and particle
        let xn = this.x + d[0];
        let yn = this.y + d[1];
        let neighbour = this.world.getParticle(xn, yn);

        if (this.watered) {
            if (neighbour instanceof SoilParticle) {
                // Check if the empty space I want to grow into doesn't have too
                // many neighbours
                let count = 0;
                for (let i = 0; i < this.neighbourList.length; i++) {
                    let dn = this.neighbourList[i];
                    let xnn = xn + dn[0];
                    let ynn = yn + dn[1];
                    if (this.world.getParticle(xnn, ynn) instanceof RootParticle) {
                        count++;
                    }
                }
                
                //if the plant particle has already grown 2 times, don't grow
                if (count < 2) {
                    if (neighbour instanceof SoilParticle) {
                        neighbour.delete();
                    }
                    // grow into it
                    if (random() > 0.5) {
                        this.world.addParticle(new RootParticle(xn, yn, this.world));
                        this.watered = false;
                    }
                }
                //if you haven't grown, give your water upwards instead
                
            }

            // else {
            //     for (let i = 0; i < 3; i++){
            //         //upwards pixels
            //         let dn = this.neighbourList[5 + i];
            //         let xnn = xn + dn[0];
            //         let ynn = yn + dn[1];

            //         let neighbour = this.world.getParticle(xnn, ynn);
            //         if ((neighbour instanceof RootParticle) && !neighbour.watered) {
            //             neighbour.watered = true;
            //             this.watered = false;
            //             print('giving to root');
            //         }else if(neighbour instanceof PlantParticle && !neighbour.watered){
            //             neighbour.watered = true;
            //             this.watered = false;
            //             print(neighbour.watered, this.watered);
            //         }
            //     }
            // }
            
            else if (neighbour instanceof PlantParticle || neighbour instanceof RootParticle) {
                if (!neighbour.watered) {
                    neighbour.watered = true;
                    this.watered = false;
                }
            }

        }
        else {
            // If we're not watered look for water
            if (neighbour instanceof SoilParticle && neighbour.getWater() > 0) {
                // if the random neighbour is water, delete it and we are now watered
                neighbour.setWater(-1);
                this.watered = true;
            }
        }

    }

}


// class GunpowderParticle extends SandParticle {
//     static BASE_COLOR = '#222222'

//     constructor(x, y, world) {
//         super(x, y, world);
//         this.flammability = 0.7;
//         this.fuel = 25;
//     }
// }


class FluidParticle extends MoveableParticle {

    constructor(x, y, world) {
        super(x, y, world);
        this.updateList = [
            [+0, +1],
            [-1, +1],
            [+1, +1],
            [-1, +0],
            [+1, +0]
        ];
    }

    update(trySwap) {
        let moved = false;

        for (let i = 0; i < this.updateList.length; i++) {
            let u = this.updateList[i];
            moved = this.tryGridPosition(
                this.x + Math.sign(this.weight - AIR_WEIGHT) * u[0],
                this.y + Math.sign(this.weight - AIR_WEIGHT) * u[1],
                trySwap
            );

            // HACK If we moved with the last direction in the update list (left
            // or right), then swap that with the previous one (right or left,
            // respectively). Basically, when you hit a dead end, turn around
            // until you hit another one. Repeat.
            if (moved) {
                if (i === 4) {
                    let temp = this.updateList[3];
                    this.updateList[3] = this.updateList[4];
                    this.updateList[4] = temp;
                }
                super.update();
                return moved;
            }
        }
        super.update();
        return moved;

    }
}


class WaterParticle extends FluidParticle {

    static BASE_COLOR = '#2b64c3';

    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 60;
        this.neighbourList = [
            [+0, +1],
            [-1, +1],
            [+1, +1]
        ]
    }

    update() {
        super.update(true);
        for(let i = 0; i < this.neighbourList.length; i++) {
            let dn = this.neighbourList[i];
            let xnn = this.x + dn[0];
            let ynn = this.y + dn[1];
            let neighbour = this.world.getParticle(xnn, ynn);

            if(neighbour instanceof SoilParticle && neighbour.getWater() < 2 && random() < 0.2){
                neighbour.setWater(1);
                this.delete();
                break;
                
            }
        }
    }

    evaporate() {
        this.world.addParticle(new SteamParticle(this.x, this.y, this.world), true);
    }
}


class SteamParticle extends FluidParticle {
    static BASE_COLOR = '#c0d2f2'
    static BASE_CONDENSATION_COUNTDOWN = 100;

    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 0.5;
        this.initialConensationCountdown = round(this.constructor.BASE_CONDENSATION_COUNTDOWN * random(0.7, 1.3));
        this.condensationCountdown = this.initialConensationCountdown;
    }

    update() {
        let lastY = this.y;
        super.update(true);

        if (this.condensationCountdown <= 0) {
            this.condensate();
        }

        if (this.y === lastY) {
            this.condensationCountdown--;
        }
        else {
            this.condensationCountdown = this.initialConensationCountdown;
        }
    }

    condensate() {
        this.world.addParticle(new WaterParticle(this.x, this.y, this.world), true);
    }
}


// class HydrogenParticle extends FluidParticle {
//     static BASE_COLOR = '#9379a8';

//     constructor(x, y, world) {
//         super(x, y, world);
//         this.weight = 0.2;
//         this.flammability = 0.95;
//         this.fuel = 6;
//     }

//     update() {
//         super.update(true);
//     }
// }

// class GasolineParticle extends FluidParticle {
//     static BASE_COLOR = '#6922A2'

//     constructor(x, y, world) {
//         super(x, y, world);
//         this.weight = 50;
//         this.flammability = 0.95;
//         this.fuel = 15;
//     }

//     update() {
//         super.update(true);
//     }
// }


adjustHSBofString = function (colorString, scaleH, scaleS, scaleB) {
    let c = color(colorString);
    colorMode(HSB);
    c = color(hue(c) * scaleH, saturation(c) * scaleS, brightness(c) * scaleB);
    // colorMode(RGB);
    return c.toString('#rrggbb')
}