# RC - 3D Racing Simulation

A 3D racing simulation built with Three.js and Vite, featuring a realistic racing track with billboards, starry night sky, and smooth car controls.

## Features

- **3D Racing Track**: Realistic asphalt racing circuit with white lane markings
- **Starry Night Sky**: Beautiful procedurally generated starry background
- **Interactive Billboards**: 8 custom billboards around the track with project descriptions
- **Smooth Controls**: Responsive car movement with physics-based handling
- **Modern Tech Stack**: Built with Three.js, Vite, and modern JavaScript

## Technologies Used

- **Three.js** - 3D graphics and rendering
- **Vite** - Fast build tool and development server
- **JavaScript ES6+** - Modern JavaScript features
- **WebGL** - Hardware-accelerated 3D graphics

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/RC.git
cd RC
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Controls

- **Arrow Keys** or **WASD** - Control the racing car
- **Mouse** - Look around the 3D environment

## Project Structure

```
├── src/
│   ├── js/
│   │   ├── world/
│   │   │   ├── Track.js       # Racing track and billboards
│   │   │   ├── Environment.js # Lighting and sky
│   │   │   └── RCCar.js      # Car physics and controls
│   │   ├── Experience.js      # Main application class
│   │   └── ...
│   ├── style.css
│   └── ...
├── public/               # Static assets
├── index.html           # Entry point
└── package.json
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE). 