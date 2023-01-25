<h1 align="center">Mixpoint</h1>

<p align="center">Mixpoint is multi-track audio mixing app for the browser</p>

## Links

- [Repo](https://github.com/jgentes/mixpoint 'Mixpoint Repo')

- [Live](https://mixpoint.jgentes.com 'Live View')

- [Bugs](https://github.com/jgentes/mixpoint/issues 'Issues Page')

- [Discussion](https://github.com/jgentes/mixpoint/discussions 'Discussion Page')

## Screenshots

![App](public/media/Mixpoint_Screenshot.png 'App')

## Overview

Mixpoint solves a common problem that many "desktop" DJ's face - there are only two different types of products available on the market today:

1. DJ apps (VirtualDJ, etc) - these all replicate the 2 turntable scenario, which is great for mixing 2 tracks together in real time. This is appropriate for live performances, but not ideal if you want to take the time to perfect mixes and create a longer, flawless set.

2. DAW apps (Audacity, Cubase, etc) - these assume you're making music, with lots of sampling and effects, optimized for audio production. They supports laying out multiple tracks (which is what is missing in DJ apps) but doesn't provide the basic context that DJ's need, such as BPM detection, beatmatching, and simple crossfading between tracks. Of course these things can be done with these tools, but it's not easy and certainly not what they are designed for.

The goal of this app is to provide a focused user experience that delivers on the need to lay out a series of tracks, easily tweak the transition from one track to the next (a mix), and save the output as a finished set. Using machine learning, the software will recommend mixes based on mixes other people have created, and optionally mix tracks together for you.

Huge thanks to the MUI team for creating such a [kickass UI](https://mui.com/joy-ui/getting-started/overview/) freely available.

The project uses [Wavesurfer](https://wavesurfer-js.org/) for waveform analysis and navigation, . Also thanks to John Heiner for the fun progress indicator.

Open source is more than a licensing strategy. It's a [movement](https://opensource.stackexchange.com/questions/9805/can-i-license-my-project-with-an-open-source-license-but-disallow-commercial-use). This work is made possible only by the labor of many open source contributers and their dependent, freely sourced efforts. My work is a meager attempt to contribute to what so many others have already provided.

## Available Commands

In the project directory, you can run:

### `"yarn dev" : "remix dev"`,

The app is built using `Remix` which uses esBuild for really fast hot reloads. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `"yarn test": "vitest"`,

Launches tests, of which there are few.

## Built With

- Typescript
- Remix
- MUI (Joy)
- Teaful for App State
- Dexie (IndexedDb) for Persistent State
- WaveSurfer
- Tone.js (Web Audio API)

## Roadmap

- [ ] Usability Improvements
- [ ] Mix Recommendations
- [ ] Saving Mixes
- [ ] Creating Sets
- [ ] User Authentication

## Author

**James Gentes**

- [Profile](https://github.com/jgentes 'James Gentes')
- [Email](mailto:jgentes@gmail.com?subject=Mixpoint 'Hi!')

## 🤝 Support

Give a ⭐️ if you like this project!
