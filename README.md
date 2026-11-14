# MISSION: SECOND CHANCE

An educational browser game about spacecraft design, resource management,
and learning from engineering decisions.

Challenge: Space Mission Design Game
Registered event: Virudhunagar, India
Event: NASA Space Apps Challenge 2026

## Main idea

Design a spacecraft, operate a simulated flood-observation mission,
and investigate how changing one component changes the outcome.

The Second Chance feature records the player's actions and repeats them
under the same scheduled conditions with one altered instrument, solar
array, or battery.

## Run the game

Keep these files in the same folder:

- index.html
- style.css
- game.js
- replay.js
- save.js
- README.md

Open index.html in a modern browser.

No package installation, API key, or build command is required.

## How to play

1. Choose an instrument, solar array, battery, orbit, and launcher.
2. Resolve budget, mass, or launcher-compatibility problems.
3. Launch the mission.
4. Observe when the target is available.
5. Transmit during Earth-contact windows.
6. Conserve power when appropriate.
7. Deliver at least 1,200 useful-data units and survive all 12 turns.
8. Review the mission report.
9. Restore the original design and change one component.
10. Run Second Chance and compare the results.

Each turn represents five minutes.

## Implemented features

- Interactive spacecraft designer and CSS spacecraft illustration.
- Budget, mass, power, battery, and data calculations.
- Orbit-dependent fictional launcher capacities.
- Turn-based observation, communication, and conservation.
- Scripted clouds, eclipse periods, and reduced solar output.
- Limited storage and transmission capacity.
- Mission results and explanatory logs.
- Single-component replay with a comparison table.
- Browser-local design and original mission recording saves.
- JSON backup export and import.
- Responsive layout and reduced-motion styling.

The current version is single-player. It does not implement online
multiplayer, a global leaderboard, or live satellite-data ingestion.

## Scientific references and their use

### NASA–ISRO NISAR mission explanation

https://www.nasa.gov/news-release/nasa-isro-satellite-lifts-off-to-track-earths-changing-surfaces/

Used to explain radar's ability to observe through clouds and in darkness.
The game uses this qualitative distinction in its cloud-related instrument
quality rules.

No NISAR imagery, instrument specifications, or measured quality values
are ingested.

### NASA: Small Spacecraft Technology — Communications

https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications/

Used as educational support for the relationship between data return,
power consumption, and spacecraft constraints.

The game's transmitter power, storage capacity, and transfer limits are
fictional teaching values, not specifications taken from this source.

## Model assumptions

All hardware masses, costs, power values, launcher capacities, quality
factors, and science targets are fictional game parameters.

Orbits are scenario presets. The game does not solve orbital dynamics.
Weather, target passes, ground contact, and eclipse timing are scripted.

Battery energy change is:

(generation in watts - load in watts) × action duration in hours

Battery capacity limits stored energy. Charging losses, ageing, thermal
effects, and charge-rate limits are omitted.

Data volume equals instrument data rate multiplied by observing time.
Useful-data units are a fictional quality-weighted score, not a physical
scientific measurement.

Eclipse affects solar generation. Target illumination is not separately
modelled, so optical observations may be available during spacecraft eclipse.

The 60-minute exercise does not predict a spacecraft's operational lifetime.

## Replay rules

Only one instrument, solar array, or battery may change.
Orbit and launcher remain fixed.

The recorded action sequence is reused.
Unavailable actions become conservation actions and are counted.
If the original mission ended early, the remaining replay turns conserve.
The replay ends early if its battery is exhausted.

## Saving

The game saves the selected design and completed original mission recording.
It does not resume unfinished flights or restore the previous comparison table.

Browser-local storage depends on the browser and origin.
Download a JSON backup before moving from local files to a hosted website.

Imported backup results are not independently verified and must not be used
as authoritative competitive scores.

## Browser checks performed by the participant

- Default design: 65 credits and 47 kg.
- Launcher/orbit compatibility and budget checks.
- Default mission: Observe, Observe, Transmit repeated four times.
- Expected default result: 2,880 useful-data units and 94/100.
- Battery replay: identical delivered science, with budget changing
  from 65 to 73 credits.
- Extended battery selection survives a browser refresh.

Backup import/export and public hosting still require verification.

## Development and AI assistance

Built using HTML, CSS, JavaScript, and VS Code.

ChatGPT assisted with project planning, code generation, explanations,
and debugging. The participant assembled the files and performed the
reported browser checks.

Graphics are drawn with CSS.

## Submission status

This is a working educational prototype.

The challenge-specific official resource requirement, local event
instructions, final public URL, and submission materials still need
to be checked before submission.

This project is not a NASA operational tool or endorsed product.