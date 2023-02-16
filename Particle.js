//the main class that everything inherits from
class Particle extends Placeable {

    static BASE_COLOR = '#FFFFFF';

    /**
    * @param {World} world
    */
    constructor(x, y, world) {
        super(x, y, world);

        //each particle has a base colour that dictates its normal colour
        let c = this.constructor.BASE_COLOR;
        this.color = adjustHSBofString(c, 1, random(0.95, 1.05), random(0.95, 1.05));
        this.originalColor = this.color;
    }

    /**
    * @param {boolean} b
    */

    update() {
        return super.update();
    }

    //v1 is giving its water and v2 is taking
    water_give(v1, v2){
        v1.setWater(-1);
        v2.setWater(1);
    }

    //v1 is giving it's nitrogen and v2 is taking
    nitrogen_give(v1, v2){
        v1.setNitrogen(-1);
        v2.setNitrogen(1);
    }

    setWater(nw){
        //everytime water gets more saturated, the colour changes a little
        this.color = this.change_colour(this.color, this.watered);
        this.watered += nw;
      
    }

    setNitrogen(nn){
        //everytime there is more nitrogen, the colour changes a little
        this.color = this.change_colour(this.color, 0, this.nitrogen);
        this.nitrogen += nn;
      
    }

    //colour change code to apply for water, nitrogen, etc.
    //new_p signifies a new particle, which multiplies the colour change
    change_colour(colour, water_change = 0, nitro_change = 0, new_p = false){
        let n_col = colour;
        //water colour change
        if(water_change > 0){
            //if the particle is a copy of another one
            //multiply the colour change so it shows correctly
            if(new_p){
                n_col = adjustHSBofString(n_col, pow(0.9, water_change), pow(1.1, water_change), pow(0.9, water_change))
                //print('water colour changed');
            }else{
                n_col = adjustHSBofString(n_col, 0.9, 1.1, 0.9);
            }

        // reversed colour change to bring it back to normal
        }else if(water_change  == -1){
            n_col = adjustHSBofString(n_col, 1.1, 0.9, 1.1);
        }

        //nitrogen colour change
        if(nitro_change > 1){
            if(new_p){
                n_col = adjustHSBofString(n_col, pow(0.9, nitro_change-1), pow(0.9, nitro_change-1), pow(1.1, nitro_change-1))
                //print('nitrogen colour changed');
            }
            else{
                n_col = adjustHSBofString(n_col, 0.9, 0.9, 1.1);
            }
        }else if(nitro_change == -1){
            n_col = adjustHSBofString(n_col, 1.1, 1.1, 0.9);
        }
        
        //return the changed colour
        return n_col;

    }

}


class WallParticle extends Particle {

    static BASE_COLOR = '#626770';

    constructor(x, y, world) {
        super(x, y, world);
    }
}

class IndestructibleWallParticle extends WallParticle {

    static BASE_COLOR = '#6C727B';

    // These are the particles used to define the border of the world so I don't
    // have to worry about checking the edges of the array. They are
    // indesctructible
    constructor(x, y, world) {
        super(x, y, world);
        this.indestructible = true;
    }
}

// //sun parent holds the sun particles
// //that way they can be moved and accessed reliably
// class SunParentParticle extends WallParticle {
//     static BASE_COLOR = '#fcba03';

//     constructor(x, y, world){
//         super(x, y, world);
//         this.indestructible = true;
//         //the list of the printed particles
//         this.sunParticles = [];

//         //size of the square * 2
//         this.size = 6;

//         for(let i = this.size * -1; i <= this.size; i++){
//             for(let j = this.size * -1; j <= this.size; j++){

//                 //create a square with removed edges
//                 if((i != this.size * -1 && i != this.size) || (j != this.size * -1 && j != this.size)){
//                     let p = new SunChildParticle(this.x + i, this.y + j, world)
//                     this.world.addParticle(p);
//                     append(this.sunParticles, p);
//                 }
                
