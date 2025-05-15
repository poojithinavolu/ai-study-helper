const analyzeBtn = document.getElementById('analyzeBtn');
const optionsDiv = document.getElementById('options');
let currentText = '';
let quizData = [];

analyzeBtn.onclick = () => {
  const text = document.getElementById('learningMaterial').value.trim();
  if (!text) return;
  currentText = text;
  fetch('/analyze', {
    method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: `learning_material=${encodeURIComponent(text)}`
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById('summaryText').innerText = data.summary;
    quizData = data.quiz;
    optionsDiv.classList.remove('hidden');
  });
};

// Summary modal logic
const summaryModal = document.getElementById('summaryModal');
const closeModal = document.querySelector('.modal .close');
document.getElementById('readSummary').onclick = () => summaryModal.classList.remove('hidden');
closeModal.onclick = () => summaryModal.classList.add('hidden');

// Ask questions logic
const qaSection = document.getElementById('qaSection');
document.getElementById('askQuestions').onclick = () => qaSection.classList.remove('hidden');

document.getElementById('qaSend').onclick = () => {
  const q = document.getElementById('qaInput').value;
  if (!q) return;
  const log = document.getElementById('qaLog');
  log.innerHTML += `<p><strong>You:</strong> ${q}</p>`;
  fetch('/ask', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({question: q, context: currentText})
  })
  .then(res => res.json())
  .then(d => { log.innerHTML += `<p><strong>AI:</strong> ${d.answer}</p>`; });
};

// Quiz logic with detailed explanations
document.getElementById('practiceQuiz').onclick = () => {
  const quizSection = document.getElementById('quizSection');
  const quizForm = document.getElementById('quizForm');
  quizSection.classList.remove('hidden');
  quizForm.innerHTML = '';
  quizData.forEach((q,i) => {
    let html = `<div class="quiz-item"><p>${i+1}. ${q.question}</p>`;
    q.options.forEach(opt => {
      html += `<label><input type="radio" name="q${i}" value="${opt}"> ${opt}</label><br>`;
    });
    html += `</div>`;
    quizForm.innerHTML += html;
  });
};

document.getElementById('submitQuiz').onclick = () => {
  let score = 0;
  let resultsHTML = '';
  quizData.forEach((q,i) => {
    const selected = document.querySelector(`input[name=q${i}]:checked`);
    const userAns = selected ? selected.value : 'No answer';
    const correct = q.answer;
    const explanation = q.explanation;
    const isCorrect = userAns === correct;
    if (isCorrect) score++;
    resultsHTML += `<div class="result-item"><p><strong>Q${i+1}.</strong> ${q.question}</p>`;
    resultsHTML += `<p>Your answer: ${userAns}</p>`;
    resultsHTML += `<p>Correct answer: ${correct}</p>`;
    resultsHTML += `<p>Explanation: ${explanation}</p></div><hr>`;
  });
  document.getElementById('quizResult').innerHTML = `<h3>Your score: ${score} / ${quizData.length}</h3>` + resultsHTML;
};