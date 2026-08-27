"use client";

import { useEffect, useState } from "react";

const MEMORY_SYMBOLS = ["✦", "◆", "❖", "✧", "✺", "◈"] as const;
const INITIAL_ORDER = [0, 3, 1, 4, 2, 5, 0, 4, 5, 2, 3, 1] as const;

type MemoryCard = {
  id: number;
  pair: number;
  symbol: string;
};

function buildDeck(randomize: boolean): MemoryCard[] {
  const order = randomize
    ? [...MEMORY_SYMBOLS.keys(), ...MEMORY_SYMBOLS.keys()].sort(() => Math.random() - 0.5)
    : [...INITIAL_ORDER];

  return order.map((pair, id) => ({ id, pair, symbol: MEMORY_SYMBOLS[pair] }));
}

function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>(() => buildDeck(false));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const reset = () => {
    setCards(buildDeck(true));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setLocked(false);
  };

  const flip = (card: MemoryCard) => {
    if (locked || flipped.includes(card.id) || matched.includes(card.pair)) return;

    const next = [...flipped, card.id];
    setFlipped(next);

    if (next.length !== 2) return;

    setMoves((value) => value + 1);
    setLocked(true);

    const first = cards.find((item) => item.id === next[0]);
    const second = cards.find((item) => item.id === next[1]);
    const isMatch = first?.pair === second?.pair;

    window.setTimeout(() => {
      if (isMatch && first) {
        setMatched((current) => (current.includes(first.pair) ? current : [...current, first.pair]));
      }
      setFlipped([]);
      setLocked(false);
    }, isMatch ? 420 : 760);
  };

  const complete = matched.length === MEMORY_SYMBOLS.length;

  return (
    <article className="maintenance-game-card">
      <header className="maintenance-game-card__header">
        <div>
          <span className="maintenance-game-card__number">Jeu 01</span>
          <h3>Mémoire des cristaux</h3>
        </div>
        <span className="maintenance-score">{moves} coup{moves > 1 ? "s" : ""}</span>
      </header>
      <p>Retrouvez les six paires de symboles avec le moins de coups possible.</p>

      <div className="memory-board" role="group" aria-label="Jeu de mémoire">
        {cards.map((card) => {
          const revealed = flipped.includes(card.id) || matched.includes(card.pair);
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card${revealed ? " memory-card--revealed" : ""}${matched.includes(card.pair) ? " memory-card--matched" : ""}`}
              onClick={() => flip(card)}
              disabled={matched.includes(card.pair)}
              aria-label={revealed ? `Carte ${card.symbol}` : "Carte cachée"}
            >
              <span className="memory-card__back" aria-hidden="true">◇</span>
              <span className="memory-card__face" aria-hidden="true">{card.symbol}</span>
            </button>
          );
        })}
      </div>

      <div className="maintenance-game-card__footer">
        <span className={complete ? "maintenance-game-result maintenance-game-result--success" : "maintenance-game-result"}>
          {complete ? `Terminé en ${moves} coups — joli !` : `${matched.length} / ${MEMORY_SYMBOLS.length} paires trouvées`}
        </span>
        <button type="button" className="maintenance-mini-button" onClick={reset}>Rejouer</button>
      </div>
    </article>
  );
}

function randomPosition() {
  return {
    x: 8 + Math.random() * 84,
    y: 12 + Math.random() * 76,
  };
}

function LightCatchGame() {
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const saved = window.localStorage.getItem("imetheran-maintenance-light-best");
    if (saved) setBest(Number(saved) || 0);
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running || timeLeft !== 0 || score <= best) return;
    setBest(score);
    window.localStorage.setItem("imetheran-maintenance-light-best", String(score));
  }, [running, timeLeft, score, best]);

  const start = () => {
    setScore(0);
    setTimeLeft(20);
    setPosition(randomPosition());
    setRunning(true);
  };

  const catchLight = () => {
    if (!running) return;
    setScore((current) => current + 1);
    setPosition(randomPosition());
  };

  return (
    <article className="maintenance-game-card">
      <header className="maintenance-game-card__header">
        <div>
          <span className="maintenance-game-card__number">Jeu 02</span>
          <h3>La chasse aux lueurs</h3>
        </div>
        <span className="maintenance-score">{timeLeft}s · {score} pts</span>
      </header>
      <p>Une lueur, vingt secondes. Attrapez-la autant de fois que possible.</p>

      <div className={`light-board${running ? " light-board--running" : ""}`}>
        {running ? (
          <button
            type="button"
            className="light-orb"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            onClick={catchLight}
            aria-label="Attraper la lueur"
          >
            <span aria-hidden="true">✦</span>
          </button>
        ) : (
          <div className="light-board__idle">
            <span aria-hidden="true">✦</span>
            <strong>{timeLeft === 0 ? `${score} points` : "Prêt ?"}</strong>
            <small>Meilleur score sur cet appareil : {best}</small>
          </div>
        )}
      </div>

      <div className="maintenance-game-card__footer">
        <span className="maintenance-game-result">
          {running ? "Cliquez vite avant la fin du temps." : timeLeft === 0 ? "Vous pouvez tenter de battre votre score." : "Le chrono démarre au premier lancement."}
        </span>
        <button type="button" className="maintenance-mini-button" onClick={start} disabled={running}>
          {timeLeft === 0 ? "Rejouer" : "Démarrer"}
        </button>
      </div>
    </article>
  );
}

export function MaintenanceGames() {
  return (
    <div className="maintenance-games__grid">
      <MemoryGame />
      <LightCatchGame />
    </div>
  );
}
