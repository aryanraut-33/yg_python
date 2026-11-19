# yg python: Project Catalogue

These are the 26 projects picked from the list of 60 we proposed. They are grouped into four difficulty levels, and each one carries a category tag. All of them run in the browser with Python (Pyodide). Kids install nothing.

- **Levels** follow the order kids learn Python in. Each level uses only ideas from the levels before it, plus the new ones it introduces.
- **Session** means one sitting of about 30–40 minutes.
- **Hero**: ⭐ marks the 10 projects shown in the landing page carousel.

## At a glance

| Level | Project | Category | Sessions | Needs | Hero |
|---|---|---|---|---|---|
| 1 · Spark | Name Light Show | Art and design | 1 | Stage | |
| 1 · Spark | Rocket Launch | Space and science | 1 | Stage | |
| 1 · Spark | Spiral Art | Art and design | 2 | Stage (turtle) | |
| 1 · Spark | Guess My Number | Games | 2 | None | |
| 1 · Spark | Story Machine | Words and codes | 2 | None | |
| 1 · Spark | Pocket Money Tracker | Real-world tools | 2 | Stage (charts) | |
| 1 · Spark | Mars Rover Rescue | Robots | 3 | Robot simulator | ⭐ |
| 2 · Maker | Memory Match | Games | 3 | Stage | |
| 2 · Maker | Filter Lab | Camera magic | 3 | Photo or camera | |
| 2 · Maker | Rangoli Generator | Art and design | 3 | Stage (turtle) | |
| 2 · Maker | Secret Code Machine | Words and codes | 3 | None | ⭐ |
| 2 · Maker | Comic Strip Maker | Words and codes | 3 | Stage | |
| 2 · Maker | Weather Watcher | Real-world tools | 3 | Weather data | |
| 2 · Maker | Planet Maker | Space and science | 4 | Stage | ⭐ |
| 3 · Builder | Snake | Games | 4 | Stage (game loop) | |
| 3 · Builder | One-Button Flyer | Games | 4 | Stage (game loop) | |
| 3 · Builder | Chandrayaan Lander | Space and science | 4 | Stage (physics) | ⭐ |
| 3 · Builder | Drone Delivery | Robots | 4 | Robot simulator | ⭐ |
| 3 · Builder | Cricket Stats Explorer | Real-world data | 4 | Bundled dataset | ⭐ |
| 3 · Builder | Invisible Cloak | Camera magic | 4 | Camera | ⭐ |
| 3 · Builder | Finger Painter | Camera magic | 4 | Camera and hand tracking | ⭐ |
| 3 · Builder | Air Drums | Camera magic | 4 | Camera, hand tracking and sound | |
| 4 · Inventor | Hand Rock-Paper-Scissors | Camera magic | 5 | Camera and hand tracking | |
| 4 · Inventor | Self-Driving Car | Robots | 5 | Robot simulator | |
| 4 · Inventor | Doodle Guesser | Make your own AI | 5 | scikit-learn (bundled) | ⭐ |
| 4 · Inventor | Train Route Finder | Real-world data | 5 | Bundled rail graph | ⭐ |

**By category:**

| Category | Projects | Count |
|---|---|---|
| Camera magic | Filter Lab, Invisible Cloak, Finger Painter, Air Drums, Hand Rock-Paper-Scissors | 5 |
| Robots (simulated) | Mars Rover Rescue, Drone Delivery, Self-Driving Car | 3 |
| Games | Guess My Number, Memory Match, Snake, One-Button Flyer | 4 |
| Art and design | Name Light Show, Spiral Art, Rangoli Generator | 3 |
| Space and science | Rocket Launch, Planet Maker, Chandrayaan Lander | 3 |
| Make your own AI | Doodle Guesser | 1 |
| Real-world data and tools | Pocket Money Tracker, Weather Watcher, Cricket Stats Explorer, Train Route Finder | 4 |
| Words, stories and codes | Story Machine, Secret Code Machine, Comic Strip Maker | 3 |

**Free tier:** under the pricing decision, free accounts get the starter (Name Light Show) plus 2 projects. I suggest offering the other Level 1 projects as the free picks, because they show the range (games, stories, robots) before a family pays.

## Python concepts by level

