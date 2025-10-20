import type { FC, RefObject } from "react";

// Word 타입 확장 (sentence 필드 추가)
type WordWithSentence = {
  word: string;
  meaning: string;
  pronunciation: string;
  syllables: string;
  partOfSpeech: string;
  example: string;
  sentence?: string;
};

type GameCardProps = {
  currentWord: WordWithSentence | null;
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

    return currentWord.word.split("").map((char: string, index: number) => {
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

  // sentence 필드에서 빈칸 위치 찾기
  const createSentenceWithBlank = () => {
    const sentence = currentWord.sentence || "";
    
    if (!sentence) {
      if (!currentWord.example) {
        return { beforeBlank: "", afterBlank: "" };
      }
      
      const example = currentWord.example.replace(/\\r\\n/g, ' ').trim();
      const wordPattern = new RegExp(`\\b${currentWord.word}\\b`, 'i');
      const match = wordPattern.exec(example);
      
      if (match) {
        const beforeBlank = example.slice(0, match.index);
        const afterBlank = example.slice(match.index + match[0].length);
        return { beforeBlank, afterBlank };
      }
      
      return { beforeBlank: "", afterBlank: "" };
    }
    
    const parts = sentence.split('____');
    if (parts.length === 2) {
      return { beforeBlank: parts[0], afterBlank: parts[1] };
    }
    
    const blankPattern = /__+/;
    const match = sentence.match(blankPattern);
    
    if (match && match.index !== undefined) {
      const beforeBlank = sentence.slice(0, match.index);
      const afterBlank = sentence.slice(match.index + match[0].length);
      return { beforeBlank, afterBlank };
    }
    
    return { beforeBlank: sentence, afterBlank: "" };
  };

  const { beforeBlank, afterBlank } = createSentenceWithBlank();

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
      
      {currentWord.partOfSpeech && (
        <div className="game-card__pos-badge">{currentWord.partOfSpeech}</div>
      )}

      <div className="game-card__example">
        {currentWord.example.replace(/\\r\\n/g, '\n')}
      </div>

      <div style={{
        background: '#2c3e50',
        color: '#ecf0f1',
        padding: '1.5rem',
        borderRadius: '8px',
        fontSize: '1.3rem',
        lineHeight: '1.8',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: '0',
        marginTop: '1rem'
      }}>
        <span>{beforeBlank}</span>
        <span style={{
          display: 'inline-block',
          position: 'relative',
          margin: '0 0.25rem'
        }}>
          <input
            ref={inputRef}
            type="text"
            placeholder=""
            value={typedValue}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={!isRunning}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            style={{
              display: 'inline-block',
              width: `${Math.max(4, currentWord.word.length + 1)}ch`,
              textAlign: 'center',
              border: 'none',
              background: '#34495e',
              backgroundColor: '#34495e',
              color: '#ecf0f1',
              fontSize: 'inherit',
              padding: '0',
              margin: '0',
              outline: 'none',
              fontFamily: 'inherit',
              borderBottom: '2px solid #7f8c8d',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: 'none'
            }}
          />
        </span>
        <span>{afterBlank}</span>
      </div>
    </div>
  );
};

export default GameCard;