//             }
//         }

//     }

//     //this movement code doesnt remove the previous sun particle position
//     //so it just turns into a giant worm on the screen

//     // update(){
//     //     for(let i = 0; i < this.sunParticles.length; i++){
//     //         this.sunParticles[i].movePOS(1, 0);
//     //     }
//     // }

// }

// //sun child particles are what is shown in the program
// class SunChildParticle extends WallParticle{
//     static BASE_COLOR = '#fcba03';

//     constructor(x, y, world){
//         super(x, y, world);
//         this.indestructible = true;
//     }

//     // movePOS(x, y){
//     //     this.x = this.x + x;
//     //     this.y = this.y + y;
//     //     this.world.moveParticleInGrid(this, this.x, this.y);
//     // }
// }


class MoveableParticle extends Particle {
    // parent for particles that can move and displace each other.
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


class FallingParticle extends MoveableParticle {
    //Parent for particles that can fall
    static BASE_COLOR = '#e5b55f';

    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 90;
        //lower three particles
        this.updateList = [
            [+0, +1], //down
            [-1, +1], //down left
            [+1, +1] //down right
        ]

        //randomly switch up the movement
        if (random() > 0.5) {
            let temp = this.updateList[1];
            this.updateList[1] = this.updateList[2];
            this.updateList[2] = temp;
        }
    }

