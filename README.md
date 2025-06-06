# Interval Timer

A simple, iOS-inspired interval timer for workouts and other timed activities.

## Features

- Clean, iOS-style UI
- Customizable active and rest intervals
- Sound alerts for phase changes
- Dark mode support
- Mobile-friendly design
- Works offline

## Project Structure

```
IntervalTimer/
├── index.html          # Main HTML file
├── script.js           # Main JavaScript file
├── netlify.toml        # Netlify configuration
├── sounds/             # Sound files (for Netlify deployment)
│   ├── beep.mp3        # Alert sound for interval changes
│   ├── click.mp3       # Button click sound
│   └── complete.mp3    # Completion sound
├── public/             # Static assets
│   ├── _redirects      # Netlify redirects
│   └── sounds/         # Sound files (for local development)
└── README.md           # Project documentation
```

## Sound Credits

The sounds in this project are derived from mixkit.co:
- Beep: Alert notification sound
- Click: UI button click sound
- Complete: Success notification sound

## Usage

Simply open `index.html` in a web browser. No installation required.

For optimal experience on iOS devices, add to home screen through Safari's share menu.

## Deployment

This app can be deployed on Netlify. The audio files are in both `/sounds` and `/public/sounds` directories to ensure compatibility with different hosting environments.
