# A-Frame VR Character Controller

This is something I developed for my own use so that I could have a ready-made character controller with smooth locomotion, teleporting, snap turning, and smooth turning.
It wraps the hand-controls, vive-controls, oculus-touch-controls, and windows-motion-controls components into an <a-controller> primitive, and makes use of glMatrix and aframe-teleport-controls.
I'll likely make more updates in the future, but this should be more than functional for now.

## Usage

To use the character controller, just copy the following HTML code into your `<a-scene>`:

    <a-entity id="player">
        <a-entity id="head" camera wasd-controls look-controls></a-entity>        
        <a-controller id="controllerL" hand="left" move="true"></a-controller>
        <a-controller id="controllerR" hand="right" turn-type="snap"></a-controller>
    </a-entity>


By default, this will give you:
- Teleportation with trigger on both hands
- Smooth locomotion on the left thumbstick/trackpad with a speed of 2
- Snap turning on the right thumbstick/trackpad with a default snap angle of 45 degrees.

Movement and rotation have been allocated to their specific controllers based on what I feel is most common practice, but you can easily make modifications to switch them.

## Components

There are two components: smooth-locomotion and turn-controls.

### smooth-locomotion

| Attribute Name | Type  | Default Value | Info                                                      |   |
|----------------|-------|---------------|-----------------------------------------------------------|---|
| speed          | float | 2             | Player movement speed                                         |   |
| active         | bool  | false         | Whether controller should be used to move                 |   |
| fly            | bool  | false         | Allows player to move up and down based on look direction |   |

### turn-controls

| Attribute Name | Type   | Default Value | Info                                                                                                                                                         |   |
|----------------|--------|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|---|
| turnType       | string | "none"        | Method of turning. "none" disables the component. "snap" uses snap turning. "smooth" uses smooth turning. Anything else will log an error and act as "none". |   |
| snapDegrees    | float  | 45            | Angle in degrees to rotate player on snap                                                                                                                    |   |
| turnSpeed      | float  | 2             | Player smooth turning speed                                                                                                                                  |   |