    update() {
        let moved = false;
        let i = 0;

        //for each position in the update list
        //check if the particle can move there
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

class MicrobeParticle extends FallingParticle {
    static BASE_COLOR = '#a11ee3';

    constructor(x, y, world){
        super(x, y, world);

        //the microbe has to wait for 40 frames before moving
        this.movement_count = 30;
        //spaces it can move

        //check so it doesn't leave the plant zone
        this.inRhizosphere = false;

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
        // check whether the particle needs to fall
        //ie no ground beneath or above it
        let groundCheck = false;
        if(this.world.getParticle(this.x, this.y+1) instanceof SoilParticle || this.world.getParticle(this.x, this.y-1) instanceof SoilParticle){
            groundCheck = true;
        }

        if(groundCheck == true){
            //if the count is up then move
            if(this.movement_count == 0){

                //choose a random direction
                let d = random(this.neighbourList);
    
                //get new positions and particle
                let xn = this.x + d[0];
                let yn = this.y + d[1];
                let neighbour = this.world.getParticle(xn, yn);
    
                if(neighbour instanceof SoilParticle){
                    if(neighbour.state == 'poor' && random() < 0.4){
                        this.world.addParticle(new SoilParticle(this.x, this.y, world), true);
                        //print('bacteria died');
                    }else{
                        if(this.inRhizosphere == false || (this.inRhizosphere == true && neighbour.rootBound == true)){
                            //If the soil has good nitrogen, take it
                            if(this.nitrogen < 2){
                                neighbour.nitrogen_give(neighbour, this);
                            }
                            
                            //move the microbe into a new place
                            //move the soil that was there into our old spot
                            if(neighbour.rootBound == true){
                                this.inRhizosphere = true;
                            }
    
                            this.tryGridPosition(xn, yn, true)
                            neighbour.setState('healthy');
    
                        }
                    }
 
                //if ur neighbour is a plant instead, give it your nitrogen
                }else if(neighbour instanceof PlantParticle && neighbour.nitrogen == 1){
                    neighbour.nitrogen_give(this, neighbour);
                }

                //reset movement counter
                this.movement_count = 40;
            }else{

                //count down to movement
                this.movement_count -= 1;
            }
        }else{
            //fall if there is nothing beneath or on top of u
            super.update();
        }
        
    }
}

class SpiderParticle extends FallingParticle {
    static BASE_COLOR = '#48636b'

    constructor(x, y , world){
        super(x, y, world);
        // > 0.5 is hopping up and down
        // < 0.5 is doing a big jump left or right
        this.hop = random();
        // > 0.5 is left
        // < 0.5 is right
        this.direction = random();

        //the mite starts off by going up
        this.upCheck = true;
        this.weight = 5;
        //start by assuming you are falling
        this.height = -1;
        this.heightLimit;

        this.setHeight();

        
    }

    setHeight(){
        if(this.hop > 0.5){
            this.heightLimit = 1;
        }else{
            this.heightLimit = random(1, 7);
        }
    }

    update(){
        //check if theres ground beneath the mite
        //if so, reset all the constructors
        let groundCheck = false;

        //eat the biomass under the particle
        if(this.world.getParticle(this.x, this.y +1) instanceof BiomassParticle && random() < 0.3){
            this.world.addParticle(new Org_FertParticle (this.x, this.y +1, world), true);
        }

        if(this.world.getParticle(this.x, this.y+1)){
            groundCheck = true;
            this.height = 0;
            this.hop = random();
            this.direction = random();
            this.upCheck = true;
            this.setHeight();
        }

        let move;

        //movement code
        if(this.height >= 0){
            if(this.upCheck == false){
                if(this.hop > 0.5){
                    move = this.tryGridPosition(this.x, this.y+1);
                    //print(move, 'hop up');
                    this.upCheck = true;
                }else{
                    if(this.direction > 0.5){
                        move = this.tryGridPosition(this.x-1, this.y+1);
                        //print(move, 'up left');
                    }else{
                        move = this.tryGridPosition(this.x+1, this.y+1);
                        //print(move, 'up right');
                    }
                }
                this.height--;
            }else{
                if(this.hop > 0.5){
                    move = this.tryGridPosition(this.x, this.y-1);
                    //print(move, 'hop down');
                    this.upCheck = false;
                }else{
                    //left
                    if(this.direction > 0.5){
                        move = this.tryGridPosition(this.x-1, this.y-1);
                        //print(move, 'down left');
                    }else{
                        move = this.tryGridPosition(this.x+1, this.y-1);
                        //print(move, 'down right');
                    }
                }
                this.height++;

                //if its reached the height limit go down
                if(this.height > this.heightLimit){
                    this.upCheck = false;
                }
                
            }

        //if the movement didnt execute
        //move to falling
        if(move == false){
            this.height = -1;
        }

        //if weve excuted the movement and theres still no ground beneath us
        //fall
        }else if(this.height < 0 && groundCheck == false){
            super.update();
        }
        
    }
}

class SoilParticle extends FallingParticle {
    static BASE_COLOR = '#755127';

    constructor(x, y, world) {
        super(x, y, world);
        let state;
        this.watered = 0;

        this.color_healthy = this.color;
        this.color_poor = adjustHSBofString(this.color, 0.5, 1, 1);
        this.weight = 50;

        //tell the soil not to move if it's next to a root
        this.rootBound = false;

        //choose a random soil state with corresponding nitrogen
        if(random() > 0.5){
            state = 'healthy';
            this.nitrogen = 2;

        }else{
            state = 'poor';
            this.nitrogen = 1;
        }

        this.setState(state);
    }

    //sets the soil state and alters the colours based on nitrogen and water content
    setState(ns){
        if(ns == 'healthy' && this.state != 'healthy'){
            //healthy and compacted dirt have saturation colourings relative to their states
            this.color = this.change_colour(this.color_healthy, this.watered, this.nitrogen, true);
        }else if(ns == 'poor' && this.state != 'poor'){
            this.color = this.change_colour(this.color_poor, this.watered, this.nitrogen, true);
        }
        this.state = ns;
    }

    getWater(){
        return this.watered;
    }

    update(){
        if(this.rootBound == false){
            super.update();
        }
    }
}

class Syn_FertParticle extends FallingParticle {
    static BASE_COLOR = '#4f7052';

    constructor(x, y, world) {
        super(x, y, world);

        //heavier than soil so will saturate better
        this.weight = 60;
        this.nitrogen = 1;

        //counts to decide whether to dissolve syn fert
        this.remove_count = 0;
        this.remove_threshhold = random(100, 300);


        //downwards positions to tell if there is soil to change
        this.neighbourList = [
            [-1, -1], //up left
            [+1, -1], //up right
            [+1, 0], //right
            [-1, 0], //left
            [+1, +1], //down right
            [0, +1], //down
            [-1, +1], //down left
            [0, -1] //up
        ]
    }

    update(){
        //falling movement
        super.update();

        for(let i = 0; i < this.neighbourList.length; i++) {
            //get particle
            let dn = this.neighbourList[i];
            let xnn = this.x + dn[0];
            let ynn = this.y + dn[1];
            let neighbour = this.world.getParticle(xnn, ynn);

            if(random() < 0.3 && neighbour instanceof SoilParticle){
                //if the nearest soil is healthy, turn it poor
                if(neighbour.state == 'healthy'){
                    //give it your nitrogen and delete this particle
                    if(neighbour.nitrogen == 1){
                        neighbour.nitrogen += 1;
                    }

                    neighbour.setState('poor');

                    this.delete();
                    break;
                }
            }
        }
        this.degrade();
    }

    degrade(){
        this.remove_count += 1;
        if(this.remove_count > this.remove_threshhold){
            this.delete();
        }
    }
}

class Org_FertParticle extends FallingParticle {
    //same code as synthetic fertiliser
    //but poor soil turns healthy
    static BASE_COLOR = '#705d4f';

    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 60;
        this.nitrogen = 1;

        //timer that helps fert to not get stuck under soil
        this.fertTimer = random(50, 300);
        this.count = 0;

        this.neighbourList = [
            [-1, -1], //up left
            [+1, -1], //up right
            [+1, 0], //right
            [-1, 0], //left
            [+1, +1], //down right
            [0, +1], //down
            [-1, +1], //down left
            [0, -1] //up
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
                //if the soil is poor, turn it healthy
                if(neighbour.state == 'poor'){
                    if(neighbour.nitrogen == 1){
                        neighbour.nitrogen += 1;
                    }

                    neighbour.setState('healthy');

                    this.delete();
                    break;
                }else if(this.weight == 60 && this.count > this.fertTimer){
                    this.weight = 40;
                    this.count = 0;
                }
            }
        }
        this.count += 1;
    }
}

