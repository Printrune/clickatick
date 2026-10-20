# Immediate voice conversation v2

Brief v36. Supersedes entry behavior in v1. Retain unchanged Claude chat schema, provider and approved USD10 total limit.

Start and Resume open recognition synchronously from the deliberate button gesture, with no introductory TTS or echo delay. Current question remains visible. Subsequent accepted answers still update draft/scene, speak the assistant response, then return to listening automatically. Recognition uses continuous results and a short silence boundary after final words to stop capture and send once, without pressing Send. Listening timeout60seconds. Never submit interim-only words. Cancel stale callbacks and all timers on pause/stop/dispose. Never capture microphone audio during assistant playback to avoid self-transcription.

Add controller interrupt(): only while speaking, cancel TTS and immediately listen within the same bounded run. UI presents a prominent Talk now control during assistant speech. This is explicit interruption, not acoustic full-duplex/barge-in. Do not claim parity with a native realtime voice service or invent a new provider/credential.

Voice UI is a dedicated conversation view inside the existing bubble: animated state indicator, current assistant question, live transcript, automatic turn status, Pause/Resume, Talk now while assistant speaks, and Switch to typing. Hide the text composer and read-aloud checkbox during voice mode; keep underlying chat log and scene intact. No visual-style intake.

Ownership: voice specialist owns lib/voice-conversation.mjs and its tests. PM owns Workspace and CSS. Agree this contract before implementation. Versioned frontend/design review artifacts. Browser fixture tests simulate speech boundaries and must be labelled. Physical mic/audio success cannot be claimed without evidence.
