import { FC, useState, useEffect } from "react"
import type { PracticeWord } from "../lib/csv"
import type { DayMeta } from "../types"
import { isWordCompleted, toggleWordCompleted, getCompletedWords } from "../lib/completedWords"
import { loadDays } from "../lib/csv"
import { setPendingTarget } from "../lib/pendingTarget"
import { useSpeech } from "../hooks/useSpeech"

type WordListPageProps = {
  // 헤더 타입
  headerType: "standalone" | "game"
  
  // standalone 모드 전용
  days?: DayMeta[]
  initialDayId?: string
  onBackToWordbook?: () => void
  
  // game 모드 전용 (기존)
  words?: PracticeWord[]
  currentIndex?: number
  dayLabel?: string
  dayId?: string
  onBack?: () => void
  
  // 공통
  onJumpTo: (index: number) => void
  onEdit: (word: any) => void
  onStartGameAtWord?: (dayId: string, wordIndex: number) => void
}

const WordListPage: FC<WordListPageProps> = (props) => {
  const { headerType } = props
  const { speak } = useSpeech()
  
  // standalone 모드 상태
  const [selectedDayId, setSelectedDayId] = useState<string>(
    props.initialDayId || props.days?.[0]?.id || ""
  )
  const [standaloneWords, setStandaloneWords] = useState<PracticeWord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // 공통 상태
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<PracticeWord>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [showCompletedList, setShowCompletedList] = useState(false)
  const [completedWords, setCompletedWords] = useState<string[]>([])
  
  // 현재 사용할 데이터 결정
  const words = headerType === "standalone" ? standaloneWords : (props.words || [])
  const dayId = headerType === "standalone" ? selectedDayId : (props.dayId || "")
  const currentIndex = headerType === "standalone" ? 0 : (props.currentIndex || 0)
  const selectedDay = headerType === "standalone" 
    ? props.days?.find(d => d.id === selectedDayId) 
    : null
  const dayLabel = headerType === "standalone" 
    ? selectedDay?.label || "" 
    : (props.dayLabel || "")
  
  // standalone 모드: Day 변경시 단어 로드
  useEffect(() => {
    if (headerType !== "standalone" || !selectedDayId) return

    const loadWords = async () => {
      setIsLoading(true)
      try {
        const loaded = await loadDays([selectedDayId], 'sequence')
        setStandaloneWords(loaded)
      } catch (error) {
        console.error('단어 로드 실패:', error)
        setStandaloneWords([])
      } finally {
        setIsLoading(false)
      }
    }

    loadWords()
  }, [selectedDayId, headerType])
  
  // 완료된 단어 로드
  useEffect(() => {
    if (dayId) {
      setCompletedWords(getCompletedWords(dayId))
    }
  }, [dayId])
  
  const handleToggleCompleted = (word: string) => {
    const newState = toggleWordCompleted(dayId, word)
    setCompletedWords(getCompletedWords(dayId))
    
    if (newState) {
      console.log(`Marked "${word}" as completed`)
    } else {
      console.log(`Unmarked "${word}" as completed`)
    }
  }

  const startEdit = (index: number, word: PracticeWord) => {
    setEditingIndex(index)
    setEditForm({
      word: word.word,
      meaning: word.meaning,
      pronunciation: word.pronunciation,
      syllables: word.syllables,
      partOfSpeech: word.partOfSpeech,
      example: word.example,
    })
  }

  const saveEdit = (index: number) => {
    const wordToEdit = words[index]
    props.onEdit({ ...wordToEdit, ...editForm })
    setEditingIndex(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditForm({})
  }

  const handleJumpClick = (index: number) => {
    if (headerType === "standalone" && props.onStartGameAtWord) {
      // 전체 단어장 모드: 해당 단어로 게임 시작
      const target = words[index]
      if (target) {
        setPendingTarget(dayId, target.word)
      }
      props.onStartGameAtWord(dayId, index)
    } else {
      // 게임 중 모드: 해당 단어로 이동하고 게임으로 돌아가기
      props.onJumpTo(index)
      props.onBack?.()
    }
  }

  const searchFiltered = words.filter((word) =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredWords = showCompletedList
    ? searchFiltered.filter(w => completedWords.includes(w.word))
    : searchFiltered.filter(w => !completedWords.includes(w.word))

  return (
    <div style={styles.container}>
      {/* standalone 모드: 상단 고정 헤더 */}
      {headerType === "standalone" && (
        <div style={styles.header}>
          <button onClick={props.onBackToWordbook} style={styles.backButton}>
            ← DAY 페이지로
          </button>

          <h1 style={styles.title}>암기장</h1>

          {/* Day 선택 드롭다운 */}
          <div style={styles.dropdownContainer}>
            <button
              style={styles.dropdownButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedDay?.label || 'Day 선택'} ▼
            </button>

            {isDropdownOpen && (
              <div style={styles.dropdownMenu}>
                {props.days?.map((day) => (
                  <button
                    key={day.id}
                    style={{
                      ...styles.dropdownItem,
                      ...(day.id === selectedDayId ? styles.dropdownItemActive : {})
                    }}
                    onClick={() => {
                      setSelectedDayId(day.id)
                      setIsDropdownOpen(false)
                    }}
                  >
                    {day.label} - 전체단어
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <div style={headerType === "standalone" ? styles.content : styles.contentGame}>
        {isLoading ? (
          <div style={styles.loading}>단어 암기장 목록 검색중..</div>
        ) : (
          <div style={styles.wordListContainer}>
            {/* game 모드: 헤더 */}
            {headerType === "game" && (
              <div style={{ marginBottom: "2rem" }}>
                <button onClick={props.onBack} className="back-to-list-button">
                  ← 연습으로
                </button>
                <h2 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#1f2937" }}>
                  {dayLabel} - 전체 단어 목록
                </h2>
                <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                  총 {words.length}개의 단어 | 현재 {currentIndex + 1}번째 단어 | 
                  암기 완료 {completedWords.length}개
                </p>
              </div>
            )}

            {/* standalone 모드: 간단한 정보 */}
            {headerType === "standalone" && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                  총 {words.length}개의 단어 | 암기 완료 {completedWords.length}개
                </p>
              </div>
            )}

            {/* 검색 영역 */}
            <div style={styles.searchBox}>
              <input
                type="text"
                placeholder="단어 또는 뜻 검색.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.9rem" }}>
                  {filteredWords.length}개의 결과
                </p>
              )}

              {/* 리스트 보기 전환 */}
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowCompletedList(false)}
                  style={{ ...styles.button, ...(showCompletedList ? styles.buttonGray : styles.buttonPrimary) }}
                >
                  학습 목록
                </button>
                <button
                  onClick={() => setShowCompletedList(true)}
                  style={{ ...styles.button, ...(showCompletedList ? styles.buttonPrimary : styles.buttonGray) }}
                >
                  암기 완료
                </button>
              </div>
            </div>

            {/* 단어 목록 */}
            <div style={styles.wordList}>
              {filteredWords.map((word, idx) => {
                const originalIndex = words.indexOf(word)
                const isEditing = editingIndex === originalIndex
                const isCurrent = headerType === "game" && originalIndex === currentIndex
                const isCompleted = completedWords.includes(word.word)

                return (
                  <div
                    key={originalIndex}
                    style={{
                      ...styles.wordCard,
                      ...(isCurrent ? styles.wordCardCurrent : {})
                    }}
                  >
                    <div style={styles.wordCardHeader}>
                      <div style={styles.wordCardLeft}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggleCompleted(word.word)}
                          style={styles.checkbox}
                        />
                        <span style={styles.wordNumber}>#{originalIndex + 1}</span>
                        <h3 style={styles.wordText}>{word.word}</h3>
                        <button
                          type="button"
                          onClick={() => speak(word.word)}
                          title="발음 재생"
                          aria-label={`발음 재생: ${word.word}`}
                          style={styles.iconButton}
                        >
                          🔊
                        </button>
                        {isCurrent && <span style={styles.badgeCurrent}>현재 단어</span>}
                        {isCompleted && <span style={styles.badgeCompleted}>암기 완료</span>}
                      </div>

                      <div style={styles.actionButtons}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(originalIndex)}
                              style={{ ...styles.button, ...styles.buttonSuccess }}
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{ ...styles.button, ...styles.buttonGray }}
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleJumpClick(originalIndex)}
                              style={{ ...styles.button, ...styles.buttonPrimary }}
                            >
                              연습
                            </button>
                            <button
                              onClick={() => startEdit(originalIndex, word)}
                              style={{ ...styles.button, ...styles.buttonWarning }}
                            >
                              편집
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={styles.wordDetails}>
                      {isEditing ? (
                        <>
                          <div>
                            <strong>의미:</strong>
                            <input
                              type="text"
                              value={editForm.meaning ?? word.meaning}
                              onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                              style={styles.editInput}
                            />
                          </div>
                          <div>
                            <strong>발음:</strong>
                            <input
                              type="text"
                              value={editForm.pronunciation ?? word.pronunciation}
                              onChange={(e) => setEditForm({ ...editForm, pronunciation: e.target.value })}
                              style={styles.editInput}
                            />
                          </div>
                          <div>
                            <strong>음절:</strong>
                            <input
                              type="text"
                              value={editForm.syllables ?? word.syllables}
                              onChange={(e) => setEditForm({ ...editForm, syllables: e.target.value })}
                              style={styles.editInput}
                            />
                          </div>
                          <div>
                            <strong>품사:</strong>
                            <input
                              type="text"
                              value={editForm.partOfSpeech ?? word.partOfSpeech}
                              onChange={(e) => setEditForm({ ...editForm, partOfSpeech: e.target.value })}
                              style={styles.editInput}
                            />
                          </div>
                          <div>
                            <strong>예문:</strong>
                            <textarea
                              value={editForm.example ?? word.example}
                              onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                              style={styles.editTextarea}
                              rows={3}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div><strong>의미:</strong> {word.meaning}</div>
                          {word.pronunciation && <div><strong>발음:</strong> {word.pronunciation}</div>}
                          {word.syllables && <div><strong>음절:</strong> {word.syllables}</div>}
                          {word.partOfSpeech && <div><strong>품사:</strong> {word.partOfSpeech}</div>}
                          {word.example && <div><strong>예문:</strong> {word.example}</div>}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 매우 중요: styles 객체를 컴포넌트 밖에서 정의 (React.CSSProperties 타입 사용)
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f9fafb'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem 2rem',
    backgroundColor: 'white',
    borderBottom: '2px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#3b82f6',
    cursor: 'pointer',
    padding: '8px 0',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1f2937',
    flexShrink: 0
  },
  dropdownContainer: {
    position: 'relative',
    minWidth: '200px',
    flexShrink: 0
  },
  dropdownButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 200
  },
  dropdownItem: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'white',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'background 0.2s',
    borderBottom: '1px solid #f3f4f6'
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    overflowY: 'auto'
  },
  contentGame: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem',
    width: '100%'
  },
  wordListContainer: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '16px'
  },
  searchBox: {
    background: '#f9fafb',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    border: '1px solid #e5e7eb'
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none'
  },
  wordList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  wordCard: {
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  wordCardCurrent: {
    background: '#eff6ff',
    borderColor: '#3b82f6'
  },
  wordCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f3f4f6'
  },
  wordCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  wordNumber: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  wordText: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937'
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    marginLeft: '8px',
    lineHeight: 1,
  },
  badgeCurrent: {
    background: '#3b82f6',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px'
  },
  badgeCompleted: {
    background: '#22c55e',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px'
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem'
  },
  button: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: 'white'
  },
  buttonPrimary: {
    background: '#3b82f6'
  },
  buttonWarning: {
    background: '#f59e0b'
  },
  buttonSuccess: {
    background: '#10b981'
  },
  buttonGray: {
    background: '#6b7280'
  },
  wordDetails: {
    display: 'grid',
    gap: '0.75rem',
    fontSize: '0.95rem',
    color: '#4b5563'
  },
  editInput: {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px'
  },
  editTextarea: {
    width: '100%',
    padding: '0.5rem',
    marginTop: '0.25rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical'
  }
}

export default WordListPage