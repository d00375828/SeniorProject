const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const MAX_EXTRACTED_TEXT_LENGTH = 20000;
const MAX_PROMPT_TEXT_LENGTH = 4000;
const SUPPORTED_ATTACHMENT_KINDS = new Set([
  "slides",
  "instructions",
  "rubric",
  "resume",
  "job-listing",
  "notes",
]);

const TEXT_MIME_TYPES = new Set(["text/plain", "text/markdown"]);
const TEXT_EXTENSIONS = new Set([".txt", ".md"]);
const PDF_EXTENSIONS = new Set([".pdf"]);
const PDF_MIME_TYPES = new Set(["application/pdf"]);

function normalizeWhitespace(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function buildPromptText(extractedText, _kind) {
  const normalized = normalizeWhitespace(extractedText);
  return normalized.length > MAX_PROMPT_TEXT_LENGTH
    ? `${normalized.slice(0, MAX_PROMPT_TEXT_LENGTH)}...`
    : normalized;
}

function trimExtractedText(text) {
  const normalized = normalizeWhitespace(text);
  return normalized.length > MAX_EXTRACTED_TEXT_LENGTH
    ? `${normalized.slice(0, MAX_EXTRACTED_TEXT_LENGTH)}...`
    : normalized;
}

async function extractAttachmentText(filePath, mimeType, fileName) {
  const extension = path.extname(fileName || filePath).toLowerCase();

  if (TEXT_MIME_TYPES.has(mimeType) || TEXT_EXTENSIONS.has(extension)) {
    const text = fs.readFileSync(filePath, "utf8");
    return trimExtractedText(text);
  }

  if (PDF_MIME_TYPES.has(mimeType) || PDF_EXTENSIONS.has(extension)) {
    const fileBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBuffer });

    try {
      const parsed = await parser.getText();
      return trimExtractedText(parsed.text || "");
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(
    "Unsupported file type. Upload a PDF, TXT, or Markdown file."
  );
}

function validateAttachmentKind(kind) {
  return SUPPORTED_ATTACHMENT_KINDS.has(kind);
}

module.exports = {
  buildPromptText,
  extractAttachmentText,
  validateAttachmentKind,
};
