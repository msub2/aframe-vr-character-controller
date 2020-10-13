AFRAME.registerComponent('smooth-locomotion', {
    schema: {
        speed: { type: 'float', default: 2 },
        active: { type: 'boolean', default: false },
        fly: { type: 'boolean', default: false }
    },
    init: function() {
        //Do nothing if this controller isn't meant to smooth locomote
        if (!this.data.active) return;

        //Get scene element references
        this.player = document.querySelector('a-scene').querySelector('#player');
        this.head = player.querySelector('#head');
        var controllerL = document.querySelector('a-scene').querySelector('#controllerL');

        //Set up variables to store controller input data
        this.moveX = 0;
        this.moveY = 0;
        this.thumbstickPressed = false;

        //Hook up event listeners for the relevant movement input events.
        //Not perfect given they all take different events, but this should work for now
        controllerL.addEventListener('thumbstickmoved', (event) => { 
            this.moveX = event.detail.x;
            this.moveY = event.detail.y;            
         });
         controllerL.addEventListener('thumbstickchanged', (event) => { 
            if (!this.thumbstickPressed) {
                this.moveX = event.detail.x;
                this.moveY = event.detail.y;
            }
         });
         controllerL.addEventListener('trackpadchanged', (event) => { 
            this.moveX = event.detail.x;
            this.moveY = event.detail.y;
         });
        controllerL.addEventListener('thumbstickdown', () => { this.thumbstickPressed = true; });
        controllerL.addEventListener('thumbstickup', () => { this.thumbstickPressed = false; });
    },
    tick: function(time, timeDelta) {
        //Do nothing if this controller isn't meant to smooth locomote
        if (!this.data.active) return;

        //If there's input coming in, move the player
        if (this.moveX + this.moveY != 0)
            this.move(this.moveX, this.moveY, timeDelta / 1000);
    },
    move: function(x, y, dt) {
        let direction = [x, 0, y]; //Initial move vector from the controller
        let headRot = head.object3D.quaternion.toArray(); //Head rotation as quaternion so glMatrix can read it

        //Rotate our input vector by our head rotation, then scale by delta time and speed
        glMatrix.vec3.transformQuat(direction, direction, headRot);
        glMatrix.vec3.scale(direction, direction, dt * this.data.speed);

        //Move player
        player.object3D.translateX(direction[0]);
        if (this.data.fly) player.object3D.translateY(direction[1]);
        player.object3D.translateZ(direction[2]);
    }
});

AFRAME.registerComponent('turn-controls', {
    schema: {
        turnType: { type: 'string', default: 'none' },
        snapDegrees: { type: 'float', default: 45 },
        turnSpeed: { type: 'float', default: 2 }
    },
    init: function() {
        //Do nothing if this controller isn't meant to turn or the turnType is invalid
        if (this.data.turnType == 'none') return;
        this.invalid = this.data.turnType != 'snap' && this.data.turnType != 'smooth'
        if (this.invalid) {
            console.log("You have not entered a valid turnType! Only none, snap, and smooth are accepted.");
            return;
        }

        //Get scene element references
        this.player = document.querySelector('a-scene').querySelector('#player');
        this.head = player.querySelector('#head');        
        var controllerR = document.querySelector('a-scene').querySelector('#controllerR');

        //Set up variables to read controller input and control turn logic
        this.rotateX = 0;
        this.justSnapped = false;
        this.unsnapZone = .99;

        //Set up variables to facilitate position adjustment after turning
        this.lastHeadPos = new THREE.Vector3();
        this.currentHeadPos = new THREE.Vector3();
        this.posAdjustNeeded = false;

        //Hook up event listeners for the relevant turning input events
        controllerR.addEventListener('thumbstickmoved', (event) => { this.rotateX = event.detail.x; });
        controllerR.addEventListener('thumbstickchanged', (event) => { this.rotateX = event.detail.x; });
        controllerR.addEventListener('trackpadmoved', (event) => { this.rotateX = event.detail.x; });
    },
    tick: function(time, timeDelta) {
        //Do nothing if this controller isn't meant to turn or the turnType is invalid
        if (this.data.turnType == 'none' || this.invalid) return;

        //Adjust position and turn based on schema
        if (this.posAdjustNeeded) this.posAdjust();
        if (this.data.turnType == 'snap') this.snapTurn();
        if (this.data.turnType == 'smooth') this.smoothTurn(timeDelta / 1000);

    },
    snapTurn: function() {
        //If player hasn't snapped yet and input is max on either end, rotate the player by snapDegrees
        if (!this.justSnapped) {
            if (Math.abs(this.rotateX) == 1) {                
                this.lastHeadPos.setFromMatrixPosition(this.head.object3D.matrixWorld);
                this.player.object3D.rotation.y += (this.data.snapDegrees * (Math.PI / 180) * -this.rotateX);                
                this.justSnapped = true;
                this.posAdjustNeeded = true;
            }
        }
        //If player has snapped, check to see if they've moved away from either end
        else if (this.rotateX > -this.unsnapZone && this.rotateX < this.unsnapZone) 
            this.justSnapped = false;
    },
    smoothTurn: function(dt) {
        //If there's input, rotate the player smoothly
        if (this.rotateX != 0) {
            this.lastHeadPos.setFromMatrixPosition(this.head.object3D.matrixWorld);
            this.player.object3D.rotation.y += -this.rotateX * dt * this.data.turnSpeed;
            this.posAdjustNeeded = true;
        }
    },
    posAdjust: function() {
        //You need to adjust for your shifted head position after rotating the player rig,
        //but it doesn't work the same function as the turn because of some nonsense with A-Frame and WebXR.
        //So instead, this function corrects for it on the tick after the turn.
        let newHeadPos = new THREE.Vector3().setFromMatrixPosition(this.head.object3D.matrixWorld);
        this.player.object3D.position.add(this.lastHeadPos.sub(newHeadPos));
        this.posAdjustNeeded = false;
    }
});

AFRAME.registerPrimitive('a-controller', {
    defaultComponents: {
        'smooth-locomotion': {},
        'turn-controls': {},
        'hand-controls': { hand: 'left', handModelStyle: 'lowPoly', color: '#ffcccc' },
        grab: {},
        'vive-controls': {},
        'oculus-touch-controls': {},
        'windows-motion-controls': {},
        'teleport-controls': { cameraRig: '#player', button: 'trigger', teleportOrigin: '#head' }
    },
    mappings: {
        hand: 'hand-controls.hand',
        move: 'smooth-locomotion.active',
        speed: 'smooth-locomotion.speed',
        turn: 'turn-controls.active',
        'turn-type': 'turn-controls.turnType'
    }
});