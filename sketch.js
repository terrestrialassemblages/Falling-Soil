let pixelsPerParticle = 4;
let world;

let canvasContext;
let numParticleDisplay;

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

const AIR_WEIGHT = 1;

const PLACEABLE_TYPES = {
	'Soil' : SoilParticle,
	'Water': WaterParticle,
	'Vapour': CloudParticle,
	'Seed' : SeedParticle,
	'Microbe' : MicrobeParticle,
	'Nitrogen' : Syn_FertParticle,
	'Biomass' : BiomassParticle,
	'Spider' : SpiderParticle,
	'Protozoa' : ProtozoaParticle,
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

	brushSizeSlider = createSlider(1, min(10, min(world.gridWidth, world.gridHeight)), 2, 1);
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

	// //create sun
	// world.addPlaceable(
	// 	new SunParentParticle(20, 15, world),
	// 	true);

	// ******************** SETUP WORLD ********************
	// world.initializeEmptyGrid();

	// noStroke();
}

function draw() {
	//set the framerate
	frameRate(30)

	brushSizeDisplay.html('Brush Size: ' + brushSizeSlider.value());

	//Remove the low framerate warning message
	if(floor(averageFrameRate()) > 25){
		document.getElementById("textDisplay").innerHTML = '';
	}

	handleMouseClick();

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
	// noLoop();

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
							//this ensures that the deletion gets recorded and plant death occurs
							let p = world.getPlaceable(ix, iy);
							if (p) {
								world.deletePlaceable(p);
							}

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

