import { CommentData } from '../components/CommentsSidebar';

// Define the analysis data structure
export interface RubricScore {
  category: string;
  score: number;
  explanation: string[];
  comments: {
    comment: string;
    start_index: number;
    end_index: number;
  }[];
}

// New interface for the writing style hero
export interface WritingHero {
  name: string;
  description: string;
  strengths: string[];
  tips: string[];
  icon: string;
}

interface ReportGeneratorOptions {
  essayContent: string;
  comments: CommentData[]; // Update to use CommentData type
  wordCount: number;
  analysis?: RubricScore[]; // Optional to maintain backward compatibility
  writingHero?: WritingHero; // Add the writing hero to options
}

export const generateReport = (options: ReportGeneratorOptions): Window | null => {
  let { essayContent, comments, wordCount, analysis = [], writingHero } = options;

  // Provide default analysis if none is provided
  if (!analysis?.length) {
    analysis = [
      {
        category: "Content (Ideas and Development)",
        score: 5,
        explanation: ["Sample feedback: Excellent development of ideas."],
        comments: [],
      },
      {
        category: "Structure (Organization)",
        score: 5,
        explanation: ["Sample feedback: Very logical and clear structure."],
        comments: [],
      },
      {
        category: "Stance (Voice and Tone)",
        score: 5,
        explanation: ["Sample feedback: Strong voice and appropriate tone."],
        comments: [],
      },
      {
        category: "Word Choice (Diction)",
        score: 5,
        explanation: ["Sample feedback: Varied and precise word choice."],
        comments: [],
      },
      {
        category: "Sentence Fluency",
        score: 5,
        explanation: ["Sample feedback: Sentences flow smoothly and clearly."],
        comments: [],
      },
      {
        category: "Conventions",
        score: 5,
        explanation: ["Sample feedback: Grammar and punctuation are on point."],
        comments: [],
      },
    ];
  }

  // Create a new window for the report
  const reportWindow = window.open('', '_blank');
  
  if (!reportWindow) {
    alert('Please allow popups for this site to generate reports');
    return null;
  }
  
  // First, process the essay content to add markers
  let markedEssayContent = essayContent;

  // Ensure we have comments with highlighted text - a safer approach
  const validComments = comments.filter(comment => comment.highlightedText && comment.highlightedText.trim().length > 0);

  // If we don't have highlighted text info in the comments, inform the user
  if (validComments.length === 0 && comments.length > 0) {
    // Add a note to the report that comments won't be linked
    reportWindow.document.write(`
      <div style="background-color: #fee2e2; color: #991b1b; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
        <p style="margin: 0;">Note: Comment highlighting cannot be displayed in this report because the highlighted text data is missing from your comments.</p>
      </div>
    `);
  } else {
    // We have valid comments with highlighted text
    
    // Create a DOM parser to safely process HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(essayContent, 'text/html');
    
    // Function to find and mark text nodes that match our target
    function markTextInNode(
      node: Node, 
      targetText: string, 
      commentId: string, 
      commentNumber: number
    ): boolean {
      if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent || '';
        if (content.includes(targetText)) {
          // Create a wrapper span for the highlighted text
          const wrapper = document.createElement('span');
          wrapper.className = 'essay-comment-mark';
          wrapper.setAttribute('data-comment-id', commentId);
          
          // Set text content to the matched part
          wrapper.textContent = targetText;
          
          // Create a link for the comment number that jumps to the comment
          const link = document.createElement('a');
          link.className = 'comment-number';
          link.href = `#comment-${commentNumber}`; // Add anchor link
          link.textContent = `[${commentNumber}]`;
          wrapper.appendChild(link);
          
          // Replace the text node with the marked-up version
          const beforeText = content.substring(0, content.indexOf(targetText));
          const afterText = content.substring(content.indexOf(targetText) + targetText.length);
          
          if (beforeText) {
            node.parentNode?.insertBefore(document.createTextNode(beforeText), node);
          }
          
          node.parentNode?.insertBefore(wrapper, node);
          
          if (afterText) {
            node.textContent = afterText;
            // Continue searching in the remaining text
            markTextInNode(node, targetText, commentId, commentNumber);
          } else {
            node.parentNode?.removeChild(node);
          }
          
          return true;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && 
                !['script', 'style', 'textarea'].includes((node as Element).tagName.toLowerCase())) {
        // Process child nodes recursively
        for (let i = 0; i < node.childNodes.length; i++) {
          // If we found and marked the text, we're done with this comment
          if (markTextInNode(node.childNodes[i], targetText, commentId, commentNumber)) {
            return true;
          }
        }
      }
      return false;
    }
    
    // Mark each comment's highlighted text in the document
    validComments.forEach((comment, index) => {
      if (comment.highlightedText) {
        const commentNumber = index + 1;
        markTextInNode(doc.body, comment.highlightedText, comment.id, commentNumber);
      }
    });
    
    // Get the processed HTML with our comment markers
    markedEssayContent = doc.body.innerHTML;
  }

  // Generate the HTML for report
  const reportHTML = generateReportHTML(
    essayContent, 
    markedEssayContent, 
    comments, 
    analysis, 
    wordCount,
    writingHero // Pass the writing hero to the HTML generator
  );

  // Write the report content to the new window
  reportWindow.document.write(reportHTML);
  reportWindow.document.close();
  
  return reportWindow;
};

