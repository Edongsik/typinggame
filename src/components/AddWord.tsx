import { FC, useState, useEffect } from "react"
import { addCustomWord, getCustomWords, removeCustomWord, exportCustomWordsAsCSV } from "../lib/customWords"
import { invalidateDayCache } from "../lib/csv"

type Word = {
  word: string
  meaning: string
  pronunciation: string
  syllables: string
  partOfSpeech: string
  example: string
}

type AddWordProps = {
  dayId: string
  dayLabel: string
  onBack: () => void
  onWordAdded?: (word: Word) => void
}

const MERRIAM_WEBSTER_API_KEY = "703c15c0-d467-4c09-8733-bf73ff270fbc"
const API_BASE = "https://www.dictionaryapi.com/api/v3/references/collegiate/json/"

function syllabify(word: string): string {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!cleaned) return ""
  
  const vowels = new Set(["a", "e", "i", "o", "u", "y"])
  const segments: string[] = []
  let start = 0
  
  for (let index = 1; index < cleaned.length; index += 1) {
    const previous = cleaned[index - 1]
    const current = cleaned[index]
    if (vowels.has(current) && !vowels.has(previous)) {
      segments.push(word.slice(start, index))
      start = index
    }
  }
  segments.push(word.slice(start))
  
  const filtered = segments.filter(Boolean)
  if (filtered.length <= 1) return word
  return filtered.join("-")
}

