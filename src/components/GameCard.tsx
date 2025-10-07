import { FC, RefObject, useEffect } from "react"
import type { PracticeWord } from "../lib/csv"

type GameCardProps = {
  currentWord: PracticeWord | null
  typedValue: string
  isRunning: boolean
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onPlayAudio: () => void
  inputRef: RefObject<HTMLInputElement>
  wordContainerRef: RefObject<HTMLHeadingElement>
}

const GameCard: FC<GameCardProps> = ({
  currentWord,
  typedValue,
  isRunning,
  onInputChange,
  onKeyDown,
  onPlayAudio,
  inputRef,
  wordContainerRef
}) => {
  // 단어 길이에 따른 폰트 크기 자동 조절
  useEffect(() => {
    const container = wordContainerRef.current
    if (!container) return

    container.style.fontSize = ''

    const containerWidth = container.clientWidth
    const scrollWidth = container.scrollWidth

    if (scrollWidth > containerWidth) {
      const currentFontSize = parseFloat(getComputedStyle(container).fontSize)
      const newFontSize = (currentFontSize * containerWidth / scrollWidth) * 0.95
      container.style.fontSize = `${newFontSize}px`
    }
  }, [currentWord, wordContainerRef])

  return (
    <div className="game__card">
      <div className="game__word">
        <p className="game__meaning">{currentWord?.meaning ?? "뜻"}</p>
        
        <div className="game__target-word-display">
          <h2 ref={wordContainerRef} className="game__target-word--static">
            {currentWord?.word.split('').map((char, index) => {
              let className = 'char-neutral'
              if (index < typedValue.length) {
                className = typedValue[index] === char ? 'char-correct' : 'char-incorrect'
              }
              return (
                <span key={index} className={className}>
                  {char}
                </span>
              )
            })}
          </h2>
          <button
            type="button"
            className="game__audio-button"
            onClick={onPlayAudio}
            disabled={!currentWord}
          >
            🔊<span className="sr-only">발음 듣기</span>
          </button>
        </div>

        <div className="game__pronunciation">
          {currentWord?.pronunciation && `[${currentWord.pronunciation}]`}
        </div>
        <div className="game__syllables">
          {currentWord?.syllables}
        </div>

        {currentWord?.partOfSpeech && (
          <span className="game__pos-badge">{currentWord.partOfSpeech}</span>
        )}
        
        <div className="game__example-box">
          <p className="game__example">{currentWord?.example ?? "-"}</p>
        </div>
        
        <input
          ref={inputRef}
          className="game__input"
          type="text"
          value={typedValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={!isRunning}
          placeholder={isRunning ? "여기에 단어를 입력하세요..." : "단어를 불러오는 중입니다"}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </div>
    </div>
  )
}

export default GameCard