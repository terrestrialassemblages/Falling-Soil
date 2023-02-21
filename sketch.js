let pixelsPerParticle = 4;
let world;

let canvasContext;
let numParticleDisplay;
let githubDisplay;

let frHistory = [];
let frHistoryIndex = 0;
let frDisplay;
let frSlider;
let pauseButton;
let paused = false;
let resetButton;
let scaleSlider;
let scaleLabel;
let sizeInputX;
let sizeInputY;
let sizeInputXlabel;
let sizeInputYlabel;
let resizeButton;
let randomButton;
let randomThresholdSlider;
let randomScaleSlider;

let radio;
let brushSizeSlider;
let brushSizeDisplay;
let brushReplaceCheckbox;

let randomSpawnCount = 0;
let previousAction;

const AIR_WEIGHT = 1;

const PLACEABLE_TYPES = {
	'Soil' : SoilParticle,
	'Water': WaterParticle,
	'Vapour': CloudParticle,
	'Seed' : SeedParticle,
	'Microbe' : MicrobeParticle,
	'Nitrogen' : Syn_FertParticle,
	'Biomass' : BiomassParticle,
	'Bug' : BugParticle,
	'Protozoa' : ProtozoaParticle,
	'Wall' : WallParticle,
}


function setup() {

	world = new World(windowWidth / 5, windowHeight / 5);

	// ******************** SETUP UI ********************

	// Create p5 Canvas
	let p5canvas = createCanvas(pixelsPerParticle * world.gridWidth,
		pixelsPerParticle * world.gridHeight);
	//pixelDensity(1);

	// Add the canvas to the page
	p5canvas.parent('canvas-div');

	// Initialize native JS/HTML5 canvas object, since writing basic rectangles
	// to it is faster than using p5
	let canvas = document.getElementById('defaultCanvas0');
	canvasContext = canvas.getContext('2d');

	// Radio buttons for selecting particle type to draw
	radio = createRadio(document.getElementById('particle-selector'));
	radio.parent('gui-div');

	// Other Various UI elements:
	//brush size elements and slider
	let brushDiv = createDiv();
	brushDiv.parent('gui-div');
	brushDiv.class('button-row');

	brushSizeDisplay = createP('');
	brushSizeDisplay.parent(brushDiv);

	brushSizeSlider = createSlider(1, 4, 2, 1);
	brushSizeSlider.parent(brushDiv);
	brushReplaceCheckbox = createCheckbox('Replace?', true)
	brushReplaceCheckbox.parent(brushDiv);

	//pause and reset button
	let simDiv = createDiv();
	simDiv.parent('gui-div');
	simDiv.class('button-row');

	pauseButton = createImg('pause-icon.png');
	pauseButton.parent(simDiv);
	pauseButton.mouseClicked(pauseSim);

	resetButton = createImg('refresh-icon.png');
	resetButton.parent(simDiv);
	resetButton.mouseClicked(resetWorld);

	//framerate
	frDisplay = createP('');
	frDisplay.parent(simDiv);
	frHistory = new Array(60);

	//particle numbers display
	numParticleDisplay = createP('');
	numParticleDisplay.parent('gui-div');
	
	let radBtnDefault = document.getElementById("Vapour");
	radBtnDefault.checked = true;

	// //create sun
	// world.addPlaceable(
	// 	new SunParentParticle(20, 15, world),
	// 	true);

	// ******************** SETUP WORLD ********************
	// world.initializeEmptyGrid();

	// noStroke();
}

function draw() {
	try{
		//set the framerate
	frameRate(30)

	brushSizeDisplay.html('Brush Size: ' + brushSizeSlider.value());

	//Remove the low framerate warning message
	if(floor(averageFrameRate()) > 22){
		document.getElementById("textDisplay").innerHTML = '';
	}

	handleMouseClick();
	handleTextDisplay();

	if (!paused) {
		world.updateAll();
	}

	canvasContext.save()

	// Separate loop for showing because sometimes particles will be moved by others after they update
	world.showAll(canvasContext, pixelsPerParticle);
	canvasContext.restore();

	//show framerate and particle display
	frDisplay.html('Average FPS: ' + floor(averageFrameRate()));
	numParticleDisplay.html('Number of Particles: ' + world.placeableSet.size);

	}catch(err){
		document.getElementById("textDisplay").innerHTML = "Oops! Looks like you caught a program bug we haven't yet. Sorry about that, just refresh the program and hopefully it doesn't happen again :)";
	}
	

}

