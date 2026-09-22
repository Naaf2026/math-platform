export type SpeedCategory = "Quick maths" | "Spot & tap" | "Number trails" | "Memory beats" | "Build & sort";
export type SpeedGame = { id: string; slug: string; title: string; description: string; category: SpeedCategory; emoji: string; instructions: string; image: string };
export const SPEED_GAMES: SpeedGame[] = [
  {
    "id": "speed-01",
    "slug": "rocket-addition",
    "title": "Rocket Addition",
    "description": "Launch your rocket by adding two fuel numbers.",
    "category": "Quick maths",
    "emoji": "🚀",
    "instructions": "Add the two numbers. Tap the fuel tank with the right total.",
    "image": "/brain-games/speed-rush/rocket-addition.webp"
  },
  {
    "id": "speed-02",
    "slug": "submarine-subtraction",
    "title": "Submarine Subtraction",
    "description": "Dive for pearls and find how many remain.",
    "category": "Quick maths",
    "emoji": "🤿",
    "instructions": "Some pearls swim away. Tap how many are left.",
    "image": "/brain-games/speed-rush/submarine-subtraction.webp"
  },
  {
    "id": "speed-03",
    "slug": "banana-bonds",
    "title": "Banana Bonds",
    "description": "Pick two banana bunches to feed your monkey.",
    "category": "Build & sort",
    "emoji": "🐒",
    "instructions": "Tap two bunches that add up to the target. Tap a bunch again to put it back.",
    "image": "/brain-games/speed-rush/banana-bonds.webp"
  },
  {
    "id": "speed-04",
    "slug": "pizza-doubles",
    "title": "Pizza Doubles",
    "description": "Make a double order for your hungry customers.",
    "category": "Quick maths",
    "emoji": "🍕",
    "instructions": "Two identical pizzas need toppings. Double the number shown.",
    "image": "/brain-games/speed-rush/pizza-doubles.webp"
  },
  {
    "id": "speed-05",
    "slug": "penguin-halves",
    "title": "Penguin Halves",
    "description": "Share a fish feast equally between two penguins.",
    "category": "Quick maths",
    "emoji": "🐧",
    "instructions": "Share the total equally between two penguins. How much does each get?",
    "image": "/brain-games/speed-rush/penguin-halves.webp"
  },
  {
    "id": "speed-06",
    "slug": "cloud-count",
    "title": "Cloud Count",
    "description": "Count the little stars hiding in the clouds.",
    "category": "Spot & tap",
    "emoji": "☁️",
    "instructions": "Count every star, then tap the matching number.",
    "image": "/brain-games/speed-rush/cloud-count.webp"
  },
  {
    "id": "speed-07",
    "slug": "balloon-order",
    "title": "Balloon Order",
    "description": "Send your balloons up from smallest to biggest.",
    "category": "Number trails",
    "emoji": "🎈",
    "instructions": "Tap every balloon in order, from the smallest number to the largest.",
    "image": "/brain-games/speed-rush/balloon-order.webp"
  },
  {
    "id": "speed-08",
    "slug": "comet-countdown",
    "title": "Comet Countdown",
    "description": "Guide your comet from big numbers down to small.",
    "category": "Number trails",
    "emoji": "☄️",
    "instructions": "Tap every planet in order, from the largest number to the smallest.",
    "image": "/brain-games/speed-rush/comet-countdown.webp"
  },
  {
    "id": "speed-09",
    "slug": "frog-skip",
    "title": "Frog Skip",
    "description": "Hop along lily pads in twos, fives, and tens.",
    "category": "Number trails",
    "emoji": "🐸",
    "instructions": "Start with the first number shown. Tap the lily pads in skip-counting order.",
    "image": "/brain-games/speed-rush/frog-skip.webp"
  },
  {
    "id": "speed-10",
    "slug": "train-tens",
    "title": "Train Tens",
    "description": "Load tens and ones to build a number train.",
    "category": "Quick maths",
    "emoji": "🚂",
    "instructions": "Each bundle is ten. Count the bundles and single cubes to find the number.",
    "image": "/brain-games/speed-rush/train-tens.webp"
  },
  {
    "id": "speed-11",
    "slug": "robot-compare",
    "title": "Robot Compare",
    "description": "Help your robot choose the greater number.",
    "category": "Spot & tap",
    "emoji": "🤖",
    "instructions": "Compare the number robots. Tap the one with the greatest value.",
    "image": "/brain-games/speed-rush/robot-compare.webp"
  },
  {
    "id": "speed-12",
    "slug": "treasure-odd",
    "title": "Odd Treasure",
    "description": "Find every odd-numbered coin in the chest.",
    "category": "Spot & tap",
    "emoji": "🏴‍☠️",
    "instructions": "Tap all the odd numbers: numbers that cannot be shared into two equal whole-number groups.",
    "image": "/brain-games/speed-rush/treasure-odd.webp"
  },
  {
    "id": "speed-13",
    "slug": "bee-even",
    "title": "Even Bees",
    "description": "Collect every even-numbered drop of honey.",
    "category": "Spot & tap",
    "emoji": "🐝",
    "instructions": "Tap all the even numbers: 2, 4, 6, 8 and their friends.",
    "image": "/brain-games/speed-rush/bee-even.webp"
  },
  {
    "id": "speed-14",
    "slug": "colour-dash",
    "title": "Colour Dash",
    "description": "Catch the colour your chameleon is looking for.",
    "category": "Spot & tap",
    "emoji": "🦎",
    "instructions": "Read the target colour and tap every matching paint drop.",
    "image": "/brain-games/speed-rush/colour-dash.webp"
  },
  {
    "id": "speed-15",
    "slug": "shape-safari",
    "title": "Shape Safari",
    "description": "Spot shapes on a friendly jungle safari.",
    "category": "Spot & tap",
    "emoji": "🦁",
    "instructions": "Find every shape named in the instruction.",
    "image": "/brain-games/speed-rush/shape-safari.webp"
  },
  {
    "id": "speed-16",
    "slug": "star-twins",
    "title": "Star Twins",
    "description": "Turn over cards and reunite matching stars.",
    "category": "Memory beats",
    "emoji": "🌟",
    "instructions": "Turn over two cards at a time. Find all matching pairs.",
    "image": "/brain-games/speed-rush/star-twins.webp"
  },
  {
    "id": "speed-17",
    "slug": "fruit-memory",
    "title": "Fruit Memory",
    "description": "Remember where the fruit pairs are hiding.",
    "category": "Memory beats",
    "emoji": "🍓",
    "instructions": "Peek at two fruit cards. Match all pairs to fill your basket.",
    "image": "/brain-games/speed-rush/fruit-memory.webp"
  },
  {
    "id": "speed-18",
    "slug": "drum-beats",
    "title": "Drum Beats",
    "description": "Watch the drums light up, then copy the beat.",
    "category": "Memory beats",
    "emoji": "🥁",
    "instructions": "Watch the highlighted drums. When they stop, tap them in the same order.",
    "image": "/brain-games/speed-rush/drum-beats.webp"
  },
  {
    "id": "speed-19",
    "slug": "firefly-flash",
    "title": "Firefly Flash",
    "description": "Watch a firefly trail and light it up again.",
    "category": "Memory beats",
    "emoji": "✨",
    "instructions": "Remember the flashing lanterns, then tap the same sequence.",
    "image": "/brain-games/speed-rush/firefly-flash.webp"
  },
  {
    "id": "speed-20",
    "slug": "pattern-pop",
    "title": "Pattern Pop",
    "description": "Pop the shape that comes next in the pattern.",
    "category": "Number trails",
    "emoji": "🦕",
    "instructions": "Look for the repeating shapes. Choose the next one.",
    "image": "/brain-games/speed-rush/pattern-pop.webp"
  },
  {
    "id": "speed-21",
    "slug": "missing-carriage",
    "title": "Missing Carriage",
    "description": "Find the missing number in your train.",
    "category": "Number trails",
    "emoji": "🚃",
    "instructions": "Find the counting step, then fill the empty carriage.",
    "image": "/brain-games/speed-rush/missing-carriage.webp"
  },
  {
    "id": "speed-22",
    "slug": "rainbow-sort",
    "title": "Rainbow Sort",
    "description": "Sort colourful toys into their matching baskets.",
    "category": "Build & sort",
    "emoji": "🌈",
    "instructions": "Tap a toy, then tap the basket with the same colour. You can also drag it.",
    "image": "/brain-games/speed-rush/rainbow-sort.webp"
  },
  {
    "id": "speed-23",
    "slug": "coin-catcher",
    "title": "Coin Catcher",
    "description": "Choose coins to make the exact target total.",
    "category": "Build & sort",
    "emoji": "🪙",
    "instructions": "Tap any coins that add up to the target. Tap a coin again to remove it.",
    "image": "/brain-games/speed-rush/coin-catcher.webp"
  },
  {
    "id": "speed-24",
    "slug": "clock-sprint",
    "title": "Clock Sprint",
    "description": "Read the hands on a colourful clock.",
    "category": "Quick maths",
    "emoji": "🕒",
    "instructions": "The short hand shows the hour. The long hand shows the minutes. Tap the matching time.",
    "image": "/brain-games/speed-rush/clock-sprint.webp"
  },
  {
    "id": "speed-25",
    "slug": "fraction-feast",
    "title": "Fraction Feast",
    "description": "Discover the fraction of a tasty pizza slice.",
    "category": "Quick maths",
    "emoji": "🐼",
    "instructions": "Count the coloured pieces and all equal pieces. Tap the matching fraction.",
    "image": "/brain-games/speed-rush/fraction-feast.webp"
  },
  {
    "id": "speed-26",
    "slug": "monster-measure",
    "title": "Monster Measure",
    "description": "Find the tallest or shortest friendly monster.",
    "category": "Spot & tap",
    "emoji": "👾",
    "instructions": "Compare the monster heights and tap the one named in the instruction.",
    "image": "/brain-games/speed-rush/monster-measure.webp"
  },
  {
    "id": "speed-27",
    "slug": "domino-dash",
    "title": "Domino Dash",
    "description": "Count the dots on your speedy domino.",
    "category": "Quick maths",
    "emoji": "🎲",
    "instructions": "Count the dots on both sides of the domino. Tap their total.",
    "image": "/brain-games/speed-rush/domino-dash.webp"
  },
  {
    "id": "speed-28",
    "slug": "bridge-builder",
    "title": "Bridge Builder",
    "description": "Choose two blocks to complete the bridge total.",
    "category": "Build & sort",
    "emoji": "🦫",
    "instructions": "Tap two numbered bridge blocks that add up to the target.",
    "image": "/brain-games/speed-rush/bridge-builder.webp"
  },
  {
    "id": "speed-29",
    "slug": "arrow-adventure",
    "title": "Arrow Adventure",
    "description": "Steer your turtle around rocks to the flag.",
    "category": "Number trails",
    "emoji": "🐢",
    "instructions": "Use the arrow buttons or keyboard arrow keys. Avoid the rocks and reach the flag.",
    "image": "/brain-games/speed-rush/arrow-adventure.webp"
  },
  {
    "id": "speed-30",
    "slug": "meteor-mix",
    "title": "Meteor Mix",
    "description": "Finish a cosmic mix of quick number challenges.",
    "category": "Quick maths",
    "emoji": "🧑‍🚀",
    "instructions": "Follow the changing mission: addition, subtraction, or doubling.",
    "image": "/brain-games/speed-rush/meteor-mix.webp"
  }
];
export const SPEED_CATEGORIES: SpeedCategory[] = ["Quick maths","Spot & tap","Number trails","Memory beats","Build & sort"];
export const speedGameById = (id: string) => SPEED_GAMES.find(game => game.id === id);

