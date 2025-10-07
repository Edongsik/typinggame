import { FC, useState, useEffect } from "react"
import { addCustomWord, getCustomWords, removeCustomWord, exportCustomWordsAsCSV } from "../lib/customWords"

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

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en/"

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
  const endpoint = `${API_BASE}${encodeURIComponent(word)}`
  const response = await fetch(endpoint)
  
  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`)
  }
  
  const payload = await response.json()
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("단어를 찾을 수 없습니다")
  }

  const entry = payload[0]
  const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : []
  const meanings = Array.isArray(entry.meanings) ? entry.meanings : []

  const pronunciation = phonetics.find(
    (item: any) => item && typeof item.text === "string" && item.text.trim().length > 0
  )?.text ?? (typeof entry.phonetic === "string" ? entry.phonetic : "")

  let partOfSpeech = ""
  let meaning = ""
  let example = ""

  for (const meaningEntry of meanings) {
    if (!meaningEntry || typeof meaningEntry !== "object") continue
    
    if (!partOfSpeech && typeof meaningEntry.partOfSpeech === "string") {
      partOfSpeech = meaningEntry.partOfSpeech
    }
    
    const definitions = Array.isArray(meaningEntry.definitions) ? meaningEntry.definitions : []
    for (const definition of definitions) {
      if (!definition || typeof definition !== "object") continue
      
      if (!meaning && typeof definition.definition === "string") {
        meaning = definition.definition
      }
      if (!example && typeof definition.example === "string") {
        example = definition.example
      }
      if (meaning && example) break
    }
    if (meaning && example && partOfSpeech) break
  }

  return {
    word,
    meaning,
    pronunciation,
    syllables: syllabify(word),
    partOfSpeech,
    example,
  }
}

const AddWord: FC<AddWordProps> = ({ dayId, dayLabel, onBack, onWordAdded }) => {
  const [inputWord, setInputWord] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedWord, setFetchedWord] = useState<Word | null>(null)
  const [savedWords, setSavedWords] = useState<Word[]>([])

  // 저장된 단어 불러오기
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
      // localStorage에 자동 저장
      addCustomWord(dayId, fetchedWord)
      setSavedWords(getCustomWords(dayId))
      
      if (onWordAdded) {
        onWordAdded(fetchedWord)
      }
      
      setFetchedWord(null)
    }
  }

  const handleDelete = (wordText: string) => {
    if (confirm(`"${wordText}" 단어를 삭제하시겠습니까?`)) {
      removeCustomWord(dayId, wordText)
      setSavedWords(getCustomWords(dayId))
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
                  background: index % 2 === 0 ? "#f8f9fa" : "#fff",
                  borderRadius: "4px",
                  marginBottom: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong style={{ fontSize: "1.1rem", color: "#2c3e50" }}>
                    {word.word}
                  </strong>
                  <span style={{ marginLeft: "1rem", color: "#7f8c8d" }}>
                    {word.meaning}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(word.word)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  🗑️ 삭제
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