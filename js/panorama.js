//function GetIfIsOptimalQuality() {

//}




function JsonReader() {
    this.textureJson = JSON.parse(texturesObjectText);
    this.textureUrl = "textures/cube/";
    this.pathChosenMap = "";
    this.pathFirstMap = "";
    this.chosenQuality = "";
    this.optimalQualityThisDevice = "";
    this.cubemap = "";

    for (var i = 0; i < this.textureJson.cubemaps.length; i++) {
        this.cubemap = this.textureJson.cubemaps[i];
        var cubemapName = this.cubemap.name;
        var cubemapPath = this.cubemap.path;
        if (i === 0) {
            this.pathFirstMap = cubemapPath;
        }
        var cubemapQualitiesObject = this.cubemap.qualities;

        var cubemapChoiceContainer = document.createElement("div");
        cubemapChoiceContainer.id = cubemapName + "_ChoiceContainer";
        cubemapChoiceContainer.classList = "CubemapSettingsContainer";

        var cubemapChoiceElement = document.createElement("div");
        cubemapChoiceElement.id = cubemapName + "_div";
        cubemapChoiceElement.classList = "SettingsElements";
        cubemapChoiceElement.setAttribute("data-chosenPath", cubemapPath);
        cubemapChoiceElement.addEventListener('mousedown', onCubeMapChoiceMouseDown, false);
        //cubemapChoiceElement.style = "cursor: pointer; background-color: rgba(0, 70, 0, 0.75); border: 3px solid #000000; border - radius: 8px; padding: 5px;";

        var cubemapChoiceElementText = document.createTextNode(cubemapName);
       
        cubemapChoiceElement.appendChild(cubemapChoiceElementText);
        cubemapChoiceContainer.appendChild(cubemapChoiceElement);

        var cubemapQualityDiv = document.createElement("div");
        cubemapQualityDiv.id = cubemapName + "_quality" + "_div";
        cubemapQualityDiv.classList = "qualityContainer";
        for (var j = cubemapQualitiesObject.length-1; j > -1; j--) {
            var quality = cubemapQualitiesObject[j].quality;
            if (this.GetIfIsOptimalQuality(cubemapQualitiesObject[j].qualityNr)) {
                if (i === 0) {
                    this.optimalQualityThisDevice = quality;
                }
                cubemapChoiceElement.setAttribute("data-optimal-quality", quality);
            }

            var qualityDiv = document.createElement("div");
            qualityDiv.id = cubemapName + "_" + cubemapQualitiesObject[j].name + "_div";
            qualityDiv.classList = "SettingsElements qualityElement";
            qualityDiv.appendChild(document.createTextNode(cubemapQualitiesObject[j].name));
            qualityDiv.setAttribute("data-quality", quality);
            qualityDiv.setAttribute("data-cubemappath", cubemapPath);
            qualityDiv.addEventListener('mousedown', onQualityChoiceMouseDown, false);
            cubemapQualityDiv.appendChild(qualityDiv);
        }
        cubemapChoiceContainer.appendChild(cubemapQualityDiv);

        var controlPanel = document.getElementById('id_ContentFooter');
        controlPanel.appendChild(cubemapChoiceContainer);
    }
}

JsonReader.prototype.GetTexturePath = function () {
    return this.textureUrl + this.pathChosenMap + this.chosenQuality;
};

JsonReader.prototype.SetOptimalTexture = function () {
    this.pathChosenMap = this.pathFirstMap;
    this.chosenQuality = this.optimalQualityThisDevice;
};

JsonReader.prototype.GetIfIsOptimalQuality = function (qualityNr) {
    if (qualityNr == -1) {
        return true;
    }

    if (qualityNr == 0 && window.innerWidth < 400) { //das hier vielleicht durch ne art device - Leistungs - detection ersetzen?...
        return true;
    }

    if (qualityNr == 1) {
        return true;
    }

    return false;
};

//  - objektorientier umbauen <--- das folgende
var camera, scene, renderer;
var target = new THREE.Vector3();
var lon = 90, lat = 0;
var phi = 0, theta = 0;
var touchX, touchY;
var allowConstantAnimation = true;
var constantAnimationSpeed = 0.1;
var constantAnimationDirectionFactor = 1; // default :: rechts
var optionsReader = new JsonReader();
init();


// TODO:: 
//  - eventlistener schaltbar machen (damit im html angegeben werden kann, welches Dom - element als "Steuer - Bereich" gelten soll <--- Musikverein: renderer-Dom-Element; Meine Seite: "Steuer - Button" unten rechts)
//  - auto-dreh - geschwindigkeits - Button / regler
//  - dreh - geschwindigkeit automatisch in ecke des cubes etwas (faktor bestimmen!) beschleunigen, um "smoothere" Animation zu gewaehrleisten  // autausch zur Kugel für die environment - map
//  - position - fixed beim grafik - canvas
//  - "smoothes" stoppen durch geschwindigkskurve