class BiomassParticle extends FallingParticle {
    //same code as synthetic fertiliser
    //but poor soil turns healthy
    static BASE_COLOR = '#7d3313';

    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 45;

        //counts to decide whether to turn the biomass into org fert
        this.remove_count = 0;
        this.remove_threshhold = random(200, 1000);
    }

    //degrading turns the biomass into organic fertiliser
    degrade(){
        this.remove_count += 1;
        if(this.remove_count > this.remove_threshhold){
            this.world.addParticle(new Org_FertParticle(this.x, this.y, world), true);
        }
    }

    update(){
        super.update();
        this.degrade();
    }
}

class SeedParticle extends FallingParticle{
    static BASE_COLOR = '#fcba03';

    constructor(x, y, world){
        super(x, y, world);
        this.weight = 50;

        //counts to decide whether to turn the seed into org fert
        this.remove_count = 0;
        this.remove_threshhold = random(200, 1000);

        this.neighbourList = [
            //growth directions
            [-1, -1], //up left
            [+1, -1], //up right
            [+1, +1], //down right
            [-1, +1], //down left
            [+1, 0], //right
            [-1, 0] //left
        ]
    }

    update(){
        //particle above this
        let xu = this.x;
        let yu = this.y - 1;
        let neighbour_upper = this.world.getParticle(xu, yu);

        //particle below this
        let xl = this.x;
        let yl = this.y + 1;
        let neighbour_lower = this.world.getParticle(xl, yl);

        //if the particle above this has nothing in it
        //and below us is soil
        //then grow
        if(!neighbour_upper && neighbour_lower instanceof SoilParticle){
            let count = 0;

            //make sure you aren't growing too close to another plant
            for (let i = 0; i < this.neighbourList.length; i++) {
                let dn = this.neighbourList[i];
                let xnn = this.x + dn[0];
                let ynn = this.y + dn[1];
                if (this.world.getParticle(xnn, ynn) instanceof PlantParticle) {
                    count++;
                }
            }

            if(count < 2){
                //delete the seed and soil below and place a plant
                //50% chance between normal plant and flower
                let plant_p;
                if(random() < 0.5){
                    plant_p = new PlantParticle(null, null, this.x, this.y, world)
                }else{
                    plant_p = new FlowerParticle(null, null, this.x, this.y, world)
                }
                
                let root_p = new RootParticle(plant_p, null, xl, yl, world);
                root_p.plantDeathCount = random(50, 150);
                this.world.addParticle(plant_p, true);
                this.world.addParticle(root_p, true);
            }else{
                //if this didnt grow, it degrades
                this.degrade();
            }
        }else{
            super.update();
            this.degrade();
        }
    }