| Level | New ideas | Kids can now |
|---|---|---|
| 1 · Spark | `print`, variables, strings, `for` and `range`, `if`/`else`, `input`, `random`, lists, simple functions | Make things happen in order, repeat them, and react to choices |
| 2 · Maker | Nested loops, 2D lists (grids), dictionaries, string methods, `ord`/`chr`, modulo, reading data (JSON or CSV), functions with return values | Work with grids, pictures, text and real data |
| 3 · Builder | Game loop and events, state, coordinates and velocity, simple physics, list-of-dicts data, sorting with `key=`, reading the camera and hand points | Build things that move, respond in real time and use real data |
| 4 · Inventor | Classes, recursion or search, graphs, training and testing a model, combining several systems | Build "smart" programs that decide, learn or search |

## Platform pieces these projects need

Each piece has to be built once, and then several projects can use it.

| Piece | What it is | Used by |
|---|---|---|
| **Stage library** (already planned) | Drawing, turtle, sprites, game loop, keyboard and touch input, sound, charts | Almost every project |
| **Robot simulator** | A 2D world with a robot: wheels or rotors, distance and light sensors, obstacles, wind, battery. It is an extension of the stage library. | Mars Rover Rescue, Drone Delivery, Self-Driving Car |
| **Camera bridge** | Webcam frames as a small pixel grid (for example 160×120) for Python. An in-browser hand-tracking model (MediaPipe, Apache 2.0, free) gives Python 21 hand points per hand. | Filter Lab, Invisible Cloak, Finger Painter, Air Drums, Hand Rock-Paper-Scissors |
| **Bundled datasets** | Small, cleaned files that ship with the project. They need no live API calls from a child's browser. | Cricket Stats Explorer, Weather Watcher, Train Route Finder, Pocket Money Tracker (sample data) |
| **scikit-learn in Pyodide** | Runs in the browser; includes the built-in `load_digits` dataset, so there is nothing to download | Doodle Guesser, and Hand Rock-Paper-Scissors as an optional extra |

### Camera projects and child privacy (DPDP)

These rules apply to all five camera projects:

1. **Nothing leaves the device.** Webcam frames and hand points stay in the browser. Nothing is uploaded, stored or logged.
2. **Off by default.** The camera starts only when the kid presses "Turn on camera". A visible indicator shows while it's on.
3. **No face recognition, and no face storage.** We track hands and colours only.
4. **Sharing never includes video.** On the family share page, camera projects show:
   - a drawn hand skeleton replayed from recorded points, or
   - the kid's code running on a stock sample video.
5. **There is always a no-camera path.** Every camera project runs on a sample video or photo, so kids without a webcam (or with the camera off) can still finish it.
6. **Parents are told.** The parent dashboard lists which projects use the camera, with the same on-device explanation.

---

## Level 1 · Spark

### Name Light Show
**Category:** Art and design · **Sessions:** 1 · **Phone:** yes
**Pitch:** *Make your name light up.*
**What they build:** The kid's name appears as a row of glowing circles that blink, wave and change colour in patterns they program.
**Wow moment:** The first time they run the code, their own name lights up on screen.
**Python:** `print`, strings, variables, `for` loops, `range`, colours as values.
**Steps:**
1. Print your name.
2. Put each letter in a light.
3. Loop the lights on and off.
4. Make a wave pattern.
5. Pick your colours.

**Show-off hook:** a family member's name in lights, sent to them.

### Rocket Launch
**Category:** Space and science · **Sessions:** 1 · **Phone:** yes
**Pitch:** *Count down. Launch a rocket.*
**What they build:** A countdown from 10 that ends with a rocket lift-off animation, smoke and a "Lift-off!" message.
**Wow moment:** The rocket leaves the screen exactly on zero.
**Python:** `for` with `range(10, 0, -1)`, `time`/wait, `if`.
**Steps:**
1. Count down with `print`.
2. Add wait time.
3. Launch on zero.
4. Add smoke and speed.
5. Name your rocket.

**Show-off hook:** "Mission Dadi", a launch named after a family member.

### Spiral Art
**Category:** Art and design · **Sessions:** 2 · **Phone:** yes
**Pitch:** *Loops make real art.*
**What they build:** Turtle spirals, starting with a simple square spiral and ending with multicolour designs. Kids change one number and get a completely different pattern.
**Wow moment:** Changing 90° to 91° turns a square into a galaxy.
**Python:** `for` loops, variables that change inside a loop, turtle commands, lists of colours.
**Steps:**
1. Draw a square.
2. Grow it into a spiral.
3. Bend the angle.
4. Cycle through colours.
5. Save your best design as a print.

**Show-off hook:** a gallery card and a downloadable poster.

