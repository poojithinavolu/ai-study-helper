from flask import Flask, request, render_template, jsonify
from transformers import pipeline
import random

app = Flask(__name__)

# Pipelines
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
qa_pipeline = pipeline("question-answering", model="bert-large-uncased-whole-word-masking-finetuned-squad")

# Generate 5 MCQs by masking a keyword and add contextual explanations
def generate_quiz(text):
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    quiz = []
    for sent in sentences[:5]:  # Only top 5
        words = [w for w in sent.split() if w.isalpha() and len(w) > 3]
        if not words:
            continue
        answer = random.choice(words)
        question = sent.replace(answer, '_____') + ' ?'
        distractors = random.sample([w for w in words if w != answer], min(3, len(words)-1))
        options = distractors + [answer]
        random.shuffle(options)
        explanation = (
            f"The complete sentence was: \"{sent}.\"\n"
            f"The missing word is '{answer}', which fits the context because it preserves the original meaning."
        )
        quiz.append({
            'question': question,
            'options': options,
            'answer': answer,
            'explanation': explanation
        })
    return quiz

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    text = request.form['learning_material']
    summary = summarizer(text, max_length=150, min_length=50, do_sample=False)[0]['summary_text']
    quiz = generate_quiz(text)
    return jsonify({ 'summary': summary, 'quiz': quiz })

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get('question')
    context = data.get('context')
    if not question or not context:
        return jsonify({ 'answer': 'Invalid request' }), 400

    # Add a persona as a prepended statement
    persona_prompt = "You are a kind and helpful teacher. Answer the following question based on the material below:\n\n"
    modified_context = persona_prompt + context

    result = qa_pipeline({
        'question': question,
        'context': modified_context
    })

    return jsonify({ 'answer': result['answer'] })


if __name__ == '__main__':
    app.run(debug=True)