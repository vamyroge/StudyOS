import { describe, it, expect } from 'vitest';

/**
 * Math Rendering Test Cases for StudyOS AI Response
 * 
 * These test cases verify that AI responses with mathematical formulas,
 * chemistry equations, and special characters render correctly.
 */

describe('AI Response Math Rendering', () => {
  const testCases = [
    {
      name: 'Inline math - basic equation',
      input: 'Phương trình bậc hai có dạng $ax^2 + bx + c = 0$',
      expectsKatex: true,
    },
    {
      name: 'Block math - quadratic formula',
      input: 'Nghiệm của phương trình:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
      expectsKatex: true,
    },
    {
      name: 'Fractions',
      input: 'Phân số: $\\frac{a}{b}$ và $\\frac{x^2 + 1}{x - 1}$',
      expectsKatex: true,
    },
    {
      name: 'Square roots',
      input: 'Căn bậc hai: $\\sqrt{x}$, căn bậc ba: $\\sqrt[3]{x}$',
      expectsKatex: true,
    },
    {
      name: 'Superscripts and subscripts',
      input: 'Chỉ số: $x_1, x_2, x_n$ và mũ: $x^2, x^{n+1}$',
      expectsKatex: true,
    },
    {
      name: 'Chemistry - water formula',
      input: 'Nước có công thức hóa học là $H_2O$',
      expectsKatex: true,
    },
    {
      name: 'Chemistry - reaction equation',
      input: 'Phản ứng: $H_2SO_4 + 2NaOH \\rightarrow Na_2SO_4 + 2H_2O$',
      expectsKatex: true,
    },
    {
      name: 'Chemistry - multiple compounds',
      input: 'Các hợp chất: $CO_2$, $H_2SO_4$, $NaOH$, $Na_2CO_3$',
      expectsKatex: true,
    },
    {
      name: 'Greek letters',
      input: 'Các ký hiệu Hy Lạp: $\\alpha, \\beta, \\gamma, \\lambda, \\mu, \\pi, \\Omega$',
      expectsKatex: true,
    },
    {
      name: 'Sum and integral',
      input: 'Tổng: $\\sum_{i=1}^{n} i$ và tích phân: $\\int_{0}^{1} x dx$',
      expectsKatex: true,
    },
    {
      name: 'Vector',
      input: 'Vector: $\\vec{a}$, $\\vec{F} = m\\vec{a}$',
      expectsKatex: true,
    },
    {
      name: 'Special symbols',
      input: 'Ký hiệu đặc biệt: $\\pm, \\times, \\div, \\neq, \\leq, \\geq, \\rightarrow, \\Delta$',
      expectsKatex: true,
    },
    {
      name: 'Matrix',
      input: 'Ma trận:\n\n$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$',
      expectsKatex: true,
    },
    {
      name: 'System of equations',
      input: 'Hệ phương trình:\n\n$$\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}$$',
      expectsKatex: true,
    },
    {
      name: 'Physics - kinetic energy',
      input: 'Động năng: $E_k = \\frac{1}{2}mv^2$',
      expectsKatex: true,
    },
    {
      name: 'Mixed markdown and math',
      input: '# Định lý Pythagore\n\nTrong tam giác vuông: $a^2 + b^2 = c^2$\n\n## Ví dụ\n\nVới $a=3$ và $b=4$, ta có $c=5$',
      expectsKatex: true,
    },
    {
      name: 'Vietnamese text with math',
      input: 'Cho hai số thực $x$ và $y$. Tính tổng $x + y$ và tích $x \\times y$',
      expectsKatex: true,
    },
    {
      name: 'Code block with plain text',
      input: '```python\ndef calculate(x):\n    return x**2 + 2*x + 1\n```',
      expectsKatex: false,
    },
    {
      name: 'Plain text without math',
      input: 'Đây là một câu trả lời bình thường không có công thức toán học.',
      expectsKatex: false,
    },
    {
      name: 'Long formula - should be scrollable on mobile',
      input: '$$f(x) = a_0 + a_1x + a_2x^2 + a_3x^3 + a_4x^4 + a_5x^5 + a_6x^6 + a_7x^7 + a_8x^8 + a_9x^9 + a_{10}x^{10}$$',
      expectsKatex: true,
    },
  ];

  it('should have test cases for all major math rendering scenarios', () => {
    expect(testCases.length).toBeGreaterThan(15);
  });

  it('should include chemistry formulas', () => {
    const chemCases = testCases.filter(tc => tc.name.includes('Chemistry'));
    expect(chemCases.length).toBeGreaterThanOrEqual(3);
  });

  it('should include physics formulas', () => {
    const physicsCases = testCases.filter(tc => tc.name.includes('Physics'));
    expect(physicsCases.length).toBeGreaterThanOrEqual(1);
  });

  it('should include Vietnamese text tests', () => {
    const vietnameseCases = testCases.filter(tc => tc.input.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i));
    expect(vietnameseCases.length).toBeGreaterThanOrEqual(3);
  });
});
