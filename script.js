let questions = [];
let userAnswers = {};

// ---- Theme Toggle ----
function toggleTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// ---- Input Controls ----
function clearInput() {
  document.getElementById('inputText').value = '';
  document.getElementById('parseInfo').textContent = '';
}

function loadDemo() {
  document.getElementById('inputText').value = `**Question 1:**
What is the purpose of the MST (Multiport Service Terminal)?
* It provides a special splice tray for optical splitters.
* It is located just after the fiber node to allow special services to be deployed.
* **It provides access to connect fiber-optic cable drops from the customer premises to the network.**
* It is required on large fiber counts to split the network.

**Question 2:**
Which layer of the OSI model is responsible for routing packets?
* Layer 2 – Data Link
* **Layer 3 – Network**
* Layer 4 – Transport
* Layer 5 – Session

**Question 3:**
What does DNS stand for?
* **Domain Name System**
* Dynamic Network Service
* Data Node Synchronization
* Distributed Naming Schema

**Question 4:**
Which protocol is used to send email?
* FTP
* HTTP
* IMAP
* **SMTP**`;
  document.getElementById('parseInfo').textContent = '';
}

// ---- Parse & Start ----
function parseAndStart() {
  const raw = document.getElementById('inputText').value.trim();
  const info = document.getElementById('parseInfo');
  if (!raw) {
    info.textContent = 'Please paste some questions first.';
    info.className = 'parse-info error';
    return;
  }

  questions = [];
  const blocks = raw.split(/\n(?=\*\*Question\s*\d+)/i).map(b => b.trim()).filter(Boolean);
  const toProcess = blocks.length > 0 ? blocks : raw.split(/\n\s*\n/).filter(Boolean);

  for (const block of toProcess) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let qStart = 0;
    let qText = '';
    if (/^\*\*Question\s*\d+[:.]?\*\*/i.test(lines[0])) {
      qStart = 1;
    }

    let i = qStart;
    while (i < lines.length && !lines[i].startsWith('*')) {
      qText += (qText ? ' ' : '') + lines[i].replace(/^\*\*|\*\*$/g, '');
      i++;
    }
    if (!qText) continue;

    const answers = [];
    let correctIdx = -1;
    let ansCount = 0;
    while (i < lines.length && ansCount < 4) {
      const line = lines[i];
      if (line.startsWith('* ')) {
        const content = line.replace(/^\*\s*/, '');
        const isCorrect = /^\*\*.*\*\*$/.test(content);
        const text = content.replace(/^\*\*|\*\*$/g, '').trim();
        if (isCorrect) correctIdx = ansCount;
        answers.push(text);
        ansCount++;
      }
      i++;
    }

    if (answers.length >= 2 && correctIdx !== -1) {
      questions.push({ text: qText.trim(), answers, correctIdx });
    }
  }

  if (questions.length === 0) {
    info.textContent = 'Could not parse any questions. Check the format and try again.';
    info.className = 'parse-info error';
    return;
  }

  info.textContent = `✓ Parsed ${questions.length} question${questions.length > 1 ? 's' : ''} successfully!`;
  info.className = 'parse-info success';

  userAnswers = {};
  renderQuiz();
}

// ---- Render Quiz ----
function renderQuiz() {
  document.getElementById('import-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('quiz-section').style.display = 'block';

  const container = document.getElementById('quiz-questions');
  container.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  questions.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
      <div class="question-counter">Question ${qi + 1} of ${questions.length}</div>
      <div class="question-text">${escHtml(q.text)}</div>
      <div class="answers-grid" id="answers-${qi}">
        ${q.answers.map((a, ai) => `
          <button class="answer-btn" id="ans-${qi}-${ai}" onclick="selectAnswer(${qi},${ai})">
            <span class="answer-letter">${letters[ai]}</span>
            <span>${escHtml(a)}</span>
          </button>`).join('')}
      </div>
      <div class="feedback" id="fb-${qi}"></div>
    `;
    container.appendChild(card);
  });

  updateProgress();
}

// ---- Answer Selection ----
function selectAnswer(qi, ai) {
  const q = questions[qi];
  const btns = document.querySelectorAll(`#answers-${qi} .answer-btn`);
  btns.forEach(b => b.disabled = true);

  userAnswers[qi] = ai;
  const isCorrect = ai === q.correctIdx;

  btns[ai].classList.add(isCorrect ? 'correct' : 'incorrect');
  if (!isCorrect) btns[q.correctIdx].classList.add('reveal-correct');

  const fb = document.getElementById(`fb-${qi}`);
  fb.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  fb.textContent = isCorrect
    ? '✓ Correct!'
    : `✗ Incorrect. The correct answer is: ${q.answers[q.correctIdx]}`;

  updateProgress();
}

function updateProgress() {
  const answered = Object.keys(userAnswers).length;
  document.getElementById('progressFill').style.width = `${(answered / questions.length) * 100}%`;
}

// ---- Submit ----
function submitQuiz() {
  const answered = Object.keys(userAnswers).length;
  if (answered < questions.length) {
    const remaining = questions.length - answered;
    if (!confirm(`You have ${remaining} unanswered question${remaining > 1 ? 's' : ''}. Submit anyway?`)) return;
  }
  showResults();
}

// ---- Results ----
function showResults() {
  document.getElementById('quiz-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';

  let correct = 0;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  questions.forEach((q, qi) => {
    if (userAnswers[qi] === q.correctIdx) correct++;
  });

  const pct = Math.round((correct / questions.length) * 100);
  document.getElementById('scorePct').textContent = pct + '%';
  document.getElementById('scoreDetail').textContent = `${correct} correct out of ${questions.length} questions`;

  const list = document.getElementById('resultsList');
  list.innerHTML = '';

  questions.forEach((q, qi) => {
    const chosen = userAnswers[qi];
    const isCorrect = chosen === q.correctIdx;
    const item = document.createElement('div');
    item.className = `result-item ${isCorrect ? 'correct-item' : 'incorrect-item'}`;

    let detail = '';
    if (isCorrect) {
      detail = `<div class="result-detail">Your answer: <span class="correct-ans">${letters[chosen]}. ${escHtml(q.answers[chosen])}</span></div>`;
    } else {
      const yourAns = chosen !== undefined
        ? `<span class="wrong-ans">${letters[chosen]}. ${escHtml(q.answers[chosen])}</span>`
        : '<span class="wrong-ans">No answer</span>';
      detail = `<div class="result-detail">Your answer: ${yourAns}<br>Correct answer: <span class="correct-ans">${letters[q.correctIdx]}. ${escHtml(q.answers[q.correctIdx])}</span></div>`;
    }

    item.innerHTML = `
      <div class="result-q">
        <span class="result-tag">${isCorrect ? '✓ Correct' : '✗ Wrong'}</span>
        <span>Q${qi + 1}: ${escHtml(q.text)}</span>
      </div>
      ${detail}
    `;
    list.appendChild(item);
  });
}

// ---- Navigation ----
function retake() {
  userAnswers = {};
  renderQuiz();
}

function backToImport() {
  document.getElementById('quiz-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('import-section').style.display = 'block';
}

// ---- Helpers ----
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
