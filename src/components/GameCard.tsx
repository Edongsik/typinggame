import { FC, RefObject } from "react";
import type { PracticeWord } from "../lib/csv";

type GameCardProps = {
  currentWord: PracticeWord | null;
  typedValue: string;
  isRunning: boolean;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPlayAudio: () => void;
  inputRef: RefObject<HTMLInputElement>;
  wordContainerRef: RefObject<HTMLHeadingElement>;
};

const GameCard: FC<GameCardProps> = ({
  currentWord,
  typedValue,
  isRunning,
  onInputChange,
  onKeyDown,
  onPlayAudio,
  inputRef,
  wordContainerRef,
}) => {
  // 글자 색상 변경을 위한 렌더링 함수
  const renderWord = () => {
    if (!currentWord) return null;

   // console.log("현재 단어 데이터:", currentWord);

    return currentWord.word.split("").map((char, index) => {
      let className = "char-neutral";
      if (index < typedValue.length) {
        className = typedValue[index] === char ? "char-correct" : "char-incorrect";
      }
      return (
        <span key={`${currentWord.word}-${index}`} className={className}>
          {char}
        </span>
      );
    });
  };

  if (!currentWord) {
    return (
      <div className="game-card" style={{ justifyContent: 'center' }}>
        단어를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="game-card">
      <div className="game-card__meaning">{currentWord.meaning}</div>
      <div className="game-card__word-display">
        <h2 className="game-card__word" ref={wordContainerRef}>
          {renderWord()}
        </h2>
        <button
          className="game-card__audio-btn"
          onClick={onPlayAudio}
          title="단어 발음 듣기"
        >
          🔊
        </button>
      </div>
      <div className="game-card__pronunciation">/{currentWord.pronunciation}/</div>
      <div className="game-card__syllables">{currentWord.syllables}</div>
      
      {/* --- 품사(pos) 배지 렌더링 부분 --- */}
      {currentWord.partOfSpeech && (
        <div className="game-card__pos-badge">{currentWord.partOfSpeech}</div>
      )}

      <div className="game-card__example">
        {currentWord.example}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="game-card__input"
        placeholder="여기에 단어를 입력하세요..."
        value={typedValue}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        disabled={!isRunning}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  );
};

export default GameCard;