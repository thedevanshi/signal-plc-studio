# Signal PLC Studio

A small interactive PLC training project that simulates a two-way traffic-light intersection and visualizes its timer-driven ladder logic.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The project uses React and Vite.

## GitHub Pages

Push to `main` to build and deploy the app with GitHub Actions. Once the workflow finishes, the site will be available at:

<https://thedevanshi.github.io/signal-plc-studio/>

You can also run the workflow manually from the **Actions** tab using **Deploy to GitHub Pages**.

## Features

- Start, pause, and reset a four-phase traffic-light sequence.
- View the live North/South and East/West signal states, phase timer, and cycle timeline.
- Inspect the PLC ladder-logic diagram and its active rung.
- Download the circuit diagram as an SVG or a high-resolution PNG.
- Browse the simulated PLC input/output addresses and live output states.

## Example sequence

| Phase | North / South | East / West | Duration |
| --- | --- | --- | --- |
| 1 | Green | Red | 8 seconds |
| 2 | Amber | Red | 3 seconds |
| 3 | Red | Green | 8 seconds |
| 4 | Red | Amber | 3 seconds |

The simulation is educational only and is not intended to control real road signals.
