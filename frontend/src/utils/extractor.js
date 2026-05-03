import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Menggunakan worker lokal yang dihandle oleh Vite agar lebih stabil
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractTextFromFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    let fullText = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      fullText += XLSX.utils.sheet_to_txt(sheet) + "\n";
    });
    return fullText;
  }

  if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      fullText += strings.join(" ") + "\n";
    }
    return fullText;
  }

  if (ext === "txt") {
    return await file.text();
  }

  throw new Error(
    "Format file tidak didukung. Gunakan DOCX, PDF, XLSX, atau TXT.",
  );
}

export async function generateQuizFromText(text, apiKey) {
  if (!apiKey) {
    throw new Error(
      "Gemini API Key tidak ditemukan. Silakan restart terminal npm run dev.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Model terbaru yang masih aktif (urutan prioritas)
  const modelNames = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
  ];

  const prompt = `Anda adalah asisten dosen yang ahli dalam membuat kuis. 
Tugas Anda adalah mengekstrak teks berikut yang berasal dari dokumen materi/soal ujian, dan mengubahnya menjadi array JSON soal pilihan ganda.
Aturan:
1. Analisis teks dan buat pertanyaan yang masuk akal berdasarkan informasi tersebut. Jika teks sudah berisi soal, format ulang soal tersebut.
2. Setiap soal harus memiliki tepat 4 opsi jawaban (A, B, C, D).
3. Tentukan indeks jawaban yang benar (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D).
4. OUTPUT HARUS BERUPA JSON ARRAY VALID, tanpa ada karakter markdown \`\`\`json atau penjelasan apapun. HANYA ARRAY.
Format JSON yang diharapkan:
[
  {
    "text": "Pertanyaan...",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctIndex": 0
  }
]

Teks sumber:
${text.substring(0, 30000)}
`;

  let result;
  let lastError;

  for (const name of modelNames) {
    try {
      console.log(`Mencoba model: ${name}...`);
      const currentModel = genAI.getGenerativeModel({ model: name });
      result = await currentModel.generateContent(prompt);
      if (result) {
        console.log(`Berhasil menggunakan model: ${name}`);
        break;
      }
    } catch (error) {
      console.warn(`Model ${name} gagal: ${error.message}`);
      lastError = error;
    }
  }

  if (!result) {
    throw new Error(
      `Semua model AI gagal. Pastikan API Key sudah aktif di Google AI Studio. Error: ${lastError?.message}`,
    );
  }

  const responseText = result.response.text();

  try {
    const cleaned = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return parsed.map((item, index) => ({
      id: Date.now() + index,
      text: item.text || "Pertanyaan",
      options:
        item.options && item.options.length === 4
          ? item.options
          : ["A", "B", "C", "D"],
      correctIndex:
        typeof item.correctIndex === "number" ? item.correctIndex : 0,
    }));
  } catch (error) {
    console.error("Gagal parse respons AI:", responseText);
    throw new Error(
      "AI gagal menghasilkan format kuis yang valid. Silakan coba lagi.",
    );
  }
}
