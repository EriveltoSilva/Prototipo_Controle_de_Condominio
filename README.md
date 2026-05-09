# Centralidade do Kilamba - Sistema de Controlo Integrado

<p align="center">
  <img src="https://img.shields.io/badge/Arduino-Mega_2560-00979D?style=for-the-badge&logo=Arduino&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/Electron-31-47848F?style=for-the-badge&logo=electron&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  &nbsp;
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" />
</p>

Prototype integrated control system for a residential condominium, built with an Arduino Mega 2560 and an Electron desktop application. The controller manages traffic lights, streetlights, entry/exit gates, and environmental sensors. All state is transmitted over Serial and visualised in real time on the desktop panel.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Hardware Components](#hardware-components)
3. [Pin Assignments](#pin-assignments)
4. [Arduino Libraries](#arduino-libraries)
5. [Serial Protocol](#serial-protocol)
6. [Desktop Application](#desktop-application)
7. [Getting Started](#getting-started)
8. [Building the Installer](#building-the-installer)
9. [Author](#author)
10. [License](#license)

---

## Architecture

The Arduino Mega 2560 runs the hardware controller and sends a data packet every 2.5 s over Serial (9600 baud). The Electron desktop app receives and parses those packets, displays live state in the UI, and sends 3-character commands back to the board.

```
Arduino Mega 2560                        Electron Desktop App
---------------------   Serial 9600   --------------------------
2 Traffic lights      <------------>  React + TypeScript
3 Streetlights        data packets    TailwindCSS + shadcn/ui
4 Servo gates         commands        --------------------------
Fire sensor                           Traffic light panel
Rain sensor                           Gate control panel
HC-SR04 water level                   Streetlight panel
LCD 16x4 I2C                          Sensor panel
                                      Reservoir visualiser
                                      Activity log
```

---

## Hardware Components

| Component | Notes |
|-----------|-------|
| Arduino Mega 2560 | Main controller |
| LCD 16x4 I2C | Address 0x27, 4-page rotation every 2 s |
| Traffic lights | 2 units, 3 LEDs each (Red / Yellow / Green) |
| Streetlights | 3 units, LED or relay |
| Gate servos | 4x SG90 - Side A entrance + exit, Side B entrance + exit |
| HC-SR04 | Mounted on top of reservoir, measures air gap to water surface |
| Fire sensor | Digital module, LOW active |
| Rain sensor | Digital module, HIGH = raining |
| Status LED | Built-in pin 13 |

---

## Pin Assignments

### Traffic Lights

| Signal | Pin |
|--------|-----|
| TL1 Red | 22 |
| TL1 Yellow | 23 |
| TL1 Green | 24 |
| TL2 Red | 25 |
| TL2 Yellow | 26 |
| TL2 Green | 27 |

### Streetlights

| Signal | Pin |
|--------|-----|
| SL1 | 28 |
| SL2 | 29 |
| SL3 | 30 |

### Servo Gates

| Signal | Pin |
|--------|-----|
| Gate A Entrance | 4 |
| Gate A Exit | 5 |
| Gate B Entrance | 6 |
| Gate B Exit | 7 |

### Sensors

| Signal | Pin |
|--------|-----|
| HC-SR04 Trig | 8 |
| HC-SR04 Echo | 9 |
| Fire Sensor | 10 |
| Rain Sensor | 11 |
| Status LED | 13 |

### I2C (hardware pins on Mega)

| Signal | Pin |
|--------|-----|
| SDA | 20 |
| SCL | 21 |

---

## Arduino Libraries

Install via **Arduino IDE > Sketch > Include Library > Manage Libraries**:

| Library | Purpose |
|---------|---------|
| LiquidCrystal_I2C | LCD 16x4 over I2C |
| Servo (built-in) | Gate servo control |
| NewPing | HC-SR04 distance measurement |
| Wire (built-in) | I2C bus |

---

## Serial Protocol

### Arduino to Desktop (every 2.5 s)

```
$TL1:<R|Y|G>,TL2:<R|Y|G>,SL1:<0|1>,SL2:<0|1>,SL3:<0|1>,FR:<0|1>,WL:<cm>,RN:<0|1>,GAI:<O|C>,GAO:<O|C>,GBI:<O|C>,GBO:<O|C>,TLE:<0|1>#
```

Example:

```
$TL1:G,TL2:R,SL1:1,SL2:0,SL3:1,FR:0,WL:18.4,RN:1,GAI:O,GAO:C,GBI:C,GBO:C,TLE:1#
```

### Desktop to Arduino (3-char command + newline)

| Command | Action |
|---------|--------|
| TLO | Start traffic light auto-cycle |
| TLX | Turn off all traffic lights |
| L1O / L1X | Streetlight 1 ON / OFF |
| L2O / L2X | Streetlight 2 ON / OFF |
| L3O / L3X | Streetlight 3 ON / OFF |
| LOO | All streetlights ON |
| LXX | All streetlights OFF |
| AIO / AIC | Gate A Entrance Open / Close |
| AOO / AOC | Gate A Exit Open / Close |
| BIO / BIC | Gate B Entrance Open / Close |
| BOO / BOC | Gate B Exit Open / Close |
| REQ | Request immediate data packet |

Gates auto-close 5 s after being opened.

### Traffic Light Cycle

Both lights are always inverse. When TL1 is green TL2 is red, and vice versa.

```
TL1 Green (10 s) -> TL1 Yellow (3 s) -> TL2 Green (10 s) -> TL2 Yellow (3 s) -> repeat
```

---

## Desktop Application

Built with Electron 31, electron-vite, React 18, TypeScript 5, TailwindCSS 3, and shadcn/ui.

### Panels

| Panel | Description |
|-------|-------------|
| Traffic Light | Shows TL1/TL2 state with animated lights; toggle cycle on/off |
| Gate Control | Open/close each of the 4 gates individually |
| Streetlights | Toggle each light or all at once |
| Sensors | Fire detection and rain status badges |
| Reservoir | Visual animated tank with configurable height and control points saved in localStorage |
| Activity Log | Timestamped log of all received data, sent commands, and system events |

### Project Structure

```
src/
  main/
    index.ts
    serial.ts              serial port management and packet parsing
  preload/
    index.ts               contextBridge IPC bridge
  renderer/
    src/
      App.tsx
      components/
        ActivityLog.tsx
        GatePanel.tsx
        ReservoirPanel.tsx
        ReservoirConfigDialog.tsx
        SensorPanel.tsx
        SerialBar.tsx
        StreetlightPanel.tsx
        TrafficLightPanel.tsx
      hooks/
        useBoardData.ts
  types/
    board.ts               shared TypeScript interfaces
hardware/
  Mega_Main_Controller/
    Mega_Main_Controller.ino
dist/                      installer output after npm run package
```

---

## Getting Started

### Arduino

1. Open `hardware/Mega_Main_Controller/Mega_Main_Controller.ino` in Arduino IDE
2. Install the required libraries listed above
3. Select **Tools > Board > Arduino Mega 2560**
4. Select the correct COM port and click **Upload**
5. Open Serial Monitor at **9600 baud** to verify packets arrive

### Desktop App

Requires Node.js 18 or higher.

```bash
# Install dependencies
npm install

# Rebuild the native serial port module for Electron
npm run rebuild

# Start in development mode
npm run dev
```

Connect the Arduino via USB, then select the port in the app header and click **Ligar**.

---

## Building the Installer

> **Requirement:** Enable Windows Developer Mode before building.
> Settings > Privacy & Security > For Developers > Developer Mode: ON
> This grants the symlink creation rights needed by electron-builder.

```bash
npm run package
```

Output in `dist/`:

| File | Description |
|------|-------------|
| Gestao da Centralidade Setup 1.0.0.exe | NSIS installer (~77 MB) |
| Gestao da Centralidade-1.0.0-win.zip | Portable archive (~106 MB) |

---

## Author

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/eriveltosilva">
        <img src="https://avatars.githubusercontent.com/u/125351173?v=4" width="100px" alt="Erivelto Silva" /><br>
        <sub><b>Erivelto Silva</b></sub>
      </a>
    </td>
  </tr>
</table>

<p>
  <a href="https://www.linkedin.com/in/erivelto-silva-39a61a275">
    <img src="https://img.shields.io/badge/LinkedIn-Erivelto_Silva-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://github.com/eriveltosilva">
    <img src="https://img.shields.io/badge/GitHub-eriveltosilva-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>

---

## License

This project is licensed under the [MIT License](LICENSE).