    //degrading turns the seed into organic fertiliser
    degrade(){
        this.remove_count += 1;
        if(this.remove_count > this.remove_threshhold){
            this.world.addParticle(new BiomassParticle(this.x, this.y, world), true);
        }
    }
}

class PlantParticle extends Particle {

    static BASE_COLOR = '#338A1B';

    constructor(prev, next, x, y, world, length = 0) {
        super(x, y, world);
        this.color_watered = this.color;
        this.color_dry = adjustHSBofString(this.color, 0.7, 1, 1);
        this.watered = 0;
        this.nitrogen = 1;

        this.length = length;
        this.lengthLimit = random(10, 25);

        this.prev = [];
        this.next = [];

        this.dead= false;

        this.linkTheList(prev, next);
        

        this.neighbourList = [
            //growth directions
            [0, -1], //up
            [-1, -1], //up left
            [+1, -1], //up right

            [+1, +1],
            [0, +1],
            [-1, +1],
            [+1, 0],
            [-1, 0]
        ]
    }

    //connecting the parts of a new particle so that functions can work correctly
    linkTheList(prev, next){
        //print(this.prev, this.next);
        this.setPrev(prev);
        this.setNext(next);

        //if we have a previous particle but the previous particle is not linked to us
        //and vice versa
        //then link it

        //print(prev, next, this.prev, this.next);
        
        if(this.prev[this.prev.length-1] && !this.prev[this.prev.length-1].next.includes(this)){
            this.prev[this.prev.length-1].setNext(this);
            
        }else if(this.next[this.prev.length-1] && !this.next[this.prev.length-1].prev.includes(this)){
            this.next[this.prev.length-1].setPrev(this);

        }
    }

    //add the new previous particle to a list
    setPrev(p){
        if(p){
            append(this.prev, p);
        }
    }

    //add the next next particle to a list
    setNext(p){
        if(p){
            append(this.next, p);
        }
    }

    //set water and change the colour of the plant
    setWater(w) {
        this.watered += w;
        if (this.watered > 0) {
            this.color = this.color_watered;
        }
        else {
            this.color = this.color_dry;
        }
    }

    //each plant particle has different grow conditions
    //plant checks whether tha particle they are going to grow into is empty
    neighbourGrowthChecker(n){
        return !n;
    }

    //each plant particle has a different way of retriving nutrients
    //plant gets nutrients given to it, so nothing happens
    nutrientRetrieval(){
        return;
    }

    //check whether a particle is being represented in the update grid
    //this is helpful to tell whether something has been deleted
    inGrid(){
        if(this.world.particleGrid[this.x][this.y] == this){
            return true;
        }

        return false;
    }

