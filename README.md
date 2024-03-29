<h1 align="center">Mixpoint</h1>

<p align="center">Mixpoint is multi-track audio mixing app for the browser</p>

## Links

- [Mixpoint Repo](https://github.com/jgentes/mixpoint)

- [Live Demo](https://mixpoint.jgentes.com)

- [Issues Page](https://github.com/jgentes/mixpoint/issues)

- [Discussion Page](https://github.com/jgentes/mixpoint/discussions)

## Screenshot

![App](public/media/Mixpoint_Screenshot_323.png 'App')

## Presentation

[![Slides](public/media/Presentation_Screenshot_323.png 'Slides')](https://slides.com/jamesgentes/mixpoint-05ab4b)

## Overview

Mixpoint solves a common problem that many "desktop" DJ's face - there are only two different types of products available on the market today:

1. DJ apps (VirtualDJ, etc) - these all replicate the 2 turntable scenario, which is great for mixing 2 tracks together in real time. This is appropriate for live performances, but not ideal if you want to take the time to perfect mixes and create a longer, flawless set.

2. DAW apps (Audacity, Cubase, etc) - these assume you're making music, with lots of sampling and effects, optimized for audio production. They support laying out multiple tracks (which is what is missing in DJ apps) but don't provide the basic context that DJ's need, such as BPM detection, beatmatching, and simple crossfading between tracks. Of course these things can be done with these tools, but it's not easy and certainly not what they are designed for.

The goal of this app is to provide a focused user experience that delivers on the need to lay out a series of tracks, easily tweak the transition from one track to the next (a mix), and save the output as a finished set. Using ai, the software will recommend mixes based on mixes other people have created, and eventually mix tracks together for you.

Huge thanks to the NextUI team for creating such a [kickass UI](https://nextui.org) freely available.

The project uses [Wavesurfer](https://wavesurfer-js.org/) for waveform analysis and navigation.

Open source is more than a licensing strategy. It's a [movement](https://opensource.stackexchange.com/questions/9805/can-i-license-my-project-with-an-open-source-license-but-disallow-commercial-use). This work is made possible only by the labor of many open source contributers and their freely sourced efforts.

## Available Commands

In the project directory, you can run:

### `"yarn dev"`,

The app is built using `Remix` which uses esBuild (now Vite) for really fast hot reloads. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Built With

- Typescript
- Remix
- NextUI
- Teaful for App State
- Dexie (IndexedDb) for Persistent State
- WaveSurfer
  
  
[![Covered by Argos Visual Testing](https://argos-ci.com/badge.svg)](https://app.argos-ci.com/jgentes/mixpoint/reference)

## Roadmap

- [ ] Documentation
- [ ] Playlists / Track Organization
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
