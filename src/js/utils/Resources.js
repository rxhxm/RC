import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from './EventEmitter.js';

export default class Resources extends EventEmitter {
    constructor() {
        super();

        this.items = {};
        this.toLoad = 0;
        this.loaded = 0;
        this.loaders = {};

        this.setLoaders();
        this.startLoading();
        
        this.loadingTimeout = setTimeout(() => {
            if (this.loaded < this.toLoad) {
                console.warn("Resource loading timeout. Forcing completion.");
                const loadingBarElement = document.querySelector('.loading-bar');
                const loadingTextElement = document.querySelector('.loading-text');
                if (loadingBarElement) loadingBarElement.style.transform = 'scaleX(1)';
                this.trigger('ready');
                setTimeout(() => {
                    if (loadingBarElement) loadingBarElement.classList.add('ended');
                    if (loadingTextElement) loadingTextElement.classList.add('ended');
                }, 500);
            }
        }, 10000); // Extended timeout to 10 seconds
    }

    setLoaders() {
        this.loaders = {
            gltfLoader: new GLTFLoader(),
            textureLoader: new THREE.TextureLoader(),
            cubeTextureLoader: new THREE.CubeTextureLoader()
        };
    }

    startLoading() {
        const loadingBarElement = document.querySelector('.loading-bar');
        const loadingTextElement = document.querySelector('.loading-text');

        const sources = [
            { name: 'rcCarModel', type: 'gltfModel', path: '/yellow.glb' },
            // Sign textures are now generated procedurally, no need to load them here
            // { name: 'xyzSignTexture', type: 'texture', path: '/textures/signs/xyz_sign.jpg' },
            // { name: 'xySignTexture', type: 'texture', path: '/textures/signs/xy_sign.jpg' },
            // { name: 'waveSignTexture', type: 'texture', path: '/textures/signs/wave_sign.jpg' },
            { name: 'trackTexture', type: 'texture', path: '/textures/track/dark_track.jpg' }, // Kept for potential future use
            {
                name: 'environmentMap', type: 'cubeTexture',
                path: [
                    '/textures/environmentMap/px.jpg', '/textures/environmentMap/nx.jpg',
                    '/textures/environmentMap/py.jpg', '/textures/environmentMap/ny.jpg',
                    '/textures/environmentMap/pz.jpg', '/textures/environmentMap/nz.jpg'
                ]
            }
        ];

        this.toLoad = sources.length;
        if (this.toLoad === 0) {
            setTimeout(() => this.trigger('ready'), 0); // Trigger ready immediately if no sources
            return;
        }

        for (const source of sources) {
            switch (source.type) {
                case 'gltfModel':
                    this.loaders.gltfLoader.load(source.path, 
                        (file) => this.sourceLoaded(source, file),
                        undefined, // Progress callback removed for brevity
                        (error) => {
                            console.error(`Error loading GLTF model: ${source.path}`, error);
                                    this.handleFailedLoad(source);
                        }
                    );
                    break;
                case 'texture':
                case 'cubeTexture':
                    const loader = source.type === 'texture' ? this.loaders.textureLoader : this.loaders.cubeTextureLoader;
                    loader.load(source.path, 
                        (file) => this.sourceLoaded(source, file),
                        undefined,
                        (error) => {
                            console.warn(`Error loading ${source.type}: ${source.path}`, error);
                            this.handleFailedLoad(source);
                        }
                    );
                    break;
                default:
                    console.warn(`Unknown source type: ${source.type}`);
                    this.handleFailedLoad(source);
                    break;
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file;
        this.loaded++;
        const progress = this.loaded / this.toLoad;
        const loadingBarElement = document.querySelector('.loading-bar');
        if (loadingBarElement) loadingBarElement.style.transform = `scaleX(${progress})`;
        
        if (this.loaded === this.toLoad) {
            if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
            setTimeout(() => {
                this.trigger('ready');
                const loadingTextElement = document.querySelector('.loading-text');
                if (loadingBarElement) loadingBarElement.classList.add('ended');
                if (loadingTextElement) loadingTextElement.classList.add('ended');
            }, 200); // Shorter delay for UI update
        }
    }

    handleFailedLoad(source) {
        this.loaded++; // Still count as loaded to not stall loading bar indefinitely
        console.warn(`Failed to load resource: ${source.name}. Providing fallback.`);
        
        if (source.type === 'gltfModel') {
            this.items[source.name] = { scene: new THREE.Group() }; // Empty group as fallback
        } else if (source.type === 'texture' || source.type === 'cubeTexture') {
            // Fallback for textures: a simple 1x1 magenta pixel
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const context = canvas.getContext('2d');
            context.fillStyle = '#FF00FF'; // Magenta
            context.fillRect(0, 0, 1, 1);
            this.items[source.name] = new THREE.CanvasTexture(canvas);
        }
        
        // Check if all resources (including fallbacks) are processed
        if (this.loaded === this.toLoad) {
            if (this.loadingTimeout) clearTimeout(this.loadingTimeout);
            setTimeout(() => this.trigger('ready'), 200);
        }
    }

    // createColorTexture, createSignTexture, createTrackTexture are no longer needed
    // as procedural textures are handled within specific components (Track, Environment)
    // or fallbacks are simplified.
} 