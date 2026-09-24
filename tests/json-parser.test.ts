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
