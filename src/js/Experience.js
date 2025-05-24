import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import Resources from './utils/Resources.js';
import Time from './utils/Time.js';
import Sizes from './utils/Sizes.js';
import RCCar from './world/RCCar.js';
import Track from './world/Track.js';
import Environment from './world/Environment.js';

export default class Experience {
    constructor(canvas) {
        // Options
        this.canvas = canvas;

        // Setup
        this.sizes = new Sizes();
        this.time = new Time();
        this.scene = new THREE.Scene();

        try {
            // Setup components in the correct order
            this.setupComponents();
        } catch (error) {
            console.error("Error setting up Experience:", error);
            this.setupFallbackExperience(); // Minimal fallback
        }
    }

    setupComponents() {
        this.resources = new Resources();
        this.setCamera();
        this.renderer = new Renderer(this);
        this.track = new Track(this);
        this.environment = new Environment(this);
        this.rcCar = new RCCar(this);

        this.sizes.on('resize', () => {
            this.resize();
        });

        this.time.on('tick', () => {
            this.update();
        });
    }

    setupFallbackExperience() {
        // Minimal camera
        this.camera = {
            instance: new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000),
            resize: () => {
                this.camera.instance.aspect = this.sizes.width / this.sizes.height;
                this.camera.instance.updateProjectionMatrix();
            },
            update: () => {}
        };
        this.camera.instance.position.set(0, 5, 10);
        this.camera.instance.lookAt(0, 0, 0);
        this.scene.add(this.camera.instance);
        
        // Minimal renderer
        this.renderer = {
            instance: new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true }),
            resize: () => { this.renderer.instance.setSize(this.sizes.width, this.sizes.height); },
            update: () => { this.renderer.instance.render(this.scene, this.camera.instance); }
        };
        this.renderer.instance.setSize(this.sizes.width, this.sizes.height);
        this.renderer.instance.setClearColor(0x000000); // Fallback to black background
        
        // Simple cube as fallback object
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        
        const light = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(light);
        
        this.sizes.on('resize', () => { this.resize(); });
        this.time.on('tick', () => { this.update(); });
    }

    resize() {
        if (this.camera && typeof this.camera.resize === 'function') {
            this.camera.resize();
        }
        if (this.renderer && typeof this.renderer.resize === 'function') {
            this.renderer.resize();
        }
    }

    update() {
        try {
            if (this.camera && typeof this.camera.update === 'function') this.camera.update();
            if (this.rcCar && typeof this.rcCar.update === 'function') this.rcCar.update();
            if (this.renderer && typeof this.renderer.update === 'function') this.renderer.update();
        } catch (error) {
            console.error("Error in update loop:", error);
        }
    }

    destroy() {
        this.sizes.off('resize');
        this.time.off('tick');

        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => this.disposeMaterial(material));
                    } else {
                        this.disposeMaterial(child.material);
                    }
                }
            }
        });

        if (this.camera && this.camera.controls) this.camera.controls.dispose();
        if (this.renderer && this.renderer.instance) this.renderer.instance.dispose();
    }
    
    disposeMaterial(material) {
        if (!material) return;
        for (const key in material) {
            const value = material[key];
            if (value && typeof value.dispose === 'function') value.dispose();
        }
        material.dispose();
    }

    setCamera() {
        try {
            this.camera = new Camera(this);
            if (this.camera && this.camera.instance) {
                this.camera.instance.far = 10000; // Ensure skybox is visible
                this.camera.instance.updateProjectionMatrix();
            }
        } catch (error) {
            console.error("Error setting up camera:", error);
        }
    }

    // Car adjustment passthrough methods
    adjustCarHeight(heightOffset) {
        if (this.rcCar && typeof this.rcCar.adjustCarHeight === 'function') {
            this.rcCar.adjustCarHeight(heightOffset);
        }
    }
    
    resetCarHeight() {
        if (this.rcCar && typeof this.rcCar.resetCarHeight === 'function') {
            this.rcCar.resetCarHeight();
        }
    }
    
    adjustCarTilt(angle) {
        if (this.rcCar && typeof this.rcCar.adjustCarTilt === 'function') {
            this.rcCar.adjustCarTilt(angle);
        }
    }
    
    resetCarTilt() {
        if (this.rcCar && typeof this.rcCar.resetCarTilt === 'function') {
            this.rcCar.resetCarTilt();
        }
    }
} 