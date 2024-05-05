<h1 align="center">Mixpoint</h1>

<p align="center">Mixpoint is multi-track audio mixing app for the browser</p>

## Links

- [Mixpoint Repo](https://github.com/jgentes/mixpoint)

- [Live Site](https://mixpoint.dev)

- [Issues Page](https://github.com/jgentes/mixpoint/issues)

- [Discussion Page](https://github.com/jgentes/mixpoint/discussions)

## Screenshot

![App](public/media/Mixpoint_Screenshot_323.png 'App')

## Presentation

[![Slides](public/media/Presentation_Screenshot_323.png 'Slides')](https://slides.com/jamesgentes/mixpoint-05ab4b)

## Overview

Mixpoint solves a common problem that many "desktop" DJ's face - there are only two different types of products available on the market today:

1. DJ apps (VirtualDJ, etc) - these all replicate the 2 turntable scenario, which is great for mixing two tracks together in real time. This is appropriate for live performances, but not ideal if you want to take the time to perfect mixes and create a longer, flawless set.

2. DAW apps (Audacity, Cubase, etc) - these assume you're making music, with lots of sampling and effects, optimized for audio production. They support laying out multiple tracks (which is what is missing in DJ apps) but don't provide the basic context that DJ's need, such as BPM detection, beatmatching, and simple crossfading between tracks. Of course these things can be done with these tools, but it's not easy and not really what they are designed for.

The goal of this app is to provide a focused user experience that delivers on the need to lay out a series of tracks, easily tweak the transition from one track to the next (a mix), and save the output as a finished set. Once a good audio AI is available, the software will automatically mix between tracks.

Huge thanks to the NextUI team for creating such a [kickass UI](https://nextui.org) freely available.

The project uses [Wavesurfer](https://wavesurfer-js.org/) for waveform analysis and navigation.

Open source is more than a licensing strategy, it's a [movement](https://opensource.stackexchange.com/questions/9805/can-i-license-my-project-with-an-open-source-license-but-disallow-commercial-use). This work is made possible by the free labor of many open source contributers and their generous volunteerism.

## Available Commands

In the project directory:

First [install Bun](https://bun.sh/docs/installation), then use `"bun dev"` to launch the dev server.

The app is built using `Remix` which uses esBuild (now Vite) for really fast hot reloads. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Built With

- Typescript
- [Remix](https://remix.run/) SSR framework for React
- [NextUI](https://github.com/nextui-org/nextui) React library
- [BiomeJS](https://biomejs.dev/) for linting & formatting
- [Vite](https://vitejs.dev/) bundler
- [Valtio](https://valtio.pmnd.rs/) for App State
- [Dexie](https://dexie.org/) (IndexedDb) for Persistent State
- [WaveSurfer.js](https://wavesurfer.xyz/) for audio visualization
- Meta's [Demucs](https://github.com/facebookresearch/demucs) for audio stem separation
- [Highlight.io](https://www.highlight.io/) for analytics
- AI-driven testing by [Octomind](https://www.octomind.dev/)
- Hosting by Vercel (sorry CF team, their UI is amazing!)
  

## Roadmap

- [ ] Documentation
- [ ] Playlists / Track Organization
- [ ] Saving Mixes
- [ ] Creating Sets
- [x] User Authentication
- [ ] AI Automixing

## Author

**James Gentes**

- [Profile](https://github.com/jgentes 'James Gentes')
- [Email](mailto:jgentes@gmail.com?subject=Mixpoint 'Hi!')

## 🤝 Support

Give a ⭐️ if you like this project!