    // function that uses recursion to destroy part of a plant
    // checks are used to tell the program which way to go
    destroyLinkedList(prev_check, next_check){

        //add biomass on top of this particle
        this.world.addParticle(new BiomassParticle(this.x, this.y, world), true);

        //delete upwards
        if(prev_check == true){
            if(this.prev.length != 0){
                //print(this.prev);
                //for each linked particle, if its not been deleted already, destroy it
                for(let i = 0; i < this.prev.length; i++){
                    if(this instanceof RootParticle){
                        this.changeSoil(false, true);
                    }

                    this.prev[i].destroyLinkedList(true, false);
                }
            }

        //delete downwards
        }else if(next_check == true){
            if(this.next.length != 0){
                //print(this.next);
                for(let i = 0; i < this.next.length; i++){
                    if(this instanceof RootParticle){
                        this.changeSoil(false, true);
                    }
                    
                    this.next[i].destroyLinkedList(false, true);
                }

            }
        }
    }

    update() {
        //choose a random direction from the top 3 positions
        let d;
        if (random() < 0.6) {
            //there is a higher chance the plant will assume one direction
            //in this case, it is straight up
            d = this.neighbourList[0];
        } else {
            d = random(this.neighbourList.slice(0, 3));
        }

        //get new positions and particle
        let xn = this.x + d[0];
        let yn = this.y + d[1];
        let neighbour = this.world.getParticle(xn, yn);

        if (this.watered == 1 && this.length < this.lengthLimit) {
            //check the growth condition for this plant particle
            if (this.neighbourGrowthChecker(neighbour)) {
                
                // Check if the empty space I want to grow into doesn't have too
                // many neighbours
                let count = 0;
                for (let i = 0; i < this.neighbourList.length; i++) {
                    let dn = this.neighbourList[i];
                    let xnn = xn + dn[0];
                    let ynn = yn + dn[1];
                    //plant particle covers roots, plant, petals, hyphae, etc
                    if (this.world.getParticle(xnn, ynn) instanceof PlantParticle) {
                        count++;
                    }
                }

                //count is to ensure we aren't growing into a crowded space
                if(count < 2){
                    //nitrogen increases the chance we will grow
                    if ((random() * this.nitrogen) > 0.5) {
                        let p;

                        //these checks the new particle grows correctly from its parent
                        if(this instanceof HyphaeParticle){ 
                            p = new HyphaeParticle(this, null, xn, yn, world, this.length +1);
                            this.world.addParticle(p, true);
                            this.linkTheList(null, p);
                        }else if(this instanceof RootParticle){
                            p = new RootParticle(this, null, xn, yn, world, this.length +1);
                            this.world.addParticle(p, true);
                            this.linkTheList(null, p);
                        }else if(this instanceof FlowerParticle){
                            p = new FlowerParticle(null, this, xn, yn, world, this.length +1);
                            this.world.addParticle(p);
                            this.linkTheList(p, null);
                        }else if(this instanceof PlantParticle){
                            p = new PlantParticle(null, this, xn, yn, world, this.length +1);
                            this.world.addParticle(p);
                            this.linkTheList(p, null);
                        }
                        
                        //remove water and nitrogen from the parent
                        this.setWater(-1);
                        if(this.nitrogen == 2){
                            this.nitrogen = 1;
                        }
                    }
                }        
            }

            //if the neighbour that I want to grow into isn't eligible
            //give my water and nitrogen upwards to a random parent
            else{
                let prev_p = random(this.prev);
                if(prev_p){
                    if(prev_p.watered == 0){
                        this.water_give(this, prev_p);
                    }

                    if(prev_p.nitrogen == 1 && this.nitrogen == 2){
                        this.nitrogen_give(this, prev_p);
                    }
                }
        }

        }else {
            //if we havent grown, get nutrients
            this.nutrientRetrieval(neighbour);
        }

        super.update();
    }

}

class FlowerParticle extends PlantParticle{
    static BASE_COLOR = '#84db65';