### Guess My Number
**Category:** Games · **Sessions:** 2 · **Phone:** yes
**Pitch:** *Build a game nobody can beat.*
**What they build:** The computer picks a secret number, and the player guesses with "higher" or "lower" hints. A stretch goal flips it so the computer guesses yours in 7 tries or fewer.
**Wow moment:** The computer guesses their number with a trick (binary search) they wrote themselves.
**Python:** `random`, `input`, `while`, `if`/`elif`/`else`, counters.
**Steps:**
1. Pick a secret number.
2. Ask for a guess.
3. Give hints.
4. Count the tries.
5. Swap roles so the computer guesses.

**Show-off hook:** the family plays it from the share link, and the best score wins.

### Story Machine
**Category:** Words and codes · **Sessions:** 2 · **Phone:** yes
**Pitch:** *Write a story that writes itself.*
**What they build:** A story generator that mixes the kid's own lists of heroes, places, problems and twists into a new story each time.
**Wow moment:** The machine writes a ridiculous story about their sibling.
**Python:** lists, `random.choice`, f-strings, functions.
**Steps:**
1. Make word lists.
2. Build one sentence.
3. Make a story of three sentences.
4. Add a twist ending.
5. Read it aloud with text-to-speech.

**Show-off hook:** a new story every time a family member opens the link.

### Pocket Money Tracker
**Category:** Real-world tools · **Sessions:** 2 · **Phone:** yes
**Pitch:** *Save up for the thing you really want.*
**What they build:** A tracker with a savings goal, money in and money out, and a chart that shows how many weeks until they reach the goal.
**Wow moment:** The chart predicts the exact week they can buy their goal item.
**Python:** lists, `sum`, `len`, arithmetic, simple charts.
**Steps:**
1. Set a goal.
2. Log money in and out.
3. Total it.
4. Chart it.
5. Predict the finish week.

**Show-off hook:** parents see the plan (a nice moment for the parent dashboard).
**Note:** uses sample data or data the kid types in. It never connects to real bank or UPI data.

### Mars Rover Rescue ⭐
**Category:** Robots · **Sessions:** 3 · **Phone:** yes (on-screen buttons)
**Pitch:** *Drive a rover across Mars.*
**What they build:** Command lists (`forward(3)`, `turn("left")`) steer a rover around craters to a stranded probe and back to base before the battery runs out. Later missions need functions to keep the code short.
**Wow moment:** The rover rolls home with 2% battery left.
**Python:** function calls, sequences, lists of commands, defining their own functions, simple loops.
**Steps:**
1. Drive forward.
2. Turn.
3. Dodge craters.
4. Write a `go_around()` function.
5. Rescue the probe within the battery budget.

**Show-off hook:** a replay of the mission on the share page.
**Needs:** robot simulator. This is the first use, and it proves the simulator works.

---

## Level 2 · Maker

### Memory Match
**Category:** Games · **Sessions:** 3 · **Phone:** yes (built for touch)
**Pitch:** *Flip, remember, match.*
**What they build:** A card-flipping memory game with the kid's own card faces, a move counter and a best score.
**Wow moment:** They beat a parent at a game they built.
**Python:** 2D grids, `random.shuffle`, state (which cards are face-up), click and tap events.
**Steps:**
1. Lay out a grid.
2. Shuffle the pairs.
3. Flip on tap.
4. Check for a match.
5. Count moves and keep the best score.

**Show-off hook:** a family challenge to beat their score.

### Filter Lab
**Category:** Camera magic · **Sessions:** 3 · **Phone:** yes
**Pitch:** *Invent your own photo filters.*
**What they build:** Filters written pixel by pixel: grayscale, sepia, pixel art, thermal vision and comic outline. Kids apply them to a sample photo or a still taken from the camera.
**Wow moment:** Their own "thermal vision" filter makes the room look like a spy film.
**Python:** nested loops, 2D lists of pixels, RGB maths, functions with return values.
**Steps:**
1. Read one pixel.
2. Make it gray.
3. Loop over every pixel.
4. Write three filters.
5. Invent your own filter and name it.

**Show-off hook:** the shared result is applied to a **stock photo**, never the kid's camera image.
**Gateway:** this teaches the pixel skills that Invisible Cloak needs.

### Rangoli Generator
**Category:** Art and design · **Sessions:** 3 · **Phone:** yes
**Pitch:** *Design a rangoli for Diwali.*
**What they build:** Symmetric rangoli patterns made by drawing one petal and rotating it 8 or 12 times, with colour palettes and dot grids. Kids can export a printable version.
**Wow moment:** A one-line change turns their design into a completely different rangoli.
**Python:** functions with parameters, loops with angles, symmetry, lists of colours.
**Steps:**
1. Draw one petal.
2. Rotate it into a ring.
3. Add rings.
4. Pick a palette.
5. Export it as a greeting card.

