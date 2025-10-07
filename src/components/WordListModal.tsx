import { FC, useState } from "react"
import type { PracticeWord } from "../lib/csv"

type WordListModalProps = {
  words: PracticeWord[]
  currentIndex: number
  onClose: () => void
  onJumpTo: (index: number) => void
  onEdit: (index: number, updatedWord: Partial<PracticeWord>) => void
}

const WordListModal: FC<WordListModalProps> = ({
  words,
  currentIndex,
  onClose,
  onJumpTo,
  onEdit,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<PracticeWord>>({})
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredWords = words.filter((word) =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>전체 단어 목록</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="단어 또는 뜻 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="modal-search-input"
          />
          <div className="modal-search-info">
            {filteredWords.length} / {words.length} 단어
          </div>
        </div>

        <div className="modal-body">
          {filteredWords.map((word, index) => {
            const originalIndex = words.indexOf(word)
            const isEditing = editingIndex === originalIndex
            const isCurrent = originalIndex === currentIndex

            return (
              <div
                key={originalIndex}
                className={`word-item ${isCurrent ? "word-item--current" : ""}`}
              >
                <div className="word-item-header">
                  <div className="word-item-title">
                    <span className="word-item-number">#{originalIndex + 1}</span>
                    <h3 className="word-item-word">{word.word}</h3>
                    {isCurrent && <span className="word-item-badge">현재</span>}
                  </div>
                  <div className="word-item-actions">
                    {!isEditing ? (
                      <>
                        <button
                          className="word-item-btn word-item-btn--jump"
                          onClick={() => {
                            onJumpTo(originalIndex)
                            onClose()
                          }}
                        >
                          이동
                        </button>
                        <button
                          className="word-item-btn word-item-btn--edit"
                          onClick={() => startEdit(originalIndex, word)}
                        >
                          ✏️ 편집
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="word-item-btn word-item-btn--save"
                          onClick={() => saveEdit(originalIndex)}
                        >
                          ✓ 저장
                        </button>
                        <button
                          className="word-item-btn word-item-btn--cancel"
                          onClick={cancelEdit}
                        >
                          취소
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="word-item-details">
                  {isEditing ? (
                    <>
                      <div className="word-edit-field">
                        <label>뜻:</label>
                        <input
                          type="text"
                          value={editForm.meaning || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, meaning: e.target.value })
                          }
                        />
                      </div>
                      <div className="word-edit-field">
                        <label>발음:</label>
                        <input
                          type="text"
                          value={editForm.pronunciation || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, pronunciation: e.target.value })
                          }
                        />
                      </div>
                      <div className="word-edit-field">
                        <label>음절:</label>
                        <input
                          type="text"
                          value={editForm.syllables || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, syllables: e.target.value })
                          }
                        />
                      </div>
                      <div className="word-edit-field">
                        <label>품사:</label>
                        <input
                          type="text"
                          value={editForm.partOfSpeech || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, partOfSpeech: e.target.value })
                          }
                        />
                      </div>
                      <div className="word-edit-field">
                        <label>예문:</label>
                        <textarea
                          value={editForm.example || ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, example: e.target.value })
                          }
                          rows={2}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="word-detail-row">
                        <strong>뜻:</strong> {word.meaning || "-"}
                      </div>
                      {word.pronunciation && (
                        <div className="word-detail-row">
                          <strong>발음:</strong> [{word.pronunciation}]
                        </div>
                      )}
                      {word.syllables && (
                        <div className="word-detail-row">
                          <strong>음절:</strong> {word.syllables}
                        </div>
                      )}
                      {word.partOfSpeech && (
                        <div className="word-detail-row">
                          <strong>품사:</strong> {word.partOfSpeech}
                        </div>
                      )}
                      {word.example && (
                        <div className="word-detail-row">
                          <strong>예문:</strong> {word.example}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WordListModal