    constructor(prev, next, x, y, world, length = 0){
        super(prev, next, x, y, world, length);
        this.color_petal = adjustHSBofString('#cc2331', random(0.5, 1.5), 1, 1);
        this.length = length;
        this.lengthLimit = random(5, 15);
        this.petalCount = 0;

        //placing the petal randomly adjacent to it's parent
        this.randomPlacement = [round(random(-1, -1)), round(random(-1, -1))];

        //positions relative to the random placement
        this.flowerList = [
            [this.randomPlacement[0], this.randomPlacement[1]], //down petal
            [this.randomPlacement[0], this.randomPlacement[1]-1], //centre
            [this.randomPlacement[0]-1, this.randomPlacement[1]-1], //left petal
            [this.randomPlacement[0]+1, this.randomPlacement[1]-1], //right petal
            [this.randomPlacement[0], this.randomPlacement[1]-2], //top petal
        ]

    }

    update(){
        //if length is -1 the flower particle is a petal
        if(this.length != -1){    
            if(this.length < this.lengthLimit){
                super.update();
            }else{
                //create the flower
                if(this.petalCount < this.flowerList.length){
                    let d = this.flowerList[this.petalCount];
                    let xn = this.x + d[0];
                    let yn = this.y + d[1];

                    let newPetal = new FlowerParticle(null, this, xn, yn, world, -1);
                    this.linkTheList(newPetal, null);
                    newPetal.color = this.color_petal;
                    this.world.addParticle(newPetal);
                    this.petalCount += 1;
                }
            }
        
        }
    }
}

class RootParticle extends PlantParticle {

    static BASE_COLOR = '#998f36';

    constructor(previous, next, x, y, world, length = 0) {
        super(previous, next, x, y, world);

        this.length = length;
        this.neighbourList = [
            //growth positions
            [0, +1], //down
            [+1, +1], // down right
            [-1, +1], //down left

            [+1, 0], //right
            [-1, 0], //left
            [0, -1], //up
            [+1, -1], //up right
            [-1, -1] //up left
        ]

        this.zoneList = [
            //growth positions
            [0, +1], //down
            [+1, +1], // down right
            [-1, +1], //down left

            [+1, 0], //right
            [-1, 0], //left
            [0, -1], //up
            [+1, -1], //up right
            [-1, -1], //up left

            //positions but one pixel outwards
            //for the rhizosphere
            [-1, +2], //down two, left
            [0, +2], //down two
            [+1, +2], //down two, right
            [+2, +2], //down two, right two
            [+2, +1], //right two, down
            [-2, 1], //left two, down
            [-2, +2] //left tow, down two
        ]

        //this gets changed if this root particle counts down to the plant's death
        this.plantDeathCount = null;
        this.changeSoil(true, false);

        //decide bottom left or bottom right placement for hyphae
        let d;
        if (random() < 0.6) {
            d = this.neighbourList[1];
        } else {
            d = this.neighbourList[2];
        }

        //get new positions and particle
        let xn = this.x + d[0];
        let yn = this.y + d[1];
        let neighbour = this.world.getParticle(xn, yn);

        if(!(this instanceof HyphaeParticle) && random() < 0.1 && neighbour instanceof SoilParticle){
            this.world.addParticle(new HyphaeParticle(this, null, xn, yn, world), true);
        }
    }

    //each plant particle has different grow conditions
    //roots need to grow into soil
    neighbourGrowthChecker(n){
        return n instanceof SoilParticle;
    }

    nutrientRetrieval(neighbour){
        if (neighbour instanceof SoilParticle) {
            //If we don't have nutrients, look for them
            if(neighbour.nitrogen > 0 && this.nitrogen == 1){
                this.nitrogen_give(neighbour, this);
            }
            
            // If we're not watered look for water
            if(neighbour.watered > 0 && this.watered == 0){
                this.water_give(neighbour, this);
            }
        }
    }

