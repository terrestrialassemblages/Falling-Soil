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
        if(water_change > 0){
            if(new_p){
                n_col = adjustHSBofString(n_col, pow(0.9, water_change), pow(1.1, water_change), pow(0.9, water_change))
            }else{
                n_col = adjustHSBofString(n_col, 0.9, 1.1, 0.9);
            }
        }else if(water_change  == -1){
            n_col = adjustHSBofString(n_col, 1.1, 0.9, 1.1);
        }
        if(nitro_change > 1){
            if(new_p){
                n_col = adjustHSBofString(n_col, pow(0.9, nitro_change-1), pow(0.9, nitro_change-1), pow(1.1, nitro_change-1))
            }
            else{
                n_col = adjustHSBofString(n_col, 0.9, 0.9, 1.1);
            }
        }else if(nitro_change == -1){
            n_col = adjustHSBofString(n_col, 1.1, 1.1, 0.9);
        }
        
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
    // indesctructible so sinks can't destroy them.
    constructor(x, y, world) {
        super(x, y, world);
        this.indestructible = true;
    }
}

//sun parent holds the sun particles
class SunParentParticle extends WallParticle {
    static BASE_COLOR = '#fcba03';

    constructor(x, y, world){
        super(x, y, world);
        this.indestructible = true;
        this.sunParticles = [];

        this.size = 6;

        for(let i = this.size * -1; i <= this.size; i++){
            for(let j = this.size * -1; j <= this.size; j++){

                if((i != this.size * -1 && i != this.size) || (j != this.size * -1 && j != this.size)){
                    let p = new SunChildParticle(this.x + i, this.y + j, world)
                    this.world.addParticle(p);
                    append(this.sunParticles, p);
                }
                
            }
        }

    }

    // update(){
    //     for(let i = 0; i < this.sunParticles.length; i++){
    //         this.sunParticles[i].movePOS(1, 0);
    //     }
    // }

}

//sun child particles are what is shown
class SunChildParticle extends WallParticle{
    static BASE_COLOR = '#fcba03';

    constructor(x, y, world){
        super(x, y, world);
        //this.indestructible = true;
    }

    // movePOS(x, y){
    //     this.x = this.x + x;
    //     this.y = this.y + y;
    //     this.world.moveParticleInGrid(this, this.x, this.y);
    // }
}


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

class MiteParticle extends MoveableParticle {
    constructor(x, y , world){
        this.movementCount = random(25, 200);
    }
}

class OrganismParticle extends Particle {
    static BASE_COLOR = '#a11ee3';

