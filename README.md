# Bagleitwerkzeuge für die Bachelorarbeit Featureentwicklung in modernen Browsern

Dieses Repository enthält sämtliche Werkzeuge, die im Rahmen der Bachelorarbeit "Featureentwicklung in modernen Browsern" erstellt wurden. Sie ermöglichen es automatisiert die Graphen aus der Bachelorarbeit zu reproduzieren.

## Installation

1. Dieses Repository klonen
2. `npm install` ausführen

Diese Werkzeuge benötigt eine aktuelle Version von Node.js zur Ausführung. Es wird Node.js 18 oder höher empfohlen.

## Generierung der Graphen

Dieser Schritt kann je nach Gerät über eine Stunde dauern.

### Offline / Basierend auf den Bachelorarbeitsdaten

1. `npm run build:offline` ausführen.

Dieser Befehl regeneriert die Datenbank basierend auf der eingecheckten Version der `data/raw.json`.

### Online

1. `npm run build` ausführen

Dieser Befehl aktualisiert die vorhandene `data/raw.json` und führt danach die selben Schritte wie die offline Version des Befehls aus.