//here is where the information text changes
handleTextDisplay = function(){
	let action = radio.value();
	if(action != previousAction){
		if(action == 'Soil'){
			document.getElementById("buttonTextDisplay").innerHTML = 'Soil is home to many organisms beneficial to plant growth. Try placing some seeds and see what happens.';
		}else if(action == 'Water'){
			document.getElementById("buttonTextDisplay").innerHTML = 'Water is essential for life.';
		}else if(action == 'Vapour'){
			document.getElementById("buttonTextDisplay").innerHTML = 'Evaporated water!';
		}else if(action == 'Seed'){
			document.getElementById("buttonTextDisplay").innerHTML = 'Seeds grow plants and flowers in the right conditions. As the roots grow so does its community of beneficial microbes and fungi. <br><br>The white dashed hyphae extending from the roots can be found with almost any plant you pull out from the ground. This is an important fungi/plant relationship that uses the trading of sugars from the plant for beneficial nutrients. <br><br>The pink microbes below need to be eaten by protozoa to release their nutrients, try placing some!';
		}else if(action == 'Microbe'){
			document.getElementById("buttonTextDisplay").innerHTML = "Each plant cultivates its own population of good bacteria, much like we do in our gut. These microbes fight off bad bacteria and collect hard-to-get nutrients that the plant can't break down.";
		}else if(action == 'Protozoa'){
			document.getElementById("buttonTextDisplay").innerHTML = "Protozoa are the secondary predator in this ecosystem, they feast on microbes and excrete their nutrients for the plant. This isn't their entire purpose, but it's definitely a beneficial food chain for our plants!";
		}else if(action == "Bug"){
			document.getElementById("buttonTextDisplay").innerHTML = "Biomass created by decomposing plants can be gobbled up by our bugs to create organic fertiliser for the soil. Not only that, but protozoa are pretty tasty to them too.";
		}else if(action == "Nitrogen"){
			document.getElementById("buttonTextDisplay").innerHTML = "This is synthetic fertiliser, a great resource for growing plants but not so great to our soil life. The high salt content in these fertilisers sucks the moisture out of microbes and compacts the soil. Use with caution!";
		}else if(action == "Biomass"){
			document.getElementById("buttonTextDisplay").innerHTML = "Biomass has all the good nutrients to support a thriving soil ecosystem.";
		}else if(action == "Wall"){
			document.getElementById("buttonTextDisplay").innerHTML = "Walls provide an option to get creative.";
		}
	}
	previousAction = action;
}


updateCanvasSize = function () {
	//change canvas to always be window size / 5
	resizeCanvas(windowWidth / 5 * pixelsPerParticle,
		windowHeight / 5 * pixelsPerParticle);

	let canvas = document.getElementById('defaultCanvas0');
	canvasContext = canvas.getContext('2d');
}


averageFrameRate = function () {
	frHistory[frHistoryIndex] = frameRate();
	frHistoryIndex += 1;
	if (frHistoryIndex >= frHistory.length) {
		frHistoryIndex = 0;
	}

	sum = 0;
	for (let i = 0; i < frHistory.length; i++) {
		sum += frHistory[i];
	}
	return sum / frHistory.length;
}


pauseSim = function () {
	paused = !paused;
}

resetWorld = function () {
	let w = windowWidth / 5;
	let h = windowHeight / 5;
	world.reset(w, h);

	resizeCanvas(windowWidth / 5 * pixelsPerParticle,
		windowHeight / 5 * pixelsPerParticle);
	let canvas = document.getElementById('defaultCanvas0');
	canvasContext = canvas.getContext('2d');
}


handleMouseClick = function () {
	//only allow the adding of pixels if the framerate is above 25
	if (mouseIsPressed && floor(averageFrameRate()) > 25) {
		let x = floor(mouseX / pixelsPerParticle);
		let y = floor(mouseY / pixelsPerParticle);

		//add particles if mouse click is within world bounds
		if (x <= world.gridWidth - 2 && x >= 1 && y <= world.gridHeight - 2 && y >= 1) {

			//add particles relative to the brush size
			let brushSize = brushSizeSlider.value();
			let imin = floor(-0.5 * (brushSize - 1));

			for (i = imin; i < imin + brushSize; i++) {
				let ix = x + i;
				for (j = imin; j < imin + brushSize; j++) {
					let iy = y + j;
					if (ix <= world.gridWidth - 2 && ix >= 1 && iy <= world.gridHeight - 2 && iy >= 1) {
						//get action from button selected
						let action = radio.value();

						//remove particle from update grid if deleting
						if (action === 'Delete') {
							let p = world.getPlaceable(ix, iy);
							if (p) {
								world.deletePlaceable(p);
							}
						}

						else if(action in PLACEABLE_TYPES){
							//add particle
							world.addPlaceable(
							new PLACEABLE_TYPES[action](ix, iy, world),
							brushReplaceCheckbox.checked());
						}
					}
				}
			}
		}

	//show error message if framerate is too high
	}else if (mouseIsPressed){
		document.getElementById("textDisplay").innerHTML = 'Give the program a moment...';
	}
}


