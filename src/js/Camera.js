import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class Camera {
    constructor(experience) {
        this.experience = experience;
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        
        // Camera configuration - increase distance for the enlarged car
        this.followDistance = 30; // Increased from 10 to accommodate larger car
        this.followHeight = 10;   // Increased from 5 for better overview
        this.lookOffset = new THREE.Vector3(0, 1.5, 0); // Adjusted look target
        
        // Camera smoothing
        this.lerpFactor = 0.05;
        this.cameraTargetPosition = new THREE.Vector3();
        this.cameraTargetLookAt = new THREE.Vector3();
        this.lastCarDirection = new THREE.Vector3(0, 0, -1);

        try {
            this.setInstance();
            // Only create orbit controls for debug mode
            if (this.experience.debug && this.experience.debug.active) {
                this.setControls();
            }
            console.log("Camera initialized successfully");
        } catch (error) {
            console.error("Error initializing camera:", error);
            this.setFallbackInstance();
        }
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            35,
            this.sizes.width / this.sizes.height,
            0.1,
            10000 // Increased from 100 to 10000 to see the extended floor
        );
        
        // Set the initial camera position
        this.instance.position.set(10, 2, 0);
        this.scene.add(this.instance);
    }

    setFallbackInstance() {
        console.log("Creating fallback camera");
        // Create a basic camera if the main one fails
        this.instance = new THREE.PerspectiveCamera(
            35,
            window.innerWidth / window.innerHeight,
            0.1,
            10000 // Increased from 100 to 10000 to see the extended floor
        );
        this.instance.position.set(0, 5, 10);
        if (this.scene) {
            this.scene.add(this.instance);
        }
    }

    setControls() {
        if (!this.instance || !this.canvas) {
            console.warn("Cannot create controls: missing camera instance or canvas");
            return;
        }
        
        try {
            this.controls = new OrbitControls(this.instance, this.canvas);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 20;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below the ground
        } catch (error) {
            console.error("Failed to create camera controls:", error);
            this.controls = null;
        }
    }

    resize() {
        if (this.instance) {
            this.instance.aspect = this.sizes.width / this.sizes.height;
            this.instance.updateProjectionMatrix();
        }
    }

    update() {
        // Update controls if they exist
        if (this.controls) {
            this.controls.update();
        } 
        // Otherwise follow the car if it exists
        else if (this.experience.rcCar && this.experience.rcCar.carGroup) {
            try {
                const carPosition = this.experience.rcCar.carGroup.position.clone();
                
                // Always use the car's facing direction regardless of movement mode
                let carDirection = new THREE.Vector3(0, 0, -1);
                carDirection.applyQuaternion(this.experience.rcCar.carGroup.quaternion);
                
                // If the car has stopped, use the last known good direction
                // This prevents the camera from jumping when the car stops
                if (carDirection.length() < 0.1) {
                    carDirection = this.lastCarDirection.clone();
                } else {
                    this.lastCarDirection.copy(carDirection);
                }
                
                // Get the right vector (perpendicular to the car's direction)
                // This will be used to position the camera to the side of the car
                const rightVector = new THREE.Vector3(1, 0, 0);
                rightVector.applyQuaternion(this.experience.rcCar.carGroup.quaternion);
                
                // Calculate camera position to the side of the car
                this.cameraTargetPosition.copy(carPosition)
                    .add(rightVector.clone().multiplyScalar(-this.followDistance)) // Use the class property
                    .add(new THREE.Vector3(0, this.followHeight * 0.7, 0)); // Lower height for side view
                
                // Get the look target with a slight offset for better view
                this.cameraTargetLookAt.copy(carPosition).add(this.lookOffset);
                
                // Use smoother interpolation for camera movements
                // Lower lerpFactor when car is not moving for more stability
                const isMoving = this.experience.rcCar.controlMode === 'auto' || 
                                (this.experience.rcCar.keys.forward || 
                                 this.experience.rcCar.keys.backward);
                
                const lerpSpeed = isMoving ? this.lerpFactor : this.lerpFactor * 0.5;
                
                // Smooth camera position and orientation
                this.instance.position.lerp(this.cameraTargetPosition, lerpSpeed);
                
                // Make the camera look at the car
                this.instance.lookAt(this.cameraTargetLookAt);
            } catch (error) {
                console.error("Error updating camera position:", error);
            }
        }
    }
} 