    //removed nn
    constructor(x, y, world){
        super(x, y, world);
        //does the organism have nutrients to share with the plant?
        //this.nitrogen = nn;
        this.movement_count = 40;
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
        if(this.movement_count == 0){
            //choose a random direction
            let d = random(this.neighbourList);

            //get new positions and particle
            let xn = this.x + d[0];
            let yn = this.y + d[1];
            let neighbour = this.world.getParticle(xn, yn);

            if(neighbour instanceof SoilParticle){
                //what is the soil like?
                if(this.nitrogen < 2){
                    neighbour.nitrogen_give(neighbour, this);
                }
                
                //move the organism into a new place
                this.delete();
                neighbour.moveToGridPosition(this.x, this.y)
                neighbour.setState('healthy');
                //removed this.nitrogen
                this.world.addParticle(new OrganismParticle(xn, yn, world));

            }else if(neighbour instanceof PlantParticle || neighbour instanceof RootParticle || neighbour instanceof HyphaeParticle){
                neighbour.nitrogen_give(this, neighbour);
            }else if(!neighbour){
                this.delete();
            }

            this.movement_count = 40;
        }else{
            this.movement_count -= 1;
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
        this.watered = 0;
        this.color_healthy = this.color;
        this.color_poor = adjustHSBofString(this.color, 0.5, 1, 1);
        //lighter than water
        this.weight = 50;

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
        super.update();
    }
}

class Syn_FertParticle extends SandParticle {
    static BASE_COLOR = '#4f7052';
    constructor(x, y, world) {
        super(x, y, world);
        this.weight = 60;
        this.nitrogen = 1;

        //downwards positions to tell if there is soil to change
        this.neighbourList = [
            [+0, +1], //down
            [-1, +1], //down left
            [+1, +1] //down right
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
                //if the nearest soil is healthy, turn it poor
                if(neighbour.state == 'healthy'){
                    neighbour.setState('poor');
                    neighbour.nitrogen_give(this, neighbour);
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
        this.weight = 60;
        this.nitrogen = 1;

        this.neighbourList = [
            [+0, +1], //down
            [-1, +1], //down left
            [+1, +1] //down right
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
                    neighbour.setState('healthy');
                    neighbour.nitrogen_give(this, neighbour);
                    this.delete();
                    break;
                }
            }
        }
    }
}

class SeedParticle extends SandParticle{
    static BASE_COLOR = '#fcba03';
    constructor(x, y, world){
        super(x, y, world);
        this.weight = 50;
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
        //upper particle
        let xu = this.x;
        let yu = this.y - 1;
        let neighbour_upper = this.world.getParticle(xu, yu);

        //lower particle
        let xl = this.x;
        let yl = this.y + 1;
        let neighbour_lower = this.world.getParticle(xl, yl);

        if(!neighbour_upper && neighbour_lower instanceof SoilParticle){
            let count = 0;
            for (let i = 0; i < this.neighbourList.length; i++) {
                let dn = this.neighbourList[i];
                let xnn = this.x + dn[0];
                let ynn = this.y + dn[1];
                if (this.world.getParticle(xnn, ynn) instanceof PlantParticle || this.world.getParticle(xnn, ynn) instanceof RootParticle) {
                    count++;
                }
            }

            if(count < 2){
                this.delete();
                neighbour_lower.delete();
                let plant_p;
                if(random() < 0.5){
                    plant_p = new PlantParticle(null, null, this.x, this.y, world)
                }else{
                    plant_p = new FlowerParticle(null, null, this.x, this.y, world)
                }
                
                let root_p = new RootParticle(plant_p, null, xl, yl, world);
                this.world.addParticle(plant_p);
                this.world.addParticle(root_p);
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
            this.delete();
            this.world.addParticle(new Org_FertParticle(this.x, this.y, world));
            //print('done');
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
        this.setPrev(prev);
        this.setNext(next);

        //if we have a previous particle but the previous particle is not linked to us
        //and vice versa
        //then link it
        
        if(this.prev[0] && !this.prev[0].next.includes(this)){
            this.prev[0].setNext(this);
            //print(this.prev, this.prev[0].next);
        }else if(this.next[0] && !this.next[0].prev.includes(this)){
            this.next[0].setPrev(this);
            //print(this.next, this.next[0].prev);
        }
    }

    setPrev(p){
        if(p){
            append(this.prev, p);
        }
    }

    setNext(p){
        if(p){
            append(this.next, p);
        }
    }

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
    //they change in this function
    neighbourGrowthChecker(n){
        return !n;
    }

    //each plant particle has a different way of retriving nutrients
    nutrientRetrieval(){
        return;
    }

    inGrid(){
        if(this.world.particleGrid[this.x][this.y] == this){
            return true;
        }

        return false;
    }

    // function that uses recursion to destroy part of a list
    // checks are used to tell the program which way to go
    destroyLinkedList(prev_check, next_check){
        //print('destroying');
        this.world.addParticle(new Org_FertParticle(this.x, this.y, world), true)
        if(prev_check == true){
            for(i = 0; i < this.prev.length; i++){
                if(this.prev[i].inGrid()){
                    this.prev[i].destroyLinkedList(true, false);
                }
            }
        }else if(next_check == true){
            for(i = 0; i < this.next.length; i++){
                if(this.next[i].inGrid()){
                    this.next[i].destroyLinkedList(false, true);
                }
            }
        }
    }

    //ensures the links are still connected
    //destroys particle if not
    // killPlant(){
    //     //if the particle has been removed from the particle grid
    //     //then kill it
    //     if(this instanceof RootParticle){
    //         //print('root delete');
    //         destroyLinkedList(this, false, true);
    //     }else{
    //         //print('plant delete');
    //         destroyLinkedList(this, true, false);
    //     }
    // }

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

        // if(this instanceof FlowerParticle){
        //     print(this.watered);
        // }

        if (this.watered == 1 && this.length < this.lengthLimit) {
            if (this.neighbourGrowthChecker(neighbour)) {
                
                // Check if the empty space I want to grow into doesn't have too
                // many root neighbours

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

                // if(this instanceof FlowerParticle){
                //     print(count);
                // }
                
                //each plant particle may branch a different number of times
                if(count < 2){
                    if ((random() * this.nitrogen) > 0.5) {
                        let p;

                        if(this instanceof HyphaeParticle){ 
                            p = new HyphaeParticle(this, null, xn, yn, world, this.length +1);
                            this.world.addParticle(p, true);
                        }else if(this instanceof RootParticle){
                            p = new RootParticle(this, null, xn, yn, world, this.length +1);
                            this.world.addParticle(p, true);
                        }else if(this instanceof FlowerParticle){
                            p = new FlowerParticle(null, this, xn, yn, world, this.length +1);
                            this.world.addParticle(p);
                        }else if(this instanceof PlantParticle){
                            p = new PlantParticle(null, this, xn, yn, world, this.length +1);
                            this.world.addParticle(p);
                        }
                        
                        this.setWater(-1);
                        if(this.nitrogen == 2){
                            this.nitrogen = 1;
                        }
                    }
                }        
            }

            //if the neighbour that I want to grow into isn't soil
            //give my water and nitrogen upwards
            else{
                let prev_p = random(this.prev);
                if(prev_p){
                    if(prev_p.watered == 0){
                        //print('water is moving');
                        this.water_give(this, prev_p);
                    }
                    if(prev_p.nitrogen == 1 && this.nitrogen == 2){
                        this.nitrogen_give(this, prev_p);
                    }
                }
        }

        }else {
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

        this.randomPlacement = [round(random(-1, -1)), round(random(-1, -1))];

        this.flowerList = [
            [this.randomPlacement[0], this.randomPlacement[1]], //down petal
            [this.randomPlacement[0], this.randomPlacement[1]-1], //centre
            [this.randomPlacement[0]-1, this.randomPlacement[1]-1], //left petal
            [this.randomPlacement[0]+1, this.randomPlacement[1]-1], //right petal
            [this.randomPlacement[0], this.randomPlacement[1]-2], //top petal
        ]

    }

    update(){
        //if length is -1 its a petal
        if(this.length != -1){    
            if(this.length < this.lengthLimit){
                super.update();
            }else{
                if(this.petalCount < this.flowerList.length){
                    let d = this.flowerList[this.petalCount];
                    let xn = this.x + d[0];
                    let yn = this.y + d[1];

                    let newPetal = new FlowerParticle(null, this, xn, yn, world, -1);
                    newPetal.color = this.color_petal;
                    this.world.addParticle(newPetal);
                    this.petalCount += 1;
                }
            }
        
        }
    }
}

class RootParticle extends PlantParticle {

    static BASE_COLOR = '#828051';

    constructor(previous, next, x, y, world, length = 0) {
        super(previous, next, x, y, world);

        //previous particle kept to give water
        this.length = length;
        this.neighbourList = [
            //growth positions
            [0, +1], //down
            [+1, +1], // down right
            [-1, +1], //down left

            [+1, 0], 
            [-1, 0], 
            [0, -1],
            [+1, -1],
            [-1, -1]
        ]

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
    //they change in this function
    neighbourGrowthChecker(n){
        return n instanceof SoilParticle;
    }

    nutrientRetrieval(neighbour){
        if (neighbour instanceof SoilParticle) {
            //If we don't have nutrients, look for them
            if(neighbour.nitrogen > 0 && this.nitrogen == 1){
                //print('nitrogen is being taken from the ground');
                this.nitrogen_give(neighbour, this);
            }
            
            // If we're not watered look for water
            if(neighbour.watered > 0 && this.watered == 0){
                //print('roots are being watered');
                this.water_give(neighbour, this);
            }
        }
    }

    update() {
        super.update();
    }

}

class HyphaeParticle extends RootParticle{
    static BASE_COLOR = '#c9c6b3';

    constructor(previous, next, x, y, world, length = 0){
        super(previous, next, x, y, world);
        this.length = length;
        this.lengthLimit = 3;

        this.neighbourList = [
            //growth positions but one pixel out
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
        this.waterTimer = random(50, 200);
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

    evaporate() {
        this.world.addParticle(new CloudParticle(this.x, this.y, this.world), true);
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

adjustHSBofString = function (colorString, scaleH, scaleS, scaleB) {
    let c = color(colorString);
    colorMode(HSB);
    c = color(hue(c) * scaleH, saturation(c) * scaleS, brightness(c) * scaleB);
    // colorMode(RGB);
    return c.toString('#rrggbb')
}