# web-audio-output Specification

## Purpose

Defines how the browser build of the game outputs sound: the size of the audio chunk the game hands over per audio system call, and the allowed latency, so that processing a game frame on the main thread does not cause dropouts and clicks.

## Requirements

### Requirement: An audio chunk covers a game frame
In the browser build the system SHALL request output from the audio system in chunks of no less than 40 ms of audio (2048 frames at a 44.1–48 kHz sample rate). A main-thread stall for the duration of one game frame (up to 40 ms) SHALL NOT cause a dropped chunk or an audible click.

#### Scenario: Playing on a phone with frames up to 40 ms
- **WHEN** the player drives across the map on an Android device, main loop frames last up to 40 ms, music and sound effects are playing
- **THEN** in 20 s of play no more than 10 audio chunks are delivered later than 1.5 chunk durations after the previous one, and no crackle is audible

#### Scenario: A single stall longer than a chunk
- **WHEN** one game frame lasts longer than one chunk (for example a 60 ms load)
- **THEN** at most one chunk is dropped, after which output continues without accumulated lag

### Requirement: Sound latency stays playable
The total latency from the game starting a sound effect to its output from the speaker in the browser build SHALL NOT exceed 200 ms on Android and desktop (two chunks of buffering plus the audio system latency).

#### Scenario: A shot is heard without noticeable delay
- **WHEN** the player fires
- **THEN** the shot sound starts no later than 200 ms after the event in the game

### Requirement: Native builds do not change
The audio chunk size in builds not targeting the browser SHALL stay as before (512 frames).

#### Scenario: Build for another platform
- **WHEN** the game is built for something other than the browser
- **THEN** the audio device is opened with a 512-frame chunk, as before the change
