# Interval Timer

A simple interval timer web application built with HTML, JavaScript, and Tailwind CSS.

## Features

- Set custom action time (in seconds)
- Set custom rest time (in seconds)
- Set number of repetitions
- Visual countdown with progress bar
- Color-coded phases (blue for countdown, green for action, yellow for rest)
- Sound alerts for phase changes
- Mobile-responsive design
- Dark mode toggle with system preference detection and local storage persistence

## How to Use

1. Open `index.html` in your web browser
2. Enter your desired action time, rest time, and number of repetitions
3. Click "Start Timer"
4. The timer will count down 3, 2, 1 to get you ready
5. Follow the timer through action and rest phases
6. Click "Stop" at any time to cancel the timer
7. Toggle between light and dark mode using the sun/moon icon in the top-right corner

## Technologies Used

- HTML5
- JavaScript (vanilla)
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- Local Storage API for user preferences

## Project Structure

- `index.html` - Main HTML file with the UI structure
- `script.js` - JavaScript code for timer functionality
- `README.md` - Project documentation 