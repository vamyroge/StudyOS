export const CONTRIBUTION_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const CONTRIBUTION_FILE_TYPES = ["text/plain", "text/markdown", "text/csv"];

export function validateContributionFile(file: File | null): string | null {
  if (!file) return null;
  if (file.size === 0 || file.size > CONTRIBUTION_MAX_FILE_SIZE) {
    return "File phải có kích thước từ 1 byte đến 10MB.";
  }
  if (!CONTRIBUTION_FILE_TYPES.includes(file.type)) {
    return "Chỉ hỗ trợ file TXT, Markdown và CSV. PDF/OCR hiện chưa được hỗ trợ.";
  }
  return null;
}