**Show-off hook:** a festival greeting card sent to the whole family. It's seasonal, so plan a campaign around Diwali.

### Secret Code Machine ⭐
**Category:** Words and codes · **Sessions:** 3 · **Phone:** yes
**Pitch:** *Write a secret code only family can crack.*
**What they build:** A Caesar cipher first, then a cipher wheel with a chosen key, and finally a two-wheel machine. Kids send a coded message through the family link, and only someone with the key can read it.
**Wow moment:** Mama decodes their message using the key they told her privately.
**Python:** strings, `ord`/`chr`, modulo `%`, functions, loops over text.
**Steps:**
1. Shift one letter.
2. Shift a word.
3. Wrap around from Z to A.
4. Decode.
5. Build the two-wheel machine and send a secret message.

**Show-off hook:** fits the family-invite feature perfectly. The message is shown coded, with a "type the key" box.

### Comic Strip Maker
**Category:** Words and codes · **Sessions:** 3 · **Phone:** yes
**Pitch:** *Make a comic with code.*
**What they build:** A three- or four-panel comic. Kids place characters and props and write speech bubbles, with functions such as `panel()` and `say()` handling the layout.
**Wow moment:** One change to the `say()` function restyles every bubble in the comic.
**Python:** functions with parameters, lists of dicts, coordinates, reuse.
**Steps:**
1. Draw a panel.
2. Place a character.
3. Add a speech bubble.
4. Make it four panels.
5. Write a punchline.

**Show-off hook:** a printable comic page.

### Weather Watcher
**Category:** Real-world tools · **Sessions:** 3 · **Phone:** yes
**Pitch:** *Is it going to rain on match day?*
**What they build:** A dashboard for their city: temperature and rain charts, the hottest day of the month, and a "carry an umbrella?" rule they write themselves.
**Wow moment:** Their umbrella rule correctly predicts tomorrow.
**Python:** reading JSON, dictionaries, lists, `max`/`min`, charts.
**Steps:**
1. Load the city's weather.
2. Find the hottest day.
3. Chart the rain.
4. Write the umbrella rule.
5. Compare two cities.

**Show-off hook:** a "Weather by [kid's name]" card for their city.
**Data note:** Open-Meteo's free API is **non-commercial only**. To stay at zero cost, cache a daily snapshot for about 30 Indian cities through our Cloudflare Worker, or bundle historical data with the project. Don't call any API directly from a child's browser.

### Planet Maker ⭐
**Category:** Space and science · **Sessions:** 4 · **Phone:** yes
**Pitch:** *Design a planet. Name it after you.*
**What they build:** A custom planet with size, colour bands, rings and moons. Moons orbit using a simple gravity step, and kids tweak mass and distance to stop a moon flying away.
**Wow moment:** The first time a moon settles into a stable orbit that they tuned.
**Python:** variables, functions, loops as time steps, lists of moons, a little physics.
**Steps:**
1. Draw the planet.
2. Add bands and rings.
3. Add one moon.
4. Make it orbit.
5. Add more moons without any of them escaping.

**Show-off hook:** "Planet [kid's name]" with a looping orbit on the share page.

---

## Level 3 · Builder

### Snake
**Category:** Games · **Sessions:** 4 · **Phone:** yes (swipe controls)
**Pitch:** *Grow the longest snake.*
**What they build:** The classic grow-and-dodge game, with walls, speed-ups and the kid's own twist (portals, poison food or two players).
**Wow moment:** Their own twist makes the game feel like theirs.
**Python:** game loop, lists as a queue (the snake body), keyboard and swipe events, collision checks.
**Steps:**
1. Move a square.
2. Steer it.
3. Grow on food.
4. Crash on walls and on yourself.
5. Add your twist.

**Show-off hook:** a family high-score board on the share page.

### One-Button Flyer
**Category:** Games · **Sessions:** 4 · **Phone:** yes (built for tapping)
**Pitch:** *One button. Infinite gaps.*
**What they build:** A side-scrolling flyer where tapping gives a boost, gravity pulls the character down, and the gaps get tighter over time. Kids design the character and the world.
**Wow moment:** Tuning gravity until the game feels just right.
**Python:** velocity and gravity, game loop, random obstacles, scoring.
**Steps:**
1. Make the character fall.
2. Tap to boost.
3. Scroll the obstacles.
4. Crash and score.
5. Tune the difficulty.

