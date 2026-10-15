# Flight Connectivity System — SkyReach

A responsive, client-side web application implementing the Flight Connectivity System from the Discrete Mathematics presentation.

## Run on Windows
1. Download and extract `flight-connectivity-system.zip`.
2. Open the extracted `flight_connectivity_system` folder.
3. Double-click `index.html` to open it in Chrome or Edge.
4. For a VS Code workflow, open the folder in VS Code and optionally use the Live Server extension.

No Node.js, database, or API key is required.

## Features
- Overview dashboard and illustrative directed network
- Add/remove airports and direct flights
- Adjacency matrix and positive-length reachability matrix
- Route checker with a sample itinerary and layover count
- Reset demo data button
- Responsive desktop/mobile interface

## Algorithm
The reachability matrix starts as a copy of the adjacency matrix. Warshall's algorithm updates it using:
`R[i][j] = R[i][j] OR (R[i][k] AND R[k][j])`
with `k` as the outer loop. The application uses positive-length reachability (R+), matching the presentation's diagonal convention. The route checker reads the Warshall closure for the yes/no result and uses BFS only to reconstruct one sample path for display.

## Demo data from the presentation
Airports: Delhi (DEL), Mumbai (BOM), Hyderabad (HYD), Bengaluru (BLR), Goa (GOI)
Direct flights: DEL→BOM, BOM→HYD, HYD→BLR, GOI→DEL

Note: This is a demonstration model, not live airline data. It does not include schedules, ticket prices, real flight availability, or transfer-time constraints.
