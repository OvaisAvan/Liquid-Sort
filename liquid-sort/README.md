# Liquid Lab

A standalone browser liquid-sorting demo built with HTML, CSS and JavaScript.

Open through a local web server at `/liquid-sort/`. Upload this entire folder to `public_html/liquid-sort/` on cPanel and visit `https://blackspiderstudios.com/liquid-sort/`.

Tap a source jar, then a destination. Only a contiguous top colour pours, subject to matching top colour and available capacity. Empty jars accept any colour. Complete a level by filling each occupied jar with four layers of the same colour.

Includes three verified solvable levels, undo, restart, sounds, keyboard controls, reduced-motion support and a completion dialog. Jar buttons support Tab and Enter. Symbols distinguish colours. Sound starts after interaction.

Files: index.html, style.css, engine.js, game.js. No build step or backend required. Optional Google Fonts have system fallbacks. Portfolio links assume the folder sits directly inside the website root.

Run rules tests: `node --test liquid-sort/engine.test.cjs` from the portfolio root.

This is a first playable prototype with stylised pouring animation, not a fluid-physics simulation.