// Helper functions for scoring
const getProgressBarColor = (score: number): string => {
  if (score >= 4) return '#22c55e'; // green-500
  if (score >= 3) return '#3b82f6'; // blue-500
  if (score >= 2) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

const getEmoji = (score: number): string => {
  if (score >= 4.5) return '🌟'; // Outstanding
  if (score >= 4) return '😊'; // Great
  if (score >= 3) return '👍'; // Good
  if (score >= 2) return '🤔'; // Needs work
  return '💪'; // Keep trying
};

const getEncouragement = (score: number): string => {
  if (score >= 4.5) return "Outstanding work! You're a writing superstar! 🌟";
  if (score >= 4) return "Amazing job! Your writing skills are fantastic! ⭐";
  if (score >= 3) return "Good work! Keep practicing and you'll get even better! 👍";
  if (score >= 2) return "You're on your way! Let's work on improving together! 💪";
  return "Everyone starts somewhere! Let's build your writing skills together! 🌱";
};

const teacherRevisionScript = `
<script>
  function toggleEditMode() {
    const body = document.body;
    body.contentEditable = body.contentEditable === 'true' ? 'false' : 'true';
    document.getElementById('editButton').innerHTML =
      body.contentEditable === 'true'
        ? '🔒 Lock Report'
        : '✏️ Edit Report';
  }

  // Example function to recalc bars after scores are edited:
  function updateScoreBars() {
    // For each .category-container, find its .category-score and recalc .progress-fill
    const categories = document.querySelectorAll('.category-container');
    categories.forEach(cat => {
      const scoreText = cat.querySelector('.category-score')?.textContent || '0/5';
      // Expecting format like '3/5'
      const match = scoreText.match(/(\\d+(\\.\\d+)?)\\s*\\/\\s*(\\d+)/);
      if (!match) return;
      const scoreVal = parseFloat(match[1] || '0');
      const maxVal = parseFloat(match[3] || '5');

      const bar = cat.querySelector('.progress-fill');
      if (bar) {
        const percentage = (scoreVal / maxVal) * 100;
        bar.style.width = percentage + '%';
      }
    });
  }
</script>
`;

const styles = `
<style>
  body {
    font-family: 'Comic Sans MS', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #374151;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f8fafc;
    counter-reset: comment-counter;
  }
  
  /* Header with flex to show overall grade side-by-side */
  header {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  header .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  header .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: white;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  h1 {
    color: #1e40af;
    font-size: 2rem;
    margin: 0;
  }

  .meta {
    color: #6b7280;
    font-size: 0.95rem;
  }

  /* Overall grade styling in the header-right container */
  .header-right .score-value {
    font-size: 2rem;
    color: #1e40af;
    line-height: 1;
  }
  .header-right .grade-label {
    font-size: 1rem;
    color: #6b7280;
  }
  .header-right .emoji {
    font-size: 1.75rem;
  }

  .analysis-section {
    margin-top: 3rem;
  }

  .category-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .category-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #1e40af;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-score {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1e40af;
  }
  
  .progress-bar {
    width: 100%;
    height: 12px;
    background-color: #e5e7eb;
    border-radius: 6px;
    margin: 0.5rem 0;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    transition: width 1s ease-in-out;
  }

  .essay-content {
    margin-top: 2rem;
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .comments-section {
    margin-top: 3rem;
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .comment-box {
    background-color: #fffbeb;
    border-left: 4px solid #fbbf24;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 0 5px 5px 0;
    position: relative;
  }

  .comment-box::before {
    content: "[" counter(comment-counter) "]";
    position: absolute;
    top: 15px;
    right: 15px;
    color: #2563eb;
    font-weight: bold;
    counter-increment: comment-counter;
  }

  .comment-author {
    font-weight: bold;
    margin-bottom: 5px;
  }

  .comment-content {
    margin-bottom: 5px;
  }

  .resolved .comment-content {
    text-decoration: line-through;
    color: #888;
  }

  .encouragement {
    background: #f0fdf4;
    border-radius: 12px;
    padding: 1rem;
    margin: 2rem 0;
    text-align: center;
    color: #166534;
  }

  /* Highlighted text styles */
  .essay-comment-mark {
    background-color: #fef3c7;
    padding: 0.1em 0;
    border-bottom: 2px solid #f59e0b;
    cursor: pointer;
    position: relative;
  }

  .comment-number {
    color: #f59e0b;
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
    vertical-align: super;
    margin-left: 4px;
  }

  /* Button Styles */
  .report-btn {
    display: inline-block;
    background-color: #1e40af;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    font-size: 1rem;
    margin-right: 0.5rem;
    margin-bottom: 1rem;
    transition: background-color 0.2s ease-in-out;
  }

  .report-btn:hover {
    background-color: #1d4ed8;
  }

  /* Hide certain elements in print */
  .no-print {
    display: inline-block;
  }
  @media print {
    body {
      background: white;
    }
    .no-print {
      display: none;
    }
  }

  /* Make these report buttons look nicer */
  .no-print-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #1e40af;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    margin-right: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
  }
  .no-print-btn:hover {
    background-color: #2563eb;
  }
  @media print {
    .no-print-btn {
      display: none;
    }
  }
</style>
`;

/**
 * Renders the final HTML to put in the new window.
 */
export const generateReportHTML = (
  essayContent: string, 
  markedEssayContent: string, 
  comments: CommentData[], 
  analysis: RubricScore[],
  wordCount: number,
  writingHero?: WritingHero // Add the writingHero parameter
): string => {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  // Calculate summary scores
  const grades = {
    overall: analysis.length > 0 
      ? parseFloat((analysis.reduce((sum, item) => sum + item.score, 0) / analysis.length).toFixed(1))
      : 0,
  };

  // Convert numeric score to letter grade
  const getLetterGrade = (score: number): string => {
    if (score >= 4.5) return 'A+';
    if (score >= 4.0) return 'A';
    if (score >= 3.5) return 'B+';
    if (score >= 3.0) return 'B';
    if (score >= 2.5) return 'C+';
    if (score >= 2.0) return 'C';
    if (score >= 1.5) return 'D+';
    if (score >= 1.0) return 'D';
    return 'F';
  };

  const letterGrade = getLetterGrade(grades.overall);
  const overallEmoji = getEmoji(grades.overall);

  // Build the analysis section
  const analysisSection = `
    ${
      analysis && analysis.length > 0 
      ? `
      <div class="analysis-section">
        <h2>Detailed Analysis</h2>
        ${analysis.map(rubric => `
          <div class="category-container">
            <div class="category-header">
              <div class="category-title">
                ${getEmoji(rubric.score)} ${rubric.category}
              </div>
              <div class="category-score">${rubric.score}/5</div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" 
                   style="width: ${(rubric.score/5)*100}%; background-color: ${getProgressBarColor(rubric.score)}">
              </div>
            </div>
            <div class="rubric-explanation">
              ${rubric.explanation.map(exp => `<p style="margin-top:0.5rem;">${exp}</p>`).join('')}
            </div>
            ${
              rubric.comments && rubric.comments.length > 0 
              ? `
                <div class="rubric-comments" style="margin-top:1rem; padding-top:1rem; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin-bottom:0.5rem; font-weight:bold; color:#1e40af;">Specific Comments</h4>
                  ${rubric.comments.map(comment => `
                    <div style="background-color:#f9fafb; padding:0.75rem; border-radius:8px; margin-bottom:0.5rem;">
                      ${comment.comment}
                    </div>
                  `).join('')}
                </div>
              `
              : ''
            }
          </div>
        `).join('')}
      </div>
      `
      : ''
    }
  `;

  // Build the writing style hero section
  const writingHeroSection = writingHero 
    ? `
      <div class="section writing-hero-section" style="margin-top: 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <h2>Your Writing Style Superhero</h2>
        
        <div class="hero-container" style="display: flex; align-items: flex-start; gap: 1.5rem; margin-top: 1rem;">
          <div class="hero-icon" style="font-size: 3.5rem; line-height: 1; background-color: white; border-radius: 50%; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${writingHero.icon}
          </div>
          
          <div class="hero-content" style="flex-grow: 1;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 0.75rem; font-size: 1.5rem;">${writingHero.name}</h3>
            <p style="margin-top: 0; margin-bottom: 1.25rem;">${writingHero.description}</p>
            
            <div class="hero-strengths" style="background-color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <h4 style="margin-top: 0; margin-bottom: 0.5rem; color: #1e40af;">Writing Strengths:</h4>
              <ul style="margin: 0; padding-left: 1.5rem;">
                ${writingHero.strengths.map(strength => `<li>${strength}</li>`).join('')}
              </ul>
            </div>
            
            <div class="hero-tips" style="background-color: white; padding: 1rem; border-radius: 8px;">
              <h4 style="margin-top: 0; margin-bottom: 0.5rem; color: #1e40af;">Tips to Improve:</h4>
              <ul style="margin: 0; padding-left: 1.5rem;">
                ${writingHero.tips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `
    : '';

  // Build the teacher comments section
  const commentsSection = `
    ${
      comments && comments.length > 0 
      ? `
      <div class="section comments-section">
        <h2>Teacher's Comments</h2>
        ${comments.map((comment, index) => {
          const commentNumber = index + 1;
          return `
            <div id="comment-${commentNumber}" class="comment-box${comment.resolved ? ' resolved' : ''}">
              ${
                comment.highlightedText
                ? `
                  <div style="font-style:italic; color:#4b5563; margin-bottom:10px; padding:8px 15px; background-color:#fffbeb; border-left:3px solid #fbbf24; border-radius:0 4px 4px 0;">
                    "<span style="background-color:rgba(251, 191, 36, 0.2); padding:2px 0;">${comment.highlightedText}</span>"
                  </div>
                `
                : ''
              }
              <div class="comment-author">Teacher noted:</div>
              <div class="comment-content">${comment.text || comment.content}</div>
              ${
                comment.resolved 
                ? '<div style="font-size: 0.8em; color: #047857; margin-top: 5px;">✓ This issue has been resolved</div>' 
                : ''
              }
              <div style="margin-top: 10px; text-align:right;">
                <a href="#top" style="font-size:0.8em; color:#2563eb; text-decoration:none;">↑ Back to essay</a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      `
      : '<p>No specific comments were added to this essay.</p>'
    }
  `;

  // The final HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Essay Evaluation Report</title>
  ${styles}
  ${teacherRevisionScript}
</head>
<body id="top" contenteditable="false">

  <!-- Buttons (no-print so they don't appear in paper version) -->
  <button id="editButton" class="no-print-btn" onclick="toggleEditMode()">
    ✏️ Edit Report
  </button>
  <button class="no-print-btn" onclick="window.print()">
    🖨️ Print Report
  </button>
  <button class="no-print-btn" onclick="updateScoreBars()">
    🔄 Recalculate Score Bars
  </button>

  <header>
    <div class="header-left">
      <h1>Essay Evaluation Report</h1>
      <div class="meta">Generated on ${dateString} • ${wordCount} words</div>
    </div>
    <div class="header-right">
      <div>
        <div class="score-value">${grades.overall.toFixed(1)}/5</div>
        <div class="grade-label">${letterGrade}</div>
      </div>
      <div class="emoji">${overallEmoji}</div>
    </div>
  </header>

  <!-- Writing Style Hero Section (NEW) -->
  ${writingHeroSection}

  <!-- Analysis section -->
  ${analysisSection}

  <!-- Essay content section -->
  <div class="essay-content">
    <h2>Essay Content</h2>
    <div>${markedEssayContent}</div>
  </div>

  <!-- Comments section -->
  ${commentsSection}

  <!-- Encouragement message -->
  <div class="encouragement">
    ${getEncouragement(grades.overall)}
  </div>

  <!-- Footer -->
  <footer style="margin-top:2rem; text-align:center;">
    <p class="meta">Generated by Flair Essay Analysis Tool</p>
  </footer>
</body>
</html>`;
};
