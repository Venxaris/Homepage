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

        var controlPanel = document.getElementById('id_menustrip');
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


var phi = 0, theta = 0;
var touchX, touchY;
var constantAnimationSpeed = 0.1;
var constantAnimationDirectionFactor = 1;
var optionsReader = new JsonReader();

var Panorama = function () {
    this.ThreeJsRendererContainer;
    this.doINeedToDebug = true;
    this.stats;
    if (this.doINeedToDebug) {
        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
    }
    this.gameLoop;
    this.onMouseLeaveEvent;
    this.onMouseLeaveEventSet = false;
    this.camera;
    this.scene;
    this.renderer;
    this.target = new THREE.Vector3();
    this.allowConstantAnimation = true;
    
    this.lon = 90;
    this.oldLon = 0;
    this.smoothLonTransitionCurrentSpeed = 0.0;
    this.smoothLonTransitionDirection = 0;
    this.smoothLonTransitionMaxValue = 0.4;
    this.smoothLonTransitionMinValue = 0.1;
    this.smoothLonTransitionDecreaseAmout = 0.01;
    this.setLonSmoothingValues = function () {
        if (this.oldLon != this.lon) {
            this.smoothLonTransitionCurrentSpeed = this.oldLon - this.lon;
            if (this.smoothLonTransitionCurrentSpeed < 0.0) {
                this.smoothLonTransitionCurrentSpeed *= (-1);
                this.smoothLonTransitionDirection = 1;
            }
            else {
                this.smoothLonTransitionDirection = -1;
            }

            if (this.smoothLonTransitionCurrentSpeed > this.smoothLonTransitionMaxValue) {
                this.smoothLonTransitionCurrentSpeed = this.smoothLonTransitionMaxValue;
            }
            if (this.smoothLonTransitionCurrentSpeed < this.smoothLonTransitionMinValue) {
                this.smoothLonTransitionCurrentSpeed = this.smoothLonTransitionMinValue;
            }
        }
    }

    this.lat = 0;
    this.oldLat = 0;
    this.smoothLatTransitionCurrentSpeed = 0.0;
    this.smoothLatTransitionDirection = 0;
    this.smoothLatTransitionMaxValue = 0.23;
    this.smoothLatTransitionMinValue = 0.05;
    this.smoothLatTransitionDecreaseAmout = 0.01;
    this.setLatSmoothingValues = function () {
        if (this.oldLat != this.lat) {
            this.smoothLatTransitionCurrentSpeed = this.oldLat - this.lat;
            if (this.smoothLatTransitionCurrentSpeed < 0.0) {
                this.smoothLatTransitionCurrentSpeed *= (-1);
                this.smoothLatTransitionDirection = 1;
            }
            else {
                this.smoothLatTransitionDirection = -1;
            }

            if (this.smoothLatTransitionCurrentSpeed > this.smoothLatTransitionMaxValue) {
                this.smoothLatTransitionCurrentSpeed = this.smoothLatTransitionMaxValue;
            }
            if (this.smoothLatTransitionCurrentSpeed < this.smoothLatTransitionMinValue) {
                this.smoothLatTransitionCurrentSpeed = this.smoothLatTransitionMinValue;
            }
        }
    }


    //Event - Methoden
    this.onJsRendererContainerMouseLeave = function () {
        if (this.onMouseLeaveEventSet == true) {
            this.onMouseLeaveEvent();
            return;
        }

        this.allowConstantAnimation = true;
        this.setLonSmoothingValues();
        this.setLatSmoothingValues();
    }

    this.onJsRendererContainerMouseMove = function () {
        if (this.allowConstantAnimation == false) {
            var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            var movementXLonModifier = movementX * 0.1;
            this.lon -= movementXLonModifier;
            this.lat += movementY * 0.1;
            SetMovementDirectionFromControlMoveValue(-movementX);
        }
    }

    this.onJsRendererContainerMouseUp = function () {
        this.allowConstantAnimation = true;
        this.setLonSmoothingValues();
        this.setLatSmoothingValues();
    }

    this.onJsRendererContainerMouseDown = function () {
        this.allowConstantAnimation = false;
        event.preventDefault();
        this.oldLon = this.lon;
        this.oldLat = this.lat;
    }

    this.onJsRendererContainerTouchStart = function () {
        this.allowConstantAnimation = false;
        var touch = event.touches[0];
        touchX = touch.screenX;
        touchY = touch.screenY;
        this.oldLon = this.lon;
        this.oldLat = this.lat;
    }

    this.onJsRendererContainerTouchMove = function () {
        var touch = event.touches[0];
        var xMoveDistance = touch.screenX - touchX;
        var xMoveDistanceLonModifier = (xMoveDistance) * 0.1;
        this.lon -= xMoveDistanceLonModifier;
        this.lat += (touch.screenY - touchY) * 0.1;
        SetMovementDirectionFromControlMoveValue(-xMoveDistance);
        touchX = touch.screenX;
        touchY = touch.screenY;
    }

    this.onJsRendererContainerTouchEnd = function () {
        this.allowConstantAnimation = true;
        this.setLonSmoothingValues();
        this.setLatSmoothingValues();
    }
}