async function fetchWordDetails(word: string): Promise<Word> {
  const endpoint = `${API_BASE}${encodeURIComponent(word)}?key=${MERRIAM_WEBSTER_API_KEY}`
  console.log('🌐 Merriam-Webster API 요청:', endpoint)
  
  const response = await fetch(endpoint)
  
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`)
  }
  
  const payload = await response.json()
  console.log('📦 API 응답:', payload)
  
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("단어를 찾을 수 없습니다")
  }
  
  // Merriam-Webster는 제안 단어를 문자열 배열로 반환할 수 있음
  if (typeof payload[0] === 'string') {
    throw new Error(`단어를 찾을 수 없습니다. 혹시 이런 단어를 찾으셨나요? ${payload.slice(0, 3).join(', ')}`)
  }
  
  const entry = payload[0]
  
  // 발음 추출
  let pronunciation = ""
  if (entry.hwi?.prs?.[0]?.mw) {
    pronunciation = entry.hwi.prs[0].mw
  }
  
  // 품사 추출
  const partOfSpeech = entry.fl || ""
  
  // 뜻 추출
  let meaning = ""
  let example = ""
  
  if (entry.shortdef && Array.isArray(entry.shortdef) && entry.shortdef.length > 0) {
    meaning = entry.shortdef[0]
  }
  
  // 예문 추출
  if (entry.def && Array.isArray(entry.def)) {
    for (const def of entry.def) {
      if (def.sseq && Array.isArray(def.sseq)) {
        for (const sseq of def.sseq) {
          if (Array.isArray(sseq)) {
            for (const item of sseq) {
              if (Array.isArray(item) && item[1]?.dt) {
                for (const dt of item[1].dt) {
                  if (Array.isArray(dt) && dt[0] === 'vis' && Array.isArray(dt[1])) {
                    for (const vis of dt[1]) {
                      if (vis.t) {
                        // {bc} 같은 태그 제거
                        example = vis.t.replace(/\{[^}]+\}/g, '').trim()
                        break
                      }
                    }
                  }
                  if (example) break
                }
              }
              if (example) break
            }
          }
          if (example) break
        }
      }
      if (example) break
    }
  }
  
  const result = {
    word: entry.meta?.id?.split(':')[0] || word,
    meaning,
    pronunciation,
    syllables: entry.hwi?.hw?.replace(/\*/g, '-') || syllabify(word),
    partOfSpeech,
    example,
  }
  
  console.log('✅ 최종 결과:', result)
  return result
}

const AddWord: FC<AddWordProps> = ({ dayId, dayLabel, onBack, onWordAdded }) => {
  const [inputWord, setInputWord] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedWord, setFetchedWord] = useState<Word | null>(null)
  const [savedWords, setSavedWords] = useState<Word[]>([])

  useEffect(() => {
    setSavedWords(getCustomWords(dayId))
  }, [dayId])

  const handleFetch = async () => {
    const trimmed = inputWord.trim()
    if (!trimmed) {
      setError("단어를 입력해주세요")
      return
    }

    setIsLoading(true)
    setError(null)
    setFetchedWord(null)

    try {
      const wordData = await fetchWordDetails(trimmed)
      setFetchedWord(wordData)
      setInputWord("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "단어 정보를 가져오는데 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    if (fetchedWord) {
      addCustomWord(dayId, fetchedWord)
      setSavedWords(getCustomWords(dayId))
      invalidateDayCache(dayId)
      
      if (onWordAdded) {
        onWordAdded(fetchedWord)
      }
      
      setFetchedWord(null)
      alert(`✅ "${fetchedWord.word}" 단어가 추가되었습니다!`)
    }
  }

  const handleDelete = (wordText: string) => {
    if (confirm(`"${wordText}" 단어를 삭제하시겠습니까?`)) {
      removeCustomWord(dayId, wordText)
      setSavedWords(getCustomWords(dayId))
      invalidateDayCache(dayId)
      alert(`✅ "${wordText}" 단어가 삭제되었습니다!`)
    }
  }

  const handleCancel = () => {
    setFetchedWord(null)
    setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetch()
    }
  }

  const handleDownloadCSV = () => {
    if (savedWords.length === 0) {
      alert("저장된 단어가 없습니다")
      return
    }

    const csvContent = exportCustomWordsAsCSV(dayId)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", `${dayId}_custom_words.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <button onClick={onBack} className="back-to-list-button">
        ← 단어집으로 돌아가기
      </button>

      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1.5rem" 
      }}>
        <h2 style={{ margin: 0, color: "#2c3e50" }}>
          {dayLabel} - 단어 추가
        </h2>
        <div style={{ 
          padding: "0.5rem 1rem", 
          background: "#3b82f6", 
          color: "white",
          borderRadius: "999px",
          fontWeight: "600"
        }}>
          💾 자동 저장됨
        </div>
      </div>

      <div style={{ 
        background: "#fff", 
        padding: "2rem", 
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
            영어 단어 입력:
          </label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="예: accomplish"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "0.75rem",
                fontSize: "1.1rem",
                border: "2px solid #ddd",
                borderRadius: "8px",
                outline: "none"
              }}
            />
            <button
              onClick={handleFetch}
              disabled={isLoading || !inputWord.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                background: isLoading ? "#ccc" : "#3498db",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? "검색중..." : "단어 검색"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            padding: "1rem", 
            background: "#fee", 
            color: "#c33",
            borderRadius: "8px",
            marginTop: "1rem"
          }}>
            {error}
          </div>
        )}

        {fetchedWord && (
          <div style={{ 
            marginTop: "2rem", 
            padding: "1.5rem", 
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "2px solid #2ecc71"
          }}>
            <h3 style={{ marginTop: 0, color: "#2c3e50" }}>검색 결과:</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div><strong>단어:</strong> {fetchedWord.word}</div>
              <div><strong>뜻:</strong> {fetchedWord.meaning || "-"}</div>
              <div><strong>발음:</strong> {fetchedWord.pronunciation || "-"}</div>
              <div><strong>음절:</strong> {fetchedWord.syllables || "-"}</div>
              <div><strong>품사:</strong> {fetchedWord.partOfSpeech || "-"}</div>
              <div><strong>예문:</strong> {fetchedWord.example || "-"}</div>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
              <button
                onClick={handleAdd}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#2ecc71",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                ✓ 저장하기
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#95a5a6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {savedWords.length > 0 && (
        <div style={{ 
          background: "#fff", 
          padding: "2rem", 
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "1rem"
          }}>
            <h3 style={{ margin: 0 }}>저장된 단어 ({savedWords.length}개)</h3>
            <button
              onClick={handleDownloadCSV}
              style={{
                padding: "0.5rem 1rem",
                background: "#f39c12",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              📥 백업 CSV 다운로드
            </button>
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {savedWords.map((word, index) => (
              <div 
                key={index}
                style={{ 
                  padding: "1rem", 
                  background: index % 2 === 0 ? "#f9f9f9" : "#fff",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{word.word}</div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>{word.meaning}</div>
                </div>
                <button
                  onClick={() => handleDelete(word.word)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AddWord