**Show-off hook:** "Beat my score" sent to family.
**Note:** keep the art and names original. This is the genre, not a copy of any one game.

### Chandrayaan Lander ⭐
**Category:** Space and science · **Sessions:** 4 · **Phone:** yes
**Pitch:** *Land softly on the Moon.*
**What they build:** A lunar lander under Moon gravity with limited fuel. Kids first fly it by hand, then write an autopilot (`if height < 50: thrust()`) that lands by itself.
**Wow moment:** Their autopilot lands perfectly on its own, a nod to India's 2023 landing.
**Python:** physics step (height, speed, gravity), `if` rules, a loop as time, fuel budget.
**Steps:**
1. Fall under Moon gravity.
2. Add thrust.
3. Land by hand.
4. Write the autopilot.
5. Land on the least fuel.

**Show-off hook:** a landing replay with the fuel used, so families can compare autopilots.

### Drone Delivery ⭐
**Category:** Robots · **Sessions:** 4 · **Phone:** yes
**Pitch:** *Fly a parcel across the city.*
**What they build:** A drone that takes off, flies across the city to the right rooftop, corrects for wind and lands the parcel. Later levels add more parcels and battery limits.
**Wow moment:** The drone fights a gust of wind and still lands on the "H".
**Python:** coordinates, functions such as `fly_to(x, y)`, loops, correcting for an error (wind), lists of deliveries.
**Steps:**
1. Take off.
2. Fly to a point.
3. Land.
4. Correct for wind.
5. Deliver three parcels on one battery.

**Show-off hook:** a delivery-route replay.
**Needs:** robot simulator (adds flight and wind).

### Cricket Stats Explorer ⭐
**Category:** Real-world data · **Sessions:** 4 · **Phone:** yes
**Pitch:** *Settle every cricket argument.*
**What they build:** Load real ball-by-ball match data, find top run-scorers and best strike rates, chart them, and answer a question the kid picks ("Who's best in the last 5 overs?").
**Wow moment:** Their chart wins a real argument at the dinner table.
**Python:** lists of dicts, loops with totals, `sorted(..., key=...)`, averages, charts.
**Steps:**
1. Load the matches.
2. Count runs.
3. Rank the players.
4. Chart the top 5.
5. Answer your own question.

**Show-off hook:** a "Stat of the day" card for the family group.
**Data and naming notes:**
- Use **Cricsheet** open data (free, attribution required), bundled and pre-cleaned.
- Market it as **Cricket Stats Explorer**, not "IPL Stats Explorer". "IPL" is a BCCI trademark, so don't use it in product names or marketing. The dataset itself can include league matches.

### Invisible Cloak ⭐
**Category:** Camera magic · **Sessions:** 4 · **Phone:** yes (the phone camera works well)
**Pitch:** *Hold up a cloth. Disappear.*
**What they build:**
1. First, capture an empty-room background.
2. Then, every frame, swap any pixel that matches the chosen colour (green, say) with the background pixel.

Holding up a green cloth makes that part of them vanish.
**Wow moment:** They actually disappear on screen.
**Python:** pixel grids, colour ranges (`is_green`), nested loops, then a speed-up with NumPy.
**Steps:**
1. Read the camera.
2. Save the background.
3. Find green pixels.
4. Swap them.
5. Clean up the edges.

**Show-off hook:** the share page shows the effect on a **stock video**, not the kid. See the privacy rules above.
**Needs:** camera bridge (pixel grid at a low resolution so phones keep up), and Filter Lab first.

### Finger Painter ⭐
**Category:** Camera magic · **Sessions:** 4 · **Phone:** yes
**Pitch:** *Paint in the air with one finger.*
**What they build:** Hand tracking gives Python 21 points per hand. The index fingertip becomes a brush, a pinch changes colour, and an open palm clears the canvas.
**Wow moment:** Drawing a heart in mid-air and seeing it appear.
**Python:** coordinates, lists of points, state (pen up or down), distance between points to detect a pinch.
**Steps:**
1. Show the hand points.
2. Find the fingertip.
3. Draw a trail.
4. Pinch to change colour.
5. Palm to clear.

**Show-off hook:** the finished painting, and a replay of the brush strokes, with no video.
**Needs:** camera bridge with hand tracking.

