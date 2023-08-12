AFRAME.registerComponent('smooth-locomotion', {
  schema: {
    speed: { type: 'float', default: 2 },
    active: { type: 'boolean', default: false },
    fly: { type: 'boolean', default: false },
  },
  init: function () {
    // Do nothing if this controller isn't meant to smooth locomote
    if (!this.data.active) return;

    // Get scene element references
    this.player = document.querySelector('#player');
    this.head = document.querySelector('#head');
    var leftHand = document.querySelector('#controllerL');

    // Set up variables to store controller input data and three.js data
    this.moveX = 0;
    this.moveY = 0;
    this.moveVector = new THREE.Vector3();
    this.headRot = new THREE.Euler(0, 0, 0, 'YXZ'); // Y rotations will be applied first

    // Hook up event listeners for the relevant movement input events.
    // Will try to read thumbstick input before trackpad input.
    leftHand.addEventListener('axismove', event => {
      this.moveX = event.detail.axis[2] != 0 ? event.detail.axis[2] : event.detail.axis[0];
      this.moveY = event.detail.axis[3] != 0 ? event.detail.axis[3] : event.detail.axis[1];
    });
  },
  tick: function (time, timeDelta) {
    // Do nothing if this controller isn't meant to smooth locomote
    if (!this.data.active) return;

    // If there's input coming in, move the player
    if (this.moveX + this.moveY != 0)
      this.move(timeDelta / 1000);
  },
  move: function (dt) {
    // Get our initial move vector and normalize it
    this.moveVector.set(this.moveX, 0, this.moveY).normalize();
    // Store our head rotation into our Euler variable
    this.headRot.setFromQuaternion(head.object3D.quaternion);
    // If we don't want to fly, this zeroes out any movement that isn't side-to-side
    if (!this.data.fly) this.headRot.set(0, this.headRot.y, 0);
    // Scale our movement vector based on speed
    const scaledMovement = this.moveVector.multiplyScalar(this.data.speed * dt);
    // Adjust our vector based on where we're looking and then move the player
    player.object3D.position.add(scaledMovement.applyEuler(this.headRot).applyQuaternion(this.player.object3D.quaternion));
  },
});

AFRAME.registerComponent('turn-controls', {
  schema: {
    turnType: { type: 'string', default: 'none' },
    snapDegrees: { type: 'float', default: 45 },
    turnSpeed: { type: 'float', default: 2 }
  },
  init: function () {
    // Do nothing if this controller isn't meant to turn or the turnType is invalid
    if (this.data.turnType == 'none') return;
    this.invalid = this.data.turnType != 'snap' && this.data.turnType != 'smooth'
    if (this.invalid) {
      console.log("You have not entered a valid turnType! Only none, snap, and smooth are accepted.");
      return;
    }

    // Get scene element references
    this.player = document.querySelector('a-scene').querySelector('#player');
    this.head = player.querySelector('#head');
    var controllerR = document.querySelector('a-scene').querySelector('#controllerR');

    // Set up variables to read controller input and control turn logic
    this.rotateX = 0;
    this.justSnapped = false;
    this.unsnapZone = .99;

    // Set up variables to facilitate position adjustment after turning
    this.lastHeadPos = new THREE.Vector3();
    this.currentHeadPos = new THREE.Vector3();
    this.newHeadPos = new THREE.Vector3();

    // Hook up event listeners for the relevant turning input events
    controllerR.addEventListener('axismove', (event) => {
      this.rotateX = event.detail.axis[2] != 0 ? event.detail.axis[2] : event.detail.axis[0];
    });
  },
  tick: function (time, timeDelta) {
    // Do nothing if this controller isn't meant to turn or the turnType is invalid
    if (this.data.turnType == 'none' || this.invalid) return;

    // Adjust position and turn based on schema
    if (this.data.turnType == 'snap') this.snapTurn();
    if (this.data.turnType == 'smooth') this.smoothTurn(timeDelta / 1000);

  },
  snapTurn: function () {
    // If player hasn't snapped yet and input is max on either end, rotate the player by snapDegrees
    if (!this.justSnapped) {
      if (Math.abs(this.rotateX) == 1) {
        this.lastHeadPos.setFromMatrixPosition(this.head.object3D.matrixWorld);
        this.player.object3D.rotation.y += (this.data.snapDegrees * (Math.PI / 180) * -this.rotateX);
        this.player.object3D.updateMatrixWorld();
        this.newHeadPos.setFromMatrixPosition(this.head.object3D.matrixWorld);
        this.player.object3D.position.add(this.lastHeadPos.sub(this.newHeadPos));
        this.justSnapped = true;
      }
    }
    // If player has snapped, check to see if they've moved away from either end
    else if (this.rotateX > -this.unsnapZone && this.rotateX < this.unsnapZone)
      this.justSnapped = false;
  },
  smoothTurn: function (dt) {
    // If there's input, rotate the player smoothly
    if (this.rotateX != 0) {
      this.lastHeadPos.setFromMatrixPosition(this.head.object3D.matrixWorld);
      this.player.object3D.rotation.y += -this.rotateX * dt * this.data.turnSpeed;
      this.player.object3D.updateMatrixWorld();
      this.newHeadPos.setFromMatrixPosition(this.head.object3D.matrixWorld);
      this.player.object3D.position.add(this.lastHeadPos.sub(this.newHeadPos));
    }
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
    },
    mappings: {
        hand: 'hand-controls.hand',
        move: 'smooth-locomotion.active',
        speed: 'smooth-locomotion.speed',
        turn: 'turn-controls.active',
        'turn-type': 'turn-controls.turnType'
    }
});