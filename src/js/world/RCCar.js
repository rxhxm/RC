import * as THREE from 'three';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class RCCar {
    constructor(experience) {
        this.experience = experience;
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.time = this.experience.time;
        this.track = null; // Will be set when the track is ready
        
        this.progress = 0;
        this.speed = 0.00005;      // Reduced from 0.0004 (4x slower)
        this.manualSpeed = 0.00005; // Reduced from 0.001 (5x slower)
        
        // Control state
        this.controlMode = 'auto'; // 'auto' or 'manual'
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // Model adjustments
        this.heightAdjustment = 0.23;
        this.tiltAdjustment = -1.00; // New tilt adjustment variable
        this.scaleAdjustment = 1.80; // Default scale value
        this.rotationY = 1.50; // Default Y rotation (facing forward)
        this.rotationZ = 0.00; // Default Z rotation
        
        // Setup keyboard controls
        this.setupKeyboardControls();
        
        // Create car adjustment UI
        this.createCarAdjustmentUI();
        
        // Wait for resources
        this.resources.on('ready', () => {
            console.log("Resources ready in RCCar");
            this.rcCarModel = this.resources.items.rcCarModel;
            
            // If the model didn't load through resources, try direct loading
            if (!this.rcCarModel || !this.rcCarModel.scene || this.rcCarModel.scene.children.length === 0) {
                console.log("Model not loaded through resources, trying direct loading");
                this.loadModelDirectly();
            } else {
                this.setModel();
            }
            
            // Only start moving when track is available
            if (this.experience.track && this.experience.track.trackCurve) {
                this.track = this.experience.track;
                this.startMoving();
            } else {
                console.warn("Track not ready yet, waiting...");
                // Try again in a second - track might not be ready
                setTimeout(() => {
                    if (this.experience.track && this.experience.track.trackCurve) {
                        this.track = this.experience.track;
                        this.startMoving();
                    } else {
                        console.error("Track still not available, creating fallback track");
                        this.createFallbackTrack();
                        this.track = this.fallbackTrack;
                        this.startMoving();
                    }
                }, 1000);
            }
        });
    }
    
    setupKeyboardControls() {
        try {
            // Add event listeners for keyboard controls
            window.addEventListener('keydown', (event) => this.handleKeyDown(event));
            window.addEventListener('keyup', (event) => this.handleKeyUp(event));
            
            // Create instructions element
            this.createControlsInfo();
            
            console.log("Keyboard controls set up");
        } catch (error) {
            console.error("Error setting up keyboard controls:", error);
        }
    }
    
    createControlsInfo() {
        // Create a controls info div
        const controlsInfo = document.createElement('div');
        controlsInfo.className = 'controls-info';
        controlsInfo.innerHTML = `
            <h3>Controls</h3>
            <div>Arrow Keys: Control Car</div>
            <div>Space: Toggle Auto/Manual</div>
            <div class="mode">Mode: Automatic</div>
        `;
        
        // Style the controls info
        controlsInfo.style.position = 'absolute';
        controlsInfo.style.bottom = '20px';
        controlsInfo.style.left = '20px';
        controlsInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        controlsInfo.style.color = 'white';
        controlsInfo.style.padding = '10px';
        controlsInfo.style.borderRadius = '5px';
        controlsInfo.style.fontFamily = 'Arial, sans-serif';
        controlsInfo.style.zIndex = '1000';
        
        // Add the controls info to the body
        document.body.appendChild(controlsInfo);
        
        // Save reference to mode display
        this.modeDisplay = controlsInfo.querySelector('.mode');
    }
    
    handleKeyDown(event) {
        // Check which key was pressed
        switch(event.key) {
            case 'ArrowUp':
                this.keys.forward = true;
                this.setControlMode('manual');
                break;
            case 'ArrowDown':
                this.keys.backward = true;
                this.setControlMode('manual');
                break;
            case 'ArrowLeft':
                this.keys.left = true;
                this.setControlMode('manual');
                break;
            case 'ArrowRight':
                this.keys.right = true;
                this.setControlMode('manual');
                break;
            case ' ': // Spacebar
                // Toggle between auto and manual modes
                this.setControlMode(this.controlMode === 'auto' ? 'manual' : 'auto');
                break;
        }
    }
    
    handleKeyUp(event) {
        // Check which key was released
        switch(event.key) {
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
        }
    }
    
    setControlMode(mode) {
        this.controlMode = mode;
        
        // Update mode display if it exists
        if (this.modeDisplay) {
            this.modeDisplay.textContent = `Mode: ${this.controlMode === 'auto' ? 'Automatic' : 'Manual'}`;
        }
        
        console.log(`Control mode set to: ${this.controlMode}`);
    }
    
    createFallbackTrack() {
        console.log("Creating fallback track");
        // Create a simple circular path as fallback
        this.fallbackTrack = {
            trackCurve: new THREE.CurvePath(),
            trackCurvePoints: []
        };
        
        // Create a circle with radius 10
        const radius = 10;
        const points = 100;
        const circle = [];
        
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            circle.push(new THREE.Vector3(x, 0, z));
        }
        
        // Create a curve from points
        const curve = new THREE.CatmullRomCurve3(circle);
        this.fallbackTrack.trackCurve = curve;
        this.fallbackTrack.getPointAt = (t) => curve.getPointAt(t);
        this.fallbackTrack.getTangentAt = (t) => curve.getTangentAt(t);
    }
    
    setModel() {
        try {
            // Check if we have a valid model, otherwise create a simple box placeholder
            if (this.rcCarModel && this.rcCarModel.scene && this.rcCarModel.scene.children.length > 0) {
                console.log("Using F1 car GLB model");
                this.debugModelStructure(); // Add debug output
                
                this.model = this.rcCarModel.scene;
                
                // Check if model is valid
                if (!this.model) {
                    console.error("Model scene is invalid, using fallback");
                    this.createFallbackModel();
                    return;
                }
                
                console.log("F1 model loaded successfully, configuring...");
                
                // Apply scale from scaleAdjustment property
                this.model.scale.set(this.scaleAdjustment, this.scaleAdjustment, this.scaleAdjustment);
                
                // Centered on origin - will be positioned by carGroup
                this.model.position.set(0, 0, 0);
                
                // Apply rotations from properties
                this.model.rotation.set(this.tiltAdjustment, this.rotationY, this.rotationZ);
                
                // Create a bounding box to measure the model height for proper alignment
                const boundingBox = new THREE.Box3().setFromObject(this.model);
                const modelHeight = boundingBox.max.y - boundingBox.min.y;
                const groundOffset = boundingBox.min.y;
                
                console.log("F1 car model dimensions:", {
                    width: boundingBox.max.x - boundingBox.min.x,
                    height: modelHeight,
                    depth: boundingBox.max.z - boundingBox.min.z,
                    groundOffset: groundOffset,
                    min: boundingBox.min,
                    max: boundingBox.max
                });
                
                // Store model measurements for positioning on track later
                this.modelGroundOffset = groundOffset;
                
                // Apply shadows to the model
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        console.log(`Mesh found in model: ${child.name}`);
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Improve material quality
                        if (child.material) {
                            console.log(`Material found on ${child.name}:`, child.material.type);
                            child.material.metalness = 0.7; // Higher metalness for car body
                            child.material.roughness = 0.3; // Lower roughness for shinier look
                            
                            // Ensure correct texture encoding if textures are present
                            if (child.material.map) {
                                try {
                                    child.material.map.colorSpace = THREE.SRGBColorSpace;
                                } catch (error) {
                                    // Fallback for older THREE.js versions
                                    child.material.map.encoding = THREE.sRGBEncoding;
                                    console.warn("Using legacy encoding instead of colorSpace for texture");
                                }
                            }
                        }
                    }
                });
                
                // Try to find the wheels for animation
                this.wheels = [];
                this.model.traverse((child) => {
                    // Look for wheels by name patterns common in F1 car models
                    if (child.name && (
                        child.name.toLowerCase().includes('wheel') || 
                        child.name.toLowerCase().includes('tire') ||
                        child.name.toLowerCase().includes('tyre') ||
                        child.name.toLowerCase().includes('rim')
                    )) {
                        console.log("Found wheel:", child.name);
                        this.wheels.push(child);
                    }
                });
                
                // If no wheels found by name, try to find by geometry
                if (this.wheels.length === 0) {
                    console.log("No wheels found by name, trying to find by geometry");
                    this.findWheelsByGeometry();
                }
                
                console.log(`Found ${this.wheels.length} wheels in the F1 car model`);
            } else {
                console.warn("Invalid or missing F1 car model, using fallback");
                this.createFallbackModel();
            }
            
            // Add the model to the scene
            this.scene.add(this.model);
            
            // Create a group to handle car rotation
            this.carGroup = new THREE.Group();
            this.scene.add(this.carGroup);
            this.carGroup.add(this.model);
            
            console.log(`Car model set up with ${this.wheels.length} wheels`);
        } catch (error) {
            console.error("Error setting up model:", error);
            this.createFallbackModel();
        }
    }
    
    findWheelsByGeometry() {
        // Try to find wheels by looking for round shapes
        // This is a fallback if wheels aren't properly named in the model
        const potentialWheels = [];
        
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Check if the object is roughly cylindrical
                if (child.geometry && 
                    (child.geometry.type === 'CylinderGeometry' || 
                     child.geometry.type === 'CylinderBufferGeometry')) {
                    potentialWheels.push(child);
                }
                
                // For BufferGeometry, try to detect wheels by their shape and position
                if (child.geometry && child.geometry.type === 'BufferGeometry') {
                    // Look for objects that are roughly the same height
                    // and are near the bottom of the car
                    if (child.position.y < 0.5) {
                        potentialWheels.push(child);
                    }
                }
            }
        });
        
        // If we found potential wheels, use them
        if (potentialWheels.length >= 4) {
            console.log(`Found ${potentialWheels.length} potential wheels by geometry`);
            this.wheels = potentialWheels;
        }
    }
    
    startMoving() {
        try {
            // Begin animation on the path when track is ready
            if (this.track && this.track.trackCurve) {
                console.log("Starting car movement on track");
                // Get initial position on the track
                const initialPosition = this.track.getPointAt(0);
                this.carGroup.position.copy(initialPosition);
                
                // Get initial direction
                const initialTangent = this.track.getTangentAt(0);
                this.carGroup.lookAt(
                    initialPosition.x + initialTangent.x,
                    initialPosition.y + initialTangent.y,
                    initialPosition.z + initialTangent.z
                );
            } else {
                console.error("Cannot start movement - track not available");
            }
        } catch (error) {
            console.error("Error starting movement:", error);
        }
    }
    
    updateAutoMovement() {
        // Increment progress
        this.progress += this.speed * this.time.delta;
        
        // Ensure progress wraps around between 0 and 1
        if (this.progress > 1) {
            this.progress -= 1;
        } else if (this.progress < 0) {
            this.progress += 1;
        }
        
        // Get position on track
        const position = this.track.getPointAt(this.progress);
        if (position) {
            this.carGroup.position.copy(position);
            
            // Position the car correctly on the track surface
            // Include any height adjustment set via adjustCarHeight method
            const heightAdjustment = this.heightAdjustment || 0;
            
            // If we have detected the model's ground offset, use that for precise positioning
            if (this.modelGroundOffset !== undefined) {
                // Adjust height to make the model sit exactly on the surface
                // Using a smaller buffer to position the car closer to the ground
                const groundBuffer = 0.01; // Reduced from 0.05 to get car closer to ground
                this.carGroup.position.y = Math.abs(this.modelGroundOffset) * 0.5 + groundBuffer + heightAdjustment;
            } else {
                // Fallback to default positioning if no offset was measured
                this.carGroup.position.y = 0.01 + heightAdjustment; // Reduced from 0.05
            }
            
            // Get the tangent at the current position (direction of movement)
            const tangent = this.track.getTangentAt(this.progress);
            
            // Make the car look in the direction of motion
            if (tangent) {
                const target = new THREE.Vector3(
                    position.x + tangent.x,
                    position.y + tangent.y,
                    position.z + tangent.z
                );
                this.carGroup.lookAt(target);
                
                // Apply tilt adjustment
                if (this.model && this.tiltAdjustment !== 0) {
                    this.model.rotation.x = this.tiltAdjustment;
                }
            }
        }
    }
    
    updateManualMovement() {
        let progressChange = 0;
        
        // Calculate progress change based on input
        if (this.keys.forward) {
            progressChange += this.manualSpeed * this.time.delta;
        }
        if (this.keys.backward) {
            progressChange -= this.manualSpeed * this.time.delta;
        }
        
        // Update progress
        this.progress += progressChange;
        
        // Ensure progress wraps around between 0 and 1
        if (this.progress > 1) {
            this.progress -= 1;
        } else if (this.progress < 0) {
            this.progress += 1;
        }
        
        // Get position on track
        const position = this.track.getPointAt(this.progress);
        if (position) {
            this.carGroup.position.copy(position);
            
            // Position the car correctly on the track surface
            // Include any height adjustment set via adjustCarHeight method
            const heightAdjustment = this.heightAdjustment || 0;
            
            // If we have detected the model's ground offset, use that for precise positioning
            if (this.modelGroundOffset !== undefined) {
                // Adjust height to make the model sit exactly on the surface
                // Using a smaller buffer to position the car closer to the ground
                const groundBuffer = 0.01; // Reduced from 0.05 to get car closer to ground
                this.carGroup.position.y = Math.abs(this.modelGroundOffset) * 0.5 + groundBuffer + heightAdjustment;
            } else {
                // Fallback to default positioning if no offset was measured
                this.carGroup.position.y = 0.01 + heightAdjustment; // Reduced from 0.05
            }
            
            // Get the tangent at the current position (direction of movement)
            const tangent = this.track.getTangentAt(this.progress);
            
            // Make the car look in the direction of motion
            if (tangent) {
                const target = new THREE.Vector3(
                    position.x + tangent.x,
                    position.y + tangent.y,
                    position.z + tangent.z
                );
                this.carGroup.lookAt(target);
                
                // Apply tilt adjustment
                if (this.model && this.tiltAdjustment !== 0) {
                    this.model.rotation.x = this.tiltAdjustment;
                }
                
                // Add steer effect based on left/right keys
                let steerAngle = 0;
                if (this.keys.left) steerAngle = Math.PI * 0.05;
                if (this.keys.right) steerAngle = -Math.PI * 0.05;
                
                if (steerAngle !== 0) {
                    const steerMatrix = new THREE.Matrix4().makeRotationY(steerAngle);
                    const currentDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.carGroup.quaternion);
                    currentDirection.applyMatrix4(steerMatrix);
                    
                    // Create temporary vector for lookAt
                    const lookPoint = this.carGroup.position.clone().add(currentDirection);
                    this.carGroup.lookAt(lookPoint);
                    
                    // Adjust progress based on steering
                    if (progressChange !== 0) {
                        if (this.keys.left) this.progress += 0.0001 * this.time.delta;
                        if (this.keys.right) this.progress -= 0.0001 * this.time.delta;
                    }
                }
            }
        }
    }
    
    update() {
        try {
            if (this.track && this.track.trackCurve && this.carGroup) {
                // Update movement based on control mode
                if (this.controlMode === 'auto') {
                    this.updateAutoMovement();
                } else {
                    this.updateManualMovement();
                }
                
                // Removed wheel animation - wheels no longer rotate
                // Wheels are now fixed in position
            }
        } catch (error) {
            console.error("Error updating car position:", error);
        }
    }
    
    debugModelStructure() {
        if (!this.rcCarModel || !this.rcCarModel.scene) {
            console.log("No model to debug");
            return;
        }
        
        console.log("RC Car Model Structure:");
        console.log("Total children:", this.rcCarModel.scene.children.length);
        
        // Function to recursively print the structure
        const printStructure = (object, indent = 0) => {
            const indentStr = ' '.repeat(indent * 2);
            const objectType = object.type;
            const objectName = object.name || '[unnamed]';
            
            console.log(`${indentStr}- ${objectName} (${objectType})`);
            
            if (object instanceof THREE.Mesh) {
                const matType = object.material ? object.material.type : 'unknown';
                const geoType = object.geometry ? object.geometry.type : 'unknown';
                console.log(`${indentStr}  Mesh details: material=${matType}, geometry=${geoType}`);
                
                // Check if this looks like a wheel
                if (objectName.toLowerCase().includes('wheel') || 
                    objectName.toLowerCase().includes('tire')) {
                    console.log(`${indentStr}  POTENTIAL WHEEL FOUND`);
                }
            }
            
            // Recursively print children
            if (object.children && object.children.length > 0) {
                for (const child of object.children) {
                    printStructure(child, indent + 1);
                }
            }
        };
        
        // Start with scene's children
        for (const child of this.rcCarModel.scene.children) {
            printStructure(child);
        }
    }
    
    /**
     * Adjust the height of the car model - can be called from console for fine-tuning
     * @param {number} heightOffset - Additional height offset in units
     */
    adjustCarHeight(heightOffset) {
        // Store the adjustment value
        this.heightAdjustment = heightOffset || 0;
        
        // Apply immediately to current position
        if (this.modelGroundOffset !== undefined) {
            // Use the model's measured ground offset with the adjustment
            const newHeight = Math.abs(this.modelGroundOffset) * 0.5 + this.heightAdjustment;
            this.carGroup.position.y = newHeight;
            console.log(`Car height adjusted to: ${newHeight}`);
        } else {
            // Just apply the adjustment to the default height
            const newHeight = 0.01 + this.heightAdjustment;
            this.carGroup.position.y = newHeight;
            console.log(`Car height adjusted to: ${newHeight} (using default positioning)`);
        }
        
        return this; // For chaining
    }
    
    /**
     * Reset the height adjustment to default
     */
    resetCarHeight() {
        this.heightAdjustment = 0;
        
        if (this.modelGroundOffset !== undefined) {
            this.carGroup.position.y = Math.abs(this.modelGroundOffset) * 0.5;
        } else {
            this.carGroup.position.y = 0.01;
        }
        
        console.log("Car height reset to default");
        return this; // For chaining
    }
    
    /**
     * Adjust the tilt of the car model
     * @param {number} angle - Tilt angle in radians (positive tilts back, negative tilts forward)
     */
    adjustCarTilt(angle) {
        this.tiltAdjustment = angle || 0;
        
        if (this.model) {
            this.model.rotation.x = this.tiltAdjustment;
            console.log(`Car tilt adjusted to: ${this.tiltAdjustment} radians`);
        }
        
        return this; // For chaining
    }
    
    /**
     * Reset the tilt adjustment to default
     */
    resetCarTilt() {
        this.tiltAdjustment = 0;
        
        if (this.model) {
            this.model.rotation.x = 0;
        }
        
        console.log("Car tilt reset to default");
        return this; // For chaining
    }
    
    /**
     * Create a fallback model when the F1 car model fails to load
     */
    createFallbackModel() {
        console.log("Creating fallback car model");
        
        // Create a simple car shape as fallback
        this.model = new THREE.Group();
        
        // Car body - use a blue color for visibility
        const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3344aa,
            metalness: 0.3,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        this.model.add(body);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            metalness: 0.3,
            roughness: 0.8
        });
        
        // Create and position wheels
        this.wheels = [];
        const wheelPositions = [
            { x: -0.6, y: -0.25, z: 0.7 },  // front left
            { x: 0.6, y: -0.25, z: 0.7 },   // front right
            { x: -0.6, y: -0.25, z: -0.7 }, // back left
            { x: 0.6, y: -0.25, z: -0.7 }   // back right
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2; // Rotate to correct orientation
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            this.model.add(wheel);
            this.wheels.push(wheel);
        });
    }
    
    /**
     * Load the F1 model directly using GLTFLoader
     */
    loadModelDirectly() {
        console.log("Attempting to load F1 model directly");
        
        const loader = new GLTFLoader();
        
        // List of paths to try (in order of preference)
        const paths = [
            './yellow.glb',
            '/yellow.glb',
            '../yellow.glb',
            'yellow.glb',
            '/dist/yellow.glb',
            './dist/yellow.glb',
            window.location.origin + '/yellow.glb',
            window.location.origin + '/dist/yellow.glb'
        ];
        
        // Try loading from each path
        let loadAttempts = 0;
        
        const tryNextPath = (index) => {
            if (index >= paths.length) {
                console.error("Failed to load 3D model from any path");
                this.setModel(); // Use fallback
                return;
            }
            
            const path = paths[index];
            console.log(`Trying to load 3D model from: ${path}`);
            
            loader.load(
                path,
                (gltf) => {
                    console.log(`Successfully loaded 3D model from: ${path}`, gltf);
                    this.rcCarModel = gltf;
                    this.setModel();
                },
                (progress) => {
                    // Log progress for larger files
                    if (progress.loaded && progress.total) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        if (percent % 25 === 0) { // Log at 0%, 25%, 50%, 75%, 100%
                            console.log(`Loading 3D model: ${percent}% (${progress.loaded}/${progress.total})`);
                        }
                    }
                },
                (error) => {
                    console.warn(`Failed to load from ${path}:`, error);
                    loadAttempts++;
                    // Try the next path
                    tryNextPath(index + 1);
                }
            );
        };
        
        // Start trying paths
        tryNextPath(0);
    }
    
    createCarAdjustmentUI() {
        // Create container for car adjustment UI
        const uiContainer = document.createElement('div');
        uiContainer.id = 'car-adjustment-ui';
        uiContainer.style.position = 'absolute';
        uiContainer.style.top = '20px';
        uiContainer.style.right = '20px';
        uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        uiContainer.style.color = 'white';
        uiContainer.style.padding = '15px';
        uiContainer.style.borderRadius = '8px';
        uiContainer.style.fontFamily = 'Arial, sans-serif';
        uiContainer.style.zIndex = '1000';
        uiContainer.style.width = '260px';
        uiContainer.style.maxHeight = '80vh';
        uiContainer.style.overflowY = 'auto';
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Car Adjustments';
        title.style.margin = '0 0 15px 0';
        title.style.textAlign = 'center';
        title.style.borderBottom = '1px solid rgba(255,255,255,0.3)';
        title.style.paddingBottom = '8px';
        uiContainer.appendChild(title);
        
        // Create sliders for different adjustments
        this.createAdjustmentSlider(uiContainer, 'Height', -1, 2, this.heightAdjustment, 0.01, (value) => {
            this.adjustCarHeight(parseFloat(value));
        });
        
        this.createAdjustmentSlider(uiContainer, 'Tilt (X Rotation)', -1.5, 1.5, this.tiltAdjustment, 0.1, (value) => {
            this.adjustCarTilt(parseFloat(value));
        });
        
        this.createAdjustmentSlider(uiContainer, 'Y Rotation', 0, Math.PI * 2, this.rotationY, 0.1, (value) => {
            this.adjustCarYRotation(parseFloat(value));
        });
        
        this.createAdjustmentSlider(uiContainer, 'Z Rotation', -1, 1, this.rotationZ, 0.1, (value) => {
            this.adjustCarZRotation(parseFloat(value));
        });
        
        this.createAdjustmentSlider(uiContainer, 'Scale', 0.5, 5, this.scaleAdjustment, 0.1, (value) => {
            this.adjustCarScale(parseFloat(value));
        });
        
        // Create preset buttons
        const presetTitle = document.createElement('h3');
        presetTitle.textContent = 'Presets';
        presetTitle.style.margin = '15px 0 10px 0';
        presetTitle.style.textAlign = 'center';
        uiContainer.appendChild(presetTitle);
        
        const presetContainer = document.createElement('div');
        presetContainer.style.display = 'flex';
        presetContainer.style.justifyContent = 'space-between';
        presetContainer.style.flexWrap = 'wrap';
        uiContainer.appendChild(presetContainer);
        
        this.createPresetButton(presetContainer, 'Default', () => {
            this.resetAllAdjustments();
        });
        
        this.createPresetButton(presetContainer, 'Fix Tilt', () => {
            this.adjustCarTilt(0);
            this.updateSliderValue('Tilt (X Rotation)', 0);
        });
        
        this.createPresetButton(presetContainer, 'Fix Rotation', () => {
            this.adjustCarYRotation(Math.PI);
            this.adjustCarZRotation(0);
            this.updateSliderValue('Y Rotation', Math.PI);
            this.updateSliderValue('Z Rotation', 0);
        });
        
        // Create save configuration button
        const saveConfigButton = document.createElement('button');
        saveConfigButton.textContent = 'Copy Configuration';
        saveConfigButton.style.display = 'block';
        saveConfigButton.style.width = '100%';
        saveConfigButton.style.padding = '10px';
        saveConfigButton.style.marginTop = '15px';
        saveConfigButton.style.backgroundColor = '#4CAF50';
        saveConfigButton.style.color = 'white';
        saveConfigButton.style.border = 'none';
        saveConfigButton.style.borderRadius = '4px';
        saveConfigButton.style.cursor = 'pointer';
        
        saveConfigButton.addEventListener('click', () => {
            const config = {
                heightAdjustment: this.heightAdjustment,
                tiltAdjustment: this.tiltAdjustment,
                rotationY: this.rotationY,
                rotationZ: this.rotationZ,
                scaleAdjustment: this.scaleAdjustment
            };
            
            const configString = JSON.stringify(config, null, 2);
            navigator.clipboard.writeText(configString)
                .then(() => {
                    saveConfigButton.textContent = 'Copied!';
                    setTimeout(() => {
                        saveConfigButton.textContent = 'Copy Configuration';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy configuration: ', err);
                    alert('Configuration:\n' + configString);
                });
        });
        
        uiContainer.appendChild(saveConfigButton);
        
        document.body.appendChild(uiContainer);
    }
    
    createAdjustmentSlider(container, label, min, max, value, step, onChange) {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.marginBottom = '15px';
        
        const labelElement = document.createElement('div');
        labelElement.textContent = `${label}: ${value.toFixed(2)}`;
        labelElement.style.marginBottom = '5px';
        sliderContainer.appendChild(labelElement);
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.width = '100%';
        slider.style.height = '20px';
        
        slider.addEventListener('input', (e) => {
            const newValue = parseFloat(e.target.value);
            labelElement.textContent = `${label}: ${newValue.toFixed(2)}`;
            onChange(newValue);
        });
        
        sliderContainer.appendChild(slider);
        container.appendChild(sliderContainer);
        
        // Store reference to update later
        slider.dataset.label = label;
    }
    
    createPresetButton(container, label, onClick) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.padding = '8px 12px';
        button.style.margin = '5px';
        button.style.backgroundColor = '#2196F3';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        
        button.addEventListener('click', onClick);
        container.appendChild(button);
    }
    
    updateSliderValue(label, value) {
        const slider = document.querySelector(`input[data-label="${label}"]`);
        if (slider) {
            slider.value = value;
            const labelElement = slider.previousElementSibling;
            if (labelElement) {
                labelElement.textContent = `${label}: ${parseFloat(value).toFixed(2)}`;
            }
        }
    }
    
    resetAllAdjustments() {
        // Reset all adjustments to default values
        this.adjustCarHeight(0.23);
        this.adjustCarTilt(-1.00);
        this.adjustCarYRotation(1.50);
        this.adjustCarZRotation(0.00);
        this.adjustCarScale(1.80);
        
        // Update UI sliders
        this.updateSliderValue('Height', 0.23);
        this.updateSliderValue('Tilt (X Rotation)', -1.00);
        this.updateSliderValue('Y Rotation', 1.50);
        this.updateSliderValue('Z Rotation', 0.00);
        this.updateSliderValue('Scale', 1.80);
    }
    
    adjustCarYRotation(angle) {
        this.rotationY = angle;
        if (this.model) {
            this.model.rotation.y = this.rotationY;
            console.log(`Car Y rotation adjusted to: ${this.rotationY} radians`);
        }
        return this;
    }
    
    adjustCarZRotation(angle) {
        this.rotationZ = angle;
        if (this.model) {
            this.model.rotation.z = this.rotationZ;
            console.log(`Car Z rotation adjusted to: ${this.rotationZ} radians`);
        }
        return this;
    }
    
    adjustCarScale(scale) {
        this.scaleAdjustment = scale;
        if (this.model) {
            this.model.scale.set(scale, scale, scale);
            console.log(`Car scale adjusted to: ${scale}`);
        }
        return this;
    }
} 