    //tell the soil next to roots not to move
    changeSoil(compact, uncompact){
        for(let i = 0; i < this.zoneList.length; i++){
            let d = this.zoneList[i];
            let xn = this.x + d[0];
            let yn = this.y + d[1];
            let neighbour = this.world.getParticle(xn, yn);

            if(neighbour instanceof SoilParticle){
                if(compact == true){
                    neighbour.rootBound = true;
                    if(random() < 0.1){
                        this.world.addParticle(new MicrobeParticle(neighbour.x, neighbour.y, world), true);
                    }
                }else if(uncompact == true){
                    neighbour.rootBound = false;
                }
                
            }if(neighbour instanceof MicrobeParticle){
                neighbour.inRhizosphere = false;
            }
        }
    }

    update() {
        super.update();
        if(this.plantDeathCount != null){
            this.plantDeathCount--;
            if(this.plantDeathCount < 0){

                //destroy all previous particles
                for(let i = 0; i < this.prev.length; i++){
                    this.prev[i].destroyLinkedList(true, false);
                }

                //destroy all next particles
                for(let i = 0; i < this.next.length; i++){
                    this.next[i].destroyLinkedList(false, true);
                }
                this.plantDeathCount = null;

                //destroy this add new seed
                this.world.addParticle(new SeedParticle(this.x, this.y, world), true);
            }
        }
    }

}

class HyphaeParticle extends RootParticle{
    static BASE_COLOR = '#c9c6b3';

    constructor(previous, next, x, y, world, length = 0){
        super(previous, next, x, y, world);
        this.length = length;
        this.lengthLimit = 3;

        this.neighbourList = [
            //growth positions but one pixel outwards
            //achieves a dashed look

            [-1, +2], //down two, left
            [0, +2], //down two
            [+1, +2], //down two, right
            [+2, +2], //down two, right two
            [+2, +1], //right two, down
            [-2, 1], //left two, down
            [-2, +2] //left tow, down two
        ]
    }

    update(){
        super.update();
    }
}


class FluidParticle extends MoveableParticle {

    constructor(x, y, world) {
        super(x, y, world);
        this.updateList = [
            [+0, +1], //down
            [-1, +1], //down left
            [+1, +1], //down right
            [-1, +0], //left
            [+1, +0] //right
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

        //timer that helps water to not get stuck under soil
        this.waterTimer = random(50, 300);

        this.count = 0;
        this.neighbourList = [
            [-1, -1], //up left
            [+1, -1], //up right
            [+1, 0], //right
            [-1, 0], //left
            [+1, +1], //down right
            [0, +1], //down
            [-1, +1], //down left
            [0, -1] //up
        ]
    }

    update() {
        super.update(true);

        for(let i = 0; i < this.neighbourList.length; i++) {
            let dn = this.neighbourList[i];
            let xnn = this.x + dn[0];
            let ynn = this.y + dn[1];
            let neighbour = this.world.getParticle(xnn, ynn);

            //if the nearest neighbour is soil and it's saturation level is less than 2
            //saturate it and delete this particle
            if(neighbour instanceof SoilParticle){
                if((neighbour.state == 'healthy' || (neighbour.state == 'poor' && random() < 0.3)) && neighbour.getWater() < 2){
                    neighbour.setWater(1);
                    this.delete();
                    break;

                //otherwise if the water timer is up and you still exist, become lighter than soil
                //this means the water either saturates different soil, or sits on top.
                }else{
                    if(this.weight == 60 && this.count > this.waterTimer){
                        this.weight = 40;
                        this.count = 0;
                    }
                }
            }
        }
        this.count += 1;
    }

}


class CloudParticle extends FluidParticle {
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

        //if the cloud isn't moving upwards start condensation
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

//function that alters colour with a scale
//allows easy tuning of colour
adjustHSBofString = function (colorString, scaleH, scaleS, scaleB) {
    let c = color(colorString);
    colorMode(HSB);
    c = color(hue(c) * scaleH, saturation(c) * scaleS, brightness(c) * scaleB);
    return c.toString('#rrggbb')
}