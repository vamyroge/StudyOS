/**
 * JSON Parser Tests
 * Tests the robust JSON parsing with repair strategies
 */

import { describe, it, expect } from 'vitest';
import { parseAIJSON } from '../src/lib/quiz/json-parser';

describe('JSON Parser - Basic Parsing', () => {
  it('should parse valid JSON', () => {
    const content = JSON.stringify({ questions: [{ id: 1, text: "Test" }] });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });

  it('should extract JSON from markdown code fence', () => {
    const content = '```json\n{"questions": [{"id": 1}]}\n```';
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });

  it('should extract JSON from text with extra content', () => {
    const content = 'Here is your quiz:\n{"questions": [{"id": 1}]}\nThat was it!';
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });

  it('should handle nested objects correctly', () => {
    const content = JSON.stringify({
      questions: [{
        id: 1,
        options: [{ value: "a", label: "A" }, { value: "b", label: "B" }]
      }]
    });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions[0].options).toHaveLength(2);
  });
});

describe('JSON Parser - Repair Strategies', () => {
  it('should repair trailing commas in arrays', () => {
    const content = '{"questions": [{"id": 1,},]}';
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });

  it('should repair trailing commas in objects', () => {
    const content = '{"questions": [{"id": 1, "name": "test",}]}';
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions[0].id).toBe(1);
  });

  it('should handle truncated JSON (missing closing brace)', () => {
    const content = '{"questions": [{"id": 1, "name": "test"}]';
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });

  it('should handle truncated JSON (missing closing bracket)', () => {
    const content = '{"questions": [{"id": 1, "name": "test"}';
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });
});

describe('JSON Parser - Math Symbols', () => {
  it('should handle Unicode math symbols', () => {
    const content = JSON.stringify({
      questions: [{
        question: "Tính x² + 2x + 1",
        options: ["√4", "x₁ + x₂", "Δx", "∫dx"]
      }]
    });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('x²');
  });

  it('should handle properly escaped LaTeX', () => {
    const content = JSON.stringify({
      questions: [{
        question: "Tính \\frac{a}{b}",
        explanation: "Sử dụng công thức \\sqrt{x}"
      }]
    });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('\\frac');
  });
});

describe('JSON Parser - Chemistry Symbols', () => {
  it('should handle chemistry formulas with Unicode', () => {
    const content = JSON.stringify({
      questions: [{
        question: "Phản ứng H₂O + CO₂",
        options: ["H₂SO₄", "Fe³⁺", "SO₄²⁻", "NH₄⁺"]
      }]
    });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('H₂O');
  });
});

describe('JSON Parser - Error Cases', () => {
  it('should return error for empty content', () => {
    const result = parseAIJSON('');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Empty');
  });

  it('should return error for no JSON found', () => {
    const result = parseAIJSON('This is just plain text without JSON');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('No JSON');
  });

  it('should return error for completely invalid JSON', () => {
    const result = parseAIJSON('{ this is not json at all }');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should include attempted repairs in error result', () => {
    const result = parseAIJSON('{ "key": invalid }');
    
    expect(result.success).toBe(false);
    expect(result.attemptedRepairs).toBeDefined();
    expect(result.attemptedRepairs!.length).toBeGreaterThan(0);
  });
});

describe('JSON Parser - Real World Cases', () => {
  it('should handle quiz with multiple questions', () => {
    const content = JSON.stringify({
      questions: [
        {
          question: "Câu hỏi 1",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          explanation: "Giải thích"
        },
        {
          question: "Câu hỏi 2",
          options: ["A", "B", "C", "D"],
          correctAnswer: 1,
          explanation: "Giải thích"
        }
      ]
    });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(2);
  });

  it('should handle quiz with Vietnamese text and special characters', () => {
    const content = JSON.stringify({
      questions: [{
        question: "Đây là câu hỏi có dấu, ký tự đặc biệt: @#$%",
        options: ["Đáp án có dấu", "Số: 123", "Ký tự: !@#", "Toán: +−×÷"],
        explanation: "Giải thích với nhiều dấu câu: . , ! ? ; :"
      }]
    });
    const result = parseAIJSON<{ questions: any[] }>(content);
    
    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('Đây là câu hỏi');
  });
});