function reloadCubeMap() {
    var TexturePath = optionsReader.GetTexturePath();
    var sides = [
        {
            url: TexturePath + 'posx.jpg',
        },
        {
            url: TexturePath + 'negx.jpg',
        },
        {
            url: TexturePath + 'posy.jpg',
        },
        {
            url: TexturePath + 'negy.jpg',
        },
        {
            url: TexturePath + 'posz.jpg',
        },
        {
            url: TexturePath + 'negz.jpg',
        }
    ];

    for (var i = 0; i < sides.length; i++) {
        var side = sides[i];
        var sidePic = document.getElementById("cubeMapPic_" + i);
        sidePic.src = side.url;
    }


}

function init() {
    optionsReader.SetOptimalTexture();
    var TexturePath = optionsReader.GetTexturePath();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new THREE.Scene();
    let halfPi = Math.PI / 2;

    var sides = [
        {
            url: TexturePath + 'posx.jpg',
            position: [- 512, 0, 0],
            rotation: [0, halfPi, 0]
        },
        {
            url: TexturePath + 'negx.jpg',
            position: [512, 0, 0],
            rotation: [0, - halfPi, 0]
        },
        {
            url: TexturePath + 'posy.jpg',
            position: [0, 512, 0],
            rotation: [halfPi, 0, Math.PI]
        },
        {
            url: TexturePath + 'negy.jpg',
            position: [0, - 512, 0],
            rotation: [- halfPi, 0, Math.PI]
        },
        {
            url: TexturePath + 'posz.jpg',
            position: [0, 0, 512],
            rotation: [0, Math.PI, 0]
        },
        {
            url: TexturePath + 'negz.jpg',
            position: [0, 0, - 512],
            rotation: [0, 0, 0]
        }
    ];



    for (var i = 0; i < sides.length; i++) {
        var side = sides[i];
        var element = document.createElement('img');
        element.id = "cubeMapPic_" + i;
        element.width = 1026; // 2 pixels extra to close the gap.
        element.src = side.url;
        element.oncontextmenu = function () { return false; };
        var object = new THREE.CSS3DObject(element);
        object.position.fromArray(side.position);
        object.rotation.fromArray(side.rotation);
        scene.add(object);
    }

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
	
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    //document.addEventListener('wheel', onDocumentMouseWheel, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);
    document.addEventListener('touchend', onDocumentTouchEnd, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function SetMovementDirectionFromControlMoveValue(value) {
    if (value > -0.001) { //rechts
        constantAnimationDirectionFactor = 1;
    }
    else { // links
        constantAnimationDirectionFactor = -1;
    }
}

function animate() {
    requestAnimationFrame(animate);
	if (allowConstantAnimation === true) {
        lon += constantAnimationSpeed * constantAnimationDirectionFactor;
	}
	lat = Math.max(- 85, Math.min(85, lat));
	phi = THREE.Math.degToRad(90 - lat);
	theta = THREE.Math.degToRad(lon);
	target.x = Math.sin(phi) * Math.cos(theta);
	target.y = Math.cos(phi);
	target.z = Math.sin(phi) * Math.sin(theta);
		
	camera.lookAt(target);
    renderer.render(scene, camera);
}




 //// EVENTS //////
function onCubeMapChoiceMouseDown(event) {
    optionsReader.pathChosenMap = event.currentTarget.getAttribute("data-chosenPath");
    optionsReader.chosenQuality = event.currentTarget.getAttribute("data-optimal-quality");
    reloadCubeMap();
}

function onQualityChoiceMouseDown(event) {
    optionsReader.pathChosenMap = event.currentTarget.getAttribute("data-cubemappath");
    optionsReader.chosenQuality = event.currentTarget.getAttribute("data-quality");
    reloadCubeMap();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseDown(event) {
    allowConstantAnimation = false;
    event.preventDefault();
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
}

function onDocumentMouseMove(event) {
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    lon -= movementX * 0.1;
    lat += movementY * 0.1;
    SetMovementDirectionFromControlMoveValue(-movementX);
}

function onDocumentMouseUp() {
    allowConstantAnimation = true;
    document.removeEventListener('mousemove', onDocumentMouseMove);
    document.removeEventListener('mouseup', onDocumentMouseUp);
}

function onDocumentMouseWheel(event) {
    var fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.Math.clamp(fov, 10, 75);
    camera.updateProjectionMatrix();
}

function onDocumentTouchStart(event) {
    allowConstantAnimation = false;
    event.preventDefault();
    var touch = event.touches[0];
    touchX = touch.screenX;
    touchY = touch.screenY;
}

function onDocumentTouchMove(event) {
    event.preventDefault();
    var touch = event.touches[0];
    var xMoveDistance = touch.screenX - touchX;
    lon -= (xMoveDistance) * 0.1;
    lat += (touch.screenY - touchY) * 0.1;
    SetMovementDirectionFromControlMoveValue(-xMoveDistance);
    touchX = touch.screenX;
    touchY = touch.screenY;
}

function onDocumentTouchEnd(event) {
    allowConstantAnimation = true;
}

