export interface GameFAQ {
  question: string;
  answer: string;
}

export const gameFaqs: Record<string, GameFAQ[]> = {
  "neon-pacman": [
    {
      question: "How do I play Pac-Man?",
      answer:
        "Use the arrow keys or WASD to navigate Pac-Man through the maze. Eat all the dots to complete each level. Avoid the ghosts unless you have eaten a power pellet, which lets you eat them for bonus points.",
    },
    {
      question: "Is Pac-Man free to play?",
      answer:
        "Yes. Pac-Man on GameVault is completely free to play in your browser. No download or account required.",
    },
    {
      question: "Can I play Pac-Man with friends?",
      answer:
        "Pac-Man supports 1-2 players with solo, co-op, and versus modes. Invite a friend to play together on the same device.",
    },
    {
      question: "What are the ghost behaviors in Pac-Man?",
      answer:
        "Each ghost has a unique personality. Blinky (red) chases you directly. Pinky (pink) tries to ambush by targeting a position ahead of you. Inky (cyan) uses a combination of Blinky's position and yours. Clyde (orange) alternates between chasing and wandering.",
    },
  ],
  "connect-four": [
    {
      question: "How do I play Connect Four?",
      answer:
        "Click on a column to drop your disc. The goal is to connect four of your discs in a row horizontally, vertically, or diagonally before your opponent does.",
    },
    {
      question: "Is Connect Four free to play?",
      answer:
        "Yes. Connect Four on GameVault is completely free to play in your browser. No download or account required.",
    },
    {
      question: "Can I play Connect Four with friends?",
      answer:
        "Connect Four supports 1-2 players. You can play solo against the AI or challenge a friend in versus mode on the same device.",
    },
    {
      question: "How does the AI work in Connect Four?",
      answer:
        "The AI opponent evaluates possible moves using a look-ahead strategy. It considers offensive opportunities to connect four while also blocking your winning moves.",
    },
  ],
  chess: [
    {
      question: "How do I play Chess on GameVault?",
      answer:
        "Click a piece to select it, then click a highlighted square to move. The game enforces all standard chess rules including castling, en passant, and pawn promotion.",
    },
    {
      question: "Is Chess free to play?",
      answer:
        "Yes. Chess on GameVault is completely free to play in your browser. No download or account required.",
    },
    {
      question: "Can I play Chess with friends?",
      answer:
        "Chess supports 1-2 players. Play solo against the AI or challenge a friend in versus mode on the same device.",
    },
    {
      question: "What difficulty levels does the Chess AI have?",
      answer:
        "The AI provides a challenging opponent that evaluates positions and plans ahead. It plays at an intermediate level suitable for casual and developing players.",
    },
  ],
};