describe('JSON Parser - Regression & Bad Escaped Character Cases (Task Spec #16)', () => {
  it('should repair invalid \\frac and \\sqrt without double backslash', () => {
    // In raw text from LLM, \frac and \sqrt only have single backslashes
    const raw = '{"questions": [{"question": "Tính \\frac{1}{2} và \\sqrt{x}", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]}';
    const result = parseAIJSON<{ questions: Array<{ question: string }> }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('\\frac');
    expect(result.data?.questions[0].question).toContain('\\sqrt');
  });

  it('should repair unescaped quotes inside string values', () => {
    const raw = '{"questions": [{"question": "Tìm "giá trị cực đại" của hàm số", "options": ["A", "B", "C", "D"], "correctAnswer": 1}]}';
    const result = parseAIJSON<{ questions: Array<{ question: string }> }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('giá trị cực đại');
  });

  it('should repair missing commas between array elements', () => {
    const raw = '{"questions": [\n{"question": "Q1", "options": ["A", "B", "C", "D"], "correctAnswer": 0}\n{"question": "Q2", "options": ["A", "B", "C", "D"], "correctAnswer": 1}\n]}';
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(2);
  });

  it('should repair missing closing bracket ] and brace }', () => {
    const raw = '{"questions": [{"question": "Q1", "options": ["A", "B", "C", "D"], "correctAnswer": 0}';
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });

  it('should handle raw newline inside JSON string literal', () => {
    const raw = '{"questions": [{"question": "Dòng 1\nDòng 2", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]}';
    const result = parseAIJSON<{ questions: Array<{ question: string }> }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('Dòng 1');
  });

  it('should extract JSON from markdown fences', () => {
    const raw = '```json\n{"questions": [{"question": "Câu hỏi trong fence", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]}\n```';
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions).toHaveLength(1);
  });
});

describe('JSON Parser - STEM Content Verification (Task Spec #15)', () => {
  it('should parse Math formulas: √(x² + 1), x² + 2x + 1, Δ = b² - 4ac', () => {
    const raw = JSON.stringify({
      questions: [
        {
          question: "Tính đạo hàm của √(x² + 1)",
          options: ["x² + 2x + 1", "Δ = b² - 4ac", "x / √(x² + 1)", "2x"],
          correctAnswer: 2,
          explanation: "Áp dụng quy tắc đạo hàm hàm hợp",
        },
      ],
    });
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('√(x² + 1)');
    expect(result.data?.questions[0].options[1]).toContain('Δ = b² - 4ac');
  });

  it('should parse Physics formulas: v = Δs/Δt, F = ma, U = IR, λ = v/f', () => {
    const raw = JSON.stringify({
      questions: [
        {
          question: "Vận tốc trung bình được xác định bởi v = Δs/Δt",
          options: ["F = ma", "U = IR", "λ = v/f", "Tất cả đều đúng"],
          correctAnswer: 3,
          explanation: "Các định luật cơ bản của vật lý",
        },
      ],
    });
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('v = Δs/Δt');
    expect(result.data?.questions[0].options[0]).toContain('F = ma');
    expect(result.data?.questions[0].options[1]).toContain('U = IR');
    expect(result.data?.questions[0].options[2]).toContain('λ = v/f');
  });

  it('should parse Chemistry formulas: H₂SO₄, SO₄²⁻, Fe³⁺, CH₃COOH, C₆H₅OH', () => {
    const raw = JSON.stringify({
      questions: [
        {
          question: "Ion nào sau đây có điện tích 3+: Fe³⁺ hay SO₄²⁻?",
          options: ["H₂SO₄", "SO₄²⁻", "Fe³⁺", "CH₃COOH phản ứng C₆H₅OH"],
          correctAnswer: 2,
          explanation: "Fe³⁺ là cation sắt (III)",
        },
      ],
    });
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toContain('Fe³⁺');
    expect(result.data?.questions[0].options[0]).toContain('H₂SO₄');
    expect(result.data?.questions[0].options[1]).toContain('SO₄²⁻');
    expect(result.data?.questions[0].options[3]).toContain('CH₃COOH');
    expect(result.data?.questions[0].options[3]).toContain('C₆H₅OH');
  });

  it('should parse mixed STEM formula: Tính √(x² + 4) khi x = 3', () => {
    const raw = JSON.stringify({
      questions: [
        {
          question: "Tính √(x² + 4) khi x = 3.",
          options: ["√13", "5", "7", "25"],
          correctAnswer: 0,
          explanation: "Thay x = 3 vào ta có √(3² + 4) = √(9 + 4) = √13.",
        },
      ],
    });
    const result = parseAIJSON<{ questions: any[] }>(raw);

    expect(result.success).toBe(true);
    expect(result.data?.questions[0].question).toBe("Tính √(x² + 4) khi x = 3.");
    expect(result.data?.questions[0].options[0]).toBe("√13");
  });
});
