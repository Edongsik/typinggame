import { FC, useState, useEffect } from "react"
import type { PracticeWord } from "../lib/csv"
import { isWordCompleted, toggleWordCompleted, getCompletedWords } from "../lib/completedWords"

type WordListPageProps = {
  words: PracticeWord[]
  currentIndex: number
  dayLabel: string
  dayId: string  // 추가: Day ID 필요
  onBack: () => void
  onJumpTo: (index: number) => void
  onEdit: (index: number, updatedWord: Partial<PracticeWord>) => void
}

const WordListPage: FC<WordListPageProps> = ({
  words,
  currentIndex,
  dayLabel,
  dayId,  // 추가
  onBack,
  onJumpTo,
  onEdit,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<PracticeWord>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [completedWords, setCompletedWords] = useState<string[]>([])
  
  // 완료된 단어 목록 로드
  useEffect(() => {
    setCompletedWords(getCompletedWords(dayId))
  }, [dayId])
  
  // 체크박스 토글
  const handleToggleCompleted = (word: string) => {
    const newState = toggleWordCompleted(dayId, word)
    setCompletedWords(getCompletedWords(dayId))
    
    if (newState) {
      console.log(`✅ "${word}" 학습 완료 처리됨`)
    } else {
      console.log(`❌ "${word}" 학습 완료 취소됨`)
    }
  }

  const startEdit = (index: number, word: PracticeWord) => {
    setEditingIndex(index)
    setEditForm({
      meaning: word.meaning,
      pronunciation: word.pronunciation,
      syllables: word.syllables,
      partOfSpeech: word.partOfSpeech,
      example: word.example,
    })
  }

  const saveEdit = (index: number) => {
    onEdit(index, editForm)
    setEditingIndex(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditForm({})
  }

  const handleJumpAndBack = (index: number) => {
    onJumpTo(index)
    onBack()
  }

  const filteredWords = words.filter((word) =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={onBack} className="back-to-list-button">
          ← 게임으로 돌아가기
        </button>
        <h2 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "#1f2937" }}>
          {dayLabel} - 전체 단어 목록
        </h2>
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
          총 {words.length}개의 단어 | 현재 {currentIndex + 1}번째 단어 | 
          학습 완료 {completedWords.length}개
        </p>
      </div>

      {/* 검색 영역 */}
      <div style={{
        background: "#f9fafb",
        padding: "1.5rem",
        borderRadius: "12px",
        marginBottom: "2rem",
        border: "1px solid #e5e7eb"
      }}>
        <input
          type="text"
          placeholder="단어 또는 뜻 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            border: "2px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "1rem",
            outline: "none"
          }}
          onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
          onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
        />
        {searchQuery && (
          <p style={{ marginTop: "0.75rem", color: "#6b7280", fontSize: "0.9rem" }}>
            검색 결과: {filteredWords.length}개
          </p>
        )}
      </div>

      {/* 단어 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredWords.map((word, index) => {
          const originalIndex = words.indexOf(word)
          const isEditing = editingIndex === originalIndex
          const isCurrent = originalIndex === currentIndex
          const isCompleted = completedWords.includes(word.word)

          return (
            <div
              key={originalIndex}
              style={{
                background: isCurrent ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : 
                           isCompleted ? "#f0fdf4" : "#f9fafb",
                border: `2px solid ${isCurrent ? "#3b82f6" : isCompleted ? "#22c55e" : "#e5e7eb"}`,
                borderRadius: "12px",
                padding: "1.5rem",
                transition: "all 0.2s",
                opacity: isCompleted ? 0.7 : 1
              }}
            >
              {/* 단어 헤더 */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  {/* 체크박스 추가 */}
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    cursor: "pointer",
                    userSelect: "none"
                  }}>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggleCompleted(word.word)}
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        marginRight: "0.5rem"
                      }}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>완료</span>
                  </label>
                  
                  <span style={{
                    background: "#6b7280",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "6px"
                  }}>
                    #{originalIndex + 1}
                  </span>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: "1.5rem", 
                    color: "#1f2937", 
                    fontWeight: "700",
                    textDecoration: isCompleted ? "line-through" : "none"
                  }}>
                    {word.word}
                  </h3>
                  {isCurrent && (
                    <span style={{
                      background: "#3b82f6",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px"
                    }}>
                      현재
                    </span>
                  )}
                  {isCompleted && (
                    <span style={{
                      background: "#22c55e",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px"
                    }}>
                      ✓ 완료
                    </span>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => handleJumpAndBack(originalIndex)}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "0.9rem"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}
                      >
                        이동
                      </button>
                      <button
                        onClick={() => startEdit(originalIndex, word)}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#f59e0b",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "0.9rem"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#d97706"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#f59e0b"}
                      >
                        ✏️ 편집
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => saveEdit(originalIndex)}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "0.9rem"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#10b981"}
                      >
                        ✓ 저장
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "0.9rem"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#4b5563"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#6b7280"}
                      >
                        취소
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 단어 상세 정보 */}
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {isEditing ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", alignItems: "start", gap: "1rem" }}>
                      <label style={{ fontWeight: "600", color: "#374151", paddingTop: "0.5rem" }}>뜻:</label>
                      <input
                        type="text"
                        value={editForm.meaning || ""}
                        onChange={(e) => setEditForm({ ...editForm, meaning: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "2px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          outline: "none"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", alignItems: "start", gap: "1rem" }}>
                      <label style={{ fontWeight: "600", color: "#374151", paddingTop: "0.5rem" }}>발음:</label>
                      <input
                        type="text"
                        value={editForm.pronunciation || ""}
                        onChange={(e) => setEditForm({ ...editForm, pronunciation: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "2px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          outline: "none"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", alignItems: "start", gap: "1rem" }}>
                      <label style={{ fontWeight: "600", color: "#374151", paddingTop: "0.5rem" }}>음절:</label>
                      <input
                        type="text"
                        value={editForm.syllables || ""}
                        onChange={(e) => setEditForm({ ...editForm, syllables: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "2px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          outline: "none"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", alignItems: "start", gap: "1rem" }}>
                      <label style={{ fontWeight: "600", color: "#374151", paddingTop: "0.5rem" }}>품사:</label>
                      <input
                        type="text"
                        value={editForm.partOfSpeech || ""}
                        onChange={(e) => setEditForm({ ...editForm, partOfSpeech: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "2px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          outline: "none"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", alignItems: "start", gap: "1rem" }}>
                      <label style={{ fontWeight: "600", color: "#374151", paddingTop: "0.5rem" }}>예문:</label>
                      <textarea
                        value={editForm.example || ""}
                        onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "2px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "0.95rem",
                          fontFamily: "inherit",
                          outline: "none",
                          resize: "vertical",
                          minHeight: "60px"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#374151" }}>
                      <strong style={{ color: "#1f2937", marginRight: "0.5rem" }}>뜻:</strong>
                      {word.meaning || "-"}
                    </div>
                    {word.pronunciation && (
                      <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#374151" }}>
                        <strong style={{ color: "#1f2937", marginRight: "0.5rem" }}>발음:</strong>
                        [{word.pronunciation}]
                      </div>
                    )}
                    {word.syllables && (
                      <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#374151" }}>
                        <strong style={{ color: "#1f2937", marginRight: "0.5rem" }}>음절:</strong>
                        {word.syllables}
                      </div>
                    )}
                    {word.partOfSpeech && (
                      <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#374151" }}>
                        <strong style={{ color: "#1f2937", marginRight: "0.5rem" }}>품사:</strong>
                        {word.partOfSpeech}
                      </div>
                    )}
                    {word.example && (
                      <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#374151" }}>
                        <strong style={{ color: "#1f2937", marginRight: "0.5rem" }}>예문:</strong>
                        {word.example}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredWords.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          color: "#6b7280"
        }}>
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  )
}

export default WordListPage