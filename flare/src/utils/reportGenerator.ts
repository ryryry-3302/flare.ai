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

interface ReportGeneratorOptions {
  essayContent: string;
  comments: any[]; // Replace with your actual comment type
  wordCount: number;
  analysis?: RubricScore[]; // Optional to maintain backward compatibility
}

export const generateReport = (options: ReportGeneratorOptions): Window | null => {
  const { essayContent, comments, wordCount, analysis = [] } = options;
  
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
  const reportHTML = generateReportHTML(essayContent, markedEssayContent, comments, analysis, wordCount);

  // Write the report content to the new window
  reportWindow.document.write(reportHTML);
  reportWindow.document.close();
  
  return reportWindow;
};

export const generateReportHTML = (
  essayContent: string, 
  markedEssayContent: string, 
  comments: any[], 
  analysis: RubricScore[],
  wordCount: number
): string => {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  // Calculate grades from analysis
  const grades = {
    overall: 0,
    content: 0,
    organization: 0,
    voice: 0,
    wordChoice: 0,
    fluency: 0,
    conventions: 0
  };
  
  if (analysis && analysis.length) {
    // Map categories to our grade properties
    analysis.forEach(rubric => {
      switch(rubric.category) {
        case "Content (Ideas and Development)":
          grades.content = rubric.score;
          break;
        case "Structure (Organization)":
          grades.organization = rubric.score;
          break;
        case "Stance (Voice and Tone)":
          grades.voice = rubric.score;
          break;
        case "Word Choice (Diction)":
          grades.wordChoice = rubric.score;
          break;
        case "Sentence Fluency":
          grades.fluency = rubric.score;
          break;
        case "Conventions":
          grades.conventions = rubric.score;
          break;
      }
    });
    
    // Calculate overall score
    const totalScore = Object.values(grades).reduce((a, b) => a + b, 0);
    const validScores = Object.values(grades).filter(score => score > 0).length;
    grades.overall = parseFloat((totalScore / (validScores || 1)).toFixed(1));
  } else {
    // Fallback to random scores if no analysis is provided
    // This maintains backward compatibility
    const generateScore = () => Math.floor(Math.random() * 3) + 3; // 3-5 range
    grades.content = generateScore();
    grades.organization = generateScore();
    grades.voice = generateScore();
    grades.wordChoice = generateScore();
    grades.fluency = generateScore();
    grades.conventions = generateScore();
    grades.overall = parseFloat(((
      grades.content + 
      grades.organization + 
      grades.voice + 
      grades.wordChoice + 
      grades.fluency + 
      grades.conventions
    ) / 6).toFixed(1));
  }
  
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

  // Return the complete HTML for the report
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Essay Evaluation Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }
    h1 {
      margin-bottom: 0.5rem;
      color: #2563eb;
    }
    .meta {
      color: #666;
      font-size: 0.9rem;
    }
    .scores {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .score-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .score-card h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: #4b5563;
    }
    .score-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #1f2937;
    }
    .overall {
      grid-column: span 2;
      background: #eff6ff;
      border: 1px solid #dbeafe;
    }
    .overall .score-value {
      color: #2563eb;
      font-size: 2.2rem;
    }
    .essay-content {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .comments-section {
      margin: 2rem 0;
    }
    .comment-item {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .comment-label {
      font-weight: 600;
      color: #2563eb;
    }
    .comment-text {
      margin: 0.5rem 0 0;
    }
    .essay-comment-mark {
      background-color: rgba(37, 99, 235, 0.1);
      border-bottom: 2px solid #2563eb;
      position: relative;
    }
    .comment-number {
      color: #2563eb;
      font-size: 0.8rem;
      font-weight: bold;
      vertical-align: super;
      text-decoration: none;
      margin-left: 2px;
    }
    .analysis-section {
      margin: 2rem 0;
    }
    .rubric-item {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
    }
    .rubric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .rubric-category {
      font-weight: 600;
      color: #4b5563;
    }
    .rubric-score {
      font-weight: bold;
      color: #2563eb;
    }
    .rubric-explanation {
      margin: 0.5rem 0;
      font-size: 0.95rem;
    }
    .rubric-comments {
      margin-top: 1rem;
      font-size: 0.9rem;
    }
    .rubric-comment-item {
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: rgba(37, 99, 235, 0.05);
      border-radius: 4px;
    }
    @media print {
      body {
        padding: 0;
        font-size: 11pt;
      }
      .score-card, .essay-content, .comment-item, .rubric-item {
        box-shadow: none;
        border: 1px solid #ddd;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>Essay Evaluation Report</h1>
    <div class="meta">Generated on ${dateString} • ${wordCount} words</div>
  </header>

  <!-- Scores section -->
  <div class="scores">
    <div class="score-card overall">
      <h3>Overall Score</h3>
      <div class="score-value">${grades.overall}/5 <span style="font-size: 1rem; color: #6b7280;">(${getLetterGrade(grades.overall)})</span></div>
    </div>
    ${grades.content ? `
    <div class="score-card">
      <h3>Content & Ideas</h3>
      <div class="score-value">${grades.content}/5</div>
    </div>
    ` : ''}
    ${grades.organization ? `
    <div class="score-card">
      <h3>Organization</h3>
      <div class="score-value">${grades.organization}/5</div>
    </div>
    ` : ''}
    ${grades.voice ? `
    <div class="score-card">
      <h3>Voice & Tone</h3>
      <div class="score-value">${grades.voice}/5</div>
    </div>
    ` : ''}
    ${grades.wordChoice ? `
    <div class="score-card">
      <h3>Word Choice</h3>
      <div class="score-value">${grades.wordChoice}/5</div>
    </div>
    ` : ''}
    ${grades.fluency ? `
    <div class="score-card">
      <h3>Sentence Fluency</h3>
      <div class="score-value">${grades.fluency}/5</div>
    </div>
    ` : ''}
    ${grades.conventions ? `
    <div class="score-card">
      <h3>Conventions</h3>
      <div class="score-value">${grades.conventions}/5</div>
    </div>
    ` : ''}
  </div>

  <!-- Analysis section -->
  ${analysis && analysis.length > 0 ? `
  <div class="analysis-section">
    <h2>Detailed Analysis</h2>
    ${analysis.map(rubric => `
      <div class="rubric-item">
        <div class="rubric-header">
          <div class="rubric-category">${rubric.category}</div>
          <div class="rubric-score">${rubric.score}/5</div>
        </div>
        <div class="rubric-explanation">
          ${rubric.explanation.map(exp => `<p>${exp}</p>`).join('')}
        </div>
        ${rubric.comments && rubric.comments.length > 0 ? `
          <div class="rubric-comments">
            <h4>Specific Comments</h4>
            ${rubric.comments.map(comment => `
              <div class="rubric-comment-item">${comment.comment}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Essay content section -->
  <div class="essay-content">
    <h2>Essay Content</h2>
    <div>${markedEssayContent}</div>
  </div>

  <!-- Teacher comments section -->
  ${comments && comments.length > 0 ? `
  <div class="comments-section">
    <h2>Teacher Comments</h2>
    ${comments.map((comment, index) => `
      <div class="comment-item" id="comment-${index + 1}">
        <div class="comment-label">Comment #${index + 1}</div>
        <p class="comment-text">${comment.text}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Footer -->
  <footer>
    <p class="meta">Generated by Flair Essay Analysis Tool</p>
    <button class="no-print" onclick="window.print()">Print Report</button>
  </footer>
</body>
</html>`;
};