Panorama.prototype.SetGameLoopFunction = function (GameLoopFunction) {
    this.gameLoop = GameLoopFunction;
}

Panorama.prototype.SetOnMouseLeaveEventFunction = function (onMouseLeaveEventFunction) {
    this.onMouseLeaveEvent = onMouseLeaveEventFunction;
    this.onMouseLeaveEventSet = true;
}

Panorama.prototype.animate = function () {
    if (this.doINeedToDebug == true) {
        this.stats.update();
    }


    if (this.allowConstantAnimation === true) {
        this.lon += constantAnimationSpeed * constantAnimationDirectionFactor;
    }
    this.lon += this.smoothLonTransitionCurrentSpeed * this.smoothLonTransitionDirection;
    if (this.smoothLonTransitionCurrentSpeed > 0.0) {
        this.smoothLonTransitionCurrentSpeed -= this.smoothLonTransitionDecreaseAmout;
    }
    else {
        this.smoothLonTransitionCurrentSpeed = 0.0;
    }



    this.lat = Math.max(- 85, Math.min(85, this.lat));
    this.lat += this.smoothLatTransitionCurrentSpeed * this.smoothLatTransitionDirection;
    if (this.smoothLatTransitionCurrentSpeed > 0.0) {
        this.smoothLatTransitionCurrentSpeed -= this.smoothLatTransitionDecreaseAmout;
    }
    else {
        this.smoothLatTransitionCurrentSpeed = 0.0;
    }

    phi = THREE.Math.degToRad(90 - this.lat);
    theta = THREE.Math.degToRad(this.lon);
    this.target.x = Math.sin(phi) * Math.cos(theta);
    this.target.y = Math.cos(phi);
    this.target.z = Math.sin(phi) * Math.sin(theta);

    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
}

Panorama.prototype.init = function (threeJsRendererContainerID, optionalControlElementId = "") {
    optionsReader.SetOptimalTexture();
    var TexturePath = optionsReader.GetTexturePath();

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    this.scene = new THREE.Scene();
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
        this.scene.add(object);
    }

    this.renderer = new THREE.CSS3DRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.classList += "ThreeJsRenderer";
    this.ThreeJsRendererContainer = document.getElementById(threeJsRendererContainerID);
    this.ThreeJsRendererContainer.appendChild(this.renderer.domElement);

    var controlContainer = document.getElementById(optionalControlElementId);
    if (optionalControlElementId == '') {
        controlContainer = document.getElementById(threeJsRendererContainerID);
    }

    var panoramaObjectInstance = this;
    controlContainer.addEventListener('mouseleave', (function () { panoramaObjectInstance.onJsRendererContainerMouseLeave(); }), false);
    controlContainer.addEventListener('mousedown', (function () { panoramaObjectInstance.onJsRendererContainerMouseDown(); }), false);
    controlContainer.addEventListener('mouseup', (function () { panoramaObjectInstance.onJsRendererContainerMouseUp(); }), false);
    controlContainer.addEventListener('mousemove', (function () { panoramaObjectInstance.onJsRendererContainerMouseMove(); }), false);

    controlContainer.addEventListener('touchstart', (function () { panoramaObjectInstance.onJsRendererContainerTouchStart(); }), false);
    controlContainer.addEventListener('touchmove', (function () { panoramaObjectInstance.onJsRendererContainerTouchMove(); }), false);
    controlContainer.addEventListener('touchend', (function () { panoramaObjectInstance.onJsRendererContainerTouchEnd(); }), false);

    this.gameLoop();
}

// TODO:: 
//  - auto-dreh - geschwindigkeits - Button / regler
//  - dreh - geschwindigkeit automatisch in ecke des cubes etwas (faktor bestimmen!) beschleunigen, um "smoothere" Animation zu gewaehrleisten  // autausch zur Kugel für die environment - map

//// In - Event - Funktionen 
function SetMovementDirectionFromControlMoveValue(value) {
    if (value > -0.001) { //rechts
        constantAnimationDirectionFactor = 1;
    }
    else { // links
        constantAnimationDirectionFactor = -1;
    }
}

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

function onDocumentMouseWheel(event) {
    var fov = camera.fov + event.deltaY * 0.05;
    camera.fov = THREE.Math.clamp(fov, 10, 75);
    camera.updateProjectionMatrix();
}