### Air Drums
**Category:** Camera magic · **Sessions:** 4 · **Phone:** yes (landscape)
**Pitch:** *Play drums on thin air.*
**What they build:** Virtual drums on screen. Moving a hand into a drum's zone plays its sound, and kids design their own kit (tabla, dhol, electronic).
**Wow moment:** Playing a beat with no instrument at all.
**Python:** coordinates, `if` zone checks, dictionaries (drum to sound), timing (stopping repeated hits).
**Steps:**
1. Show the hand points.
2. Draw the drum zones.
3. Hit detection.
4. Play sounds.
5. Build your own kit.

**Show-off hook:** a recorded beat (audio plus hand skeleton) that family can play back.
**Needs:** camera bridge with hand tracking, plus sound from the stage library.

---

## Level 4 · Inventor

### Hand Rock-Paper-Scissors
**Category:** Camera magic · **Sessions:** 5 · **Phone:** yes
**Pitch:** *Beat the computer with your real hand.*
**What they build:** The program counts raised fingers from hand points to read rock, paper or scissors, and plays the computer with scoring. A stretch goal trains a nearest-neighbour model on the kid's own gestures instead of using hand-written rules.
**Wow moment:** The computer reads their real hand gesture correctly.
**Python:** combines hand points, functions, `if` rules, game state; optionally classes and a simple machine-learning model.
**Steps:**
1. Count fingers.
2. Name the gesture.
3. Computer picks a move.
4. Decide the winner.
5. Train your own gesture model.

**Show-off hook:** a match replay drawn with the hand skeleton.

### Self-Driving Car
**Category:** Robots · **Sessions:** 5 · **Phone:** yes
**Pitch:** *Teach a car to drive itself.*
**What they build:** A car with distance sensors on a track. Kids write steering rules, then tune them until it laps without crashing, and finally race against family members' cars on harder tracks.
**Wow moment:** Their car finishes a lap with no hands on the controls.
**Python:** sensor readings, `if` rules that become a steering formula, classes (`Car`), tuning numbers.
**Steps:**
1. Read the sensors.
2. Steer away from walls.
3. Smooth the steering.
4. Complete a lap.
5. Beat a harder track.

**Show-off hook:** a lap-time leaderboard among invited family members.
**Needs:** robot simulator (adds a car and distance sensors).

### Doodle Guesser ⭐
**Category:** Make your own AI · **Sessions:** 5 · **Phone:** yes (draw with a finger)
**Pitch:** *Draw a number. Watch it guess.*
**What they build:**
1. Train a real model on scikit-learn's built-in handwritten digits dataset (no download needed).
2. Test how accurate it is.
3. Draw a digit on an 8×8 pad and watch the model guess it, with a confidence bar for each digit.

**Wow moment:** The model reads their handwriting and says "7, 94% sure".
**Python:** data and labels, train/test split, `fit`/`predict`, accuracy, lists and charts.
**Steps:**
1. Look at the digit data.
2. Train a model.
3. Test it.
4. Draw your own digit.
5. Find a drawing that fools it.

**Show-off hook:** a family challenge to draw a digit the model gets wrong.
**Note:** the kid trains this model themselves; it isn't a chatbot. It fits the "no AI tutor in the MVP" decision.

### Train Route Finder
**Category:** Real-world data · **Sessions:** 5 · **Phone:** yes
**Pitch:** *Find the fastest train home.*
**What they build:** A simplified Indian rail network stored as a graph (cities, and journey times between them). Kids write the search that finds the fastest route between any two cities, then add changes and waiting times.
**Wow moment:** Their code finds a faster route than the obvious one.
**Python:** dictionaries of dictionaries (a graph), queues, a shortest-path search (Dijkstra, explained simply), recursion or loops.
**Steps:**
1. Build the map.
2. List the neighbours.
3. Find any route.
4. Find the fastest.
5. Add waiting time for changes.

**Show-off hook:** "Fastest way to Nani's house" shared as a route card.
**Data note:** bundle a small, hand-made graph with approximate times. Don't scrape or call live railway APIs.

---

## Landing page hero (10 projects)

The order in the carousel mixes categories so no two projects in a row look alike:

1. Invisible Cloak
2. Finger Painter
3. Mars Rover Rescue
4. Drone Delivery
5. Chandrayaan Lander
6. Planet Maker
7. Doodle Guesser
8. Cricket Stats Explorer
9. Train Route Finder
10. Secret Code Machine

The designs are in Figma, file "yg_python — Product UI", on the Landing page, in the flows "Hero carousel · Dark" and "Hero carousel · Light".
