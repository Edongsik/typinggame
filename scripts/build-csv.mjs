// 1. 필요한 모듈 가져오기
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 2. 설정 (Configuration)
const MERRIAM_WEBSTER_API_KEY = "703c15c0-d467-4c09-8733-bf73ff270fbc"; // <--- 방금 받은 새 키로 교체!
const API_BASE = "https://www.dictionaryapi.com/api/v3/references/collegiate/json/";
const MAX_RETRIES = 3; // 실패 시 최대 3번까지 재시도
const RETRY_DELAY_MS = 1000; // 재시도 사이의 대기 시간 (1초)
const REQUEST_TIMEOUT_MS = 30000; // 요청 타임아웃 (30초)

// 파일 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const SEED_PATH = path.join(DATA_DIR, "seed.txt");
const CSV_PATH = path.join(PUBLIC_DIR, "words.csv");

// 헬퍼 함수: 잠시 대기
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 3. 핵심 기능: 단어 정보 가져오기 (Merriam-Webster 버전)
async function fetchWordDetails(word) {
  // ⭐️ 수정된 부분: URL 끝에 단어와 API 키를 붙입니다.
  const endpoint = `${API_BASE}${encodeURIComponent(word)}?key=${MERRIAM_WEBSTER_API_KEY}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId); // 성공 시 타임아웃 해제

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      // API가 단어를 못 찾으면 추천 단어 배열을 반환하므로, 객체가 아니면 에러 처리합니다.
      if (!Array.isArray(payload) || payload.length === 0 || typeof payload[0] !== 'object') {
        throw new Error("Word not found or unexpected response structure");
      }

      // --- ⭐️ 수정된 부분: Merriam-Webster API 데이터 구조에 맞게 추출 ---
      const entry = payload[0];

      const pronunciation = entry.hwi?.prs?.[0]?.mw ?? ""; // 발음 기호
      const partOfSpeech = entry.fl ?? ""; // 품사 (noun, verb 등)
      const meaning = entry.shortdef?.[0] ?? ""; // 짧은 정의
      const example = ""; // 예문은 데이터 구조가 복잡하여 우선 빈 값으로 처리
      const syllables = entry.hwi?.hw?.replace(/\*/g, "-") ?? word; // 음절 정보

      return {
        word,
        meaning,
        pronunciation,
        syllables,
        partOfSpeech,
        example,
      };
      // --- 데이터 추출 로직 끝 ---

    } catch (error) {
      clearTimeout(timeoutId); // 실패 시에도 타임아웃 해제
      if (attempt === MAX_RETRIES) {
        // 마지막 시도도 실패하면 최종 에러 반환
        throw error;
      }
      console.warn(
        `[Attempt ${attempt}/${MAX_RETRIES}] Failed for "${word}": ${error.message}. Retrying...`
      );
      await delay(RETRY_DELAY_MS);
    }
  }
}

// 4. CSV 형식으로 변환
function toCsvRow(row) {
  const values = [
    row?.word,
    row?.meaning,
    row?.pronunciation,
    row?.syllables,
    row?.partOfSpeech,
    row?.example,
  ];

  return values
    .map((value) => {
      const str = String(value ?? "");
      const escaped = str.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    })
    .join(",");
}

// 5. 메인 실행 함수
async function main() {
  console.log("🚀 스크립트 실행 시작...");

  // 폴더 생성
  await mkdir(PUBLIC_DIR, { recursive: true });

  // data/seed.txt 파일 읽기
  let seedContent;
  try {
    seedContent = await readFile(SEED_PATH, "utf-8");
  } catch {
    console.error(`❌ Error: 'data/seed.txt' 파일을 찾을 수 없습니다.`);
    process.exit(1);
  }

  const words = [
    ...new Set(seedContent.split(/\r?\n/).map((w) => w.trim()).filter(Boolean)),
  ];

  if (words.length === 0) {
    console.error("❌ Error: 'data/seed.txt' 파일에 단어가 없습니다.");
    process.exit(1);
  }

  console.log(`💡 총 ${words.length}개의 고유 단어를 찾았습니다. 작업 시작...`);

  // 단어 정보 가져오기 및 처리
  const results = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    console.log(`[${i + 1}/${words.length}] 처리 중: "${word}"`);

    try {
      const details = await fetchWordDetails(word);
      if (details) { // 성공적으로 데이터를 가져온 경우에만 추가
        results.push(details);
      } else { // details가 undefined인 경우 (모든 재시도 실패)
         throw new Error("All retry attempts failed.");
      }
    } catch (error) {
      console.error(`❌ 최종 실패: "${word}" - ${error.message}`);
      // 실패 시 빈 데이터 추가
      results.push({
        word,
        meaning: "FETCH_FAILED",
        pronunciation: "",
        syllables: word,
        partOfSpeech: "",
        example: "",
      });
    }
  }

  // CSV 파일로 저장
  const header = "word,meaning,pronunciation,syllables,partOfSpeech,example";
  const csvContent = [header, ...results.map(toCsvRow)].join("\n");
  await writeFile(CSV_PATH, csvContent, "utf-8");

  console.log(`\n✅ 완료! ${results.length}개의 단어를 public/words.csv 파일에 저장했습니다.`);
}

// 스크립트 실행
main();