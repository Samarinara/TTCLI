# **App Name**: WhisperNet

## Core Features:

- GM Broadcast: The GM can broadcast messages to all connected players, visible on their individual interfaces.
- Player to GM Messages: Players can send direct messages to the GM, viewable only by the GM.
- Autotype Effect: Display messages with an autotype effect, mimicking old DOS command-line interfaces.
- CRT Effects: Simulate CRT monitor glitches, like static and flickering, for visual effect.
- Peer Discovery: Players connect using local networking via IP Addresses provided to them.
- Ownership transfer: The server host can set another connected user as the GM
- Connected User List: Display list of currently connected users
- GM Dashboard: The GM's screen should have user's information

## Style Guidelines:

- Primary color: Green (#00FF00), reminiscent of classic DOS terminals, used for text.
- Background color: Very dark gray (#111111) to emulate the black background of old monitors.
- Accent color: Slightly brighter gray (#555555) to highlight active elements and status indicators, maintaining contrast without overwhelming the green text.
- Font: 'Source Code Pro' (monospace) for displaying text and emulating a terminal interface.
- Implement a scanline effect and subtle flickering to mimic old CRT monitors.
- Interface uses a full-screen, text-based layout to create a DOS command line environment.
- Each character appears sequentially, simulating the typing speed of older terminals.