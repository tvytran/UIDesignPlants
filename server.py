from flask import Flask, render_template, request, session, redirect, url_for, jsonify
import json
import datetime

app = Flask(__name__)
app.secret_key = 'plant-quiz-secret'

def record_user_activity(activity_type, details=None):
    """Record user activity with timestamp"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if 'user_activity' not in session:
        session['user_activity'] = []
    
    activity = {
        'timestamp': timestamp,
        'type': activity_type,
        'details': details
    }
    
    session['user_activity'].append(activity)
    session.modified = True  # Ensure the session is saved

# Load plant data
with open('static/js/plants.json') as f:
    plants_data = json.load(f)

@app.route('/')
def home():
    if request.referrer and '/results' in request.referrer:
        session.pop('quiz_placements', None)
        session.pop('quiz_start_time', None)
    record_user_activity('page_view', 'home')
    return render_template('index.html')

@app.route('/plants')
def plants():
    record_user_activity('page_view', 'plants_list')
    return render_template('plants.html', plants=plants_data['plants'])

@app.route('/plants/<plant_id>')
def plant_detail(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        record_user_activity('plant_selection', plant_id)
        return render_template('plant-detail.html', plant=plant, plant_id=plant_id)
    else:
        return "Plant not found", 404

@app.route('/plants/<plant_id>/lighting')
def plant_lighting(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        record_user_activity('viewed_lighting', plant_id)
        return render_template('plant-lighting.html', plant=plant, plant_id=plant_id)
    else:
        return "Plant not found", 404

@app.route('/plants/<plant_id>/facts')
def plant_facts(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        record_user_activity('viewed_facts', plant_id)
        return render_template('plant-facts.html', plant=plant, plant_id=plant_id)
    else:
        return "Plant not found", 404

#Quiz routes 
@app.route('/quiz/<int:question_num>')
def quiz(question_num):
    with open('static/js/quiz.json') as f:
        quiz_data = json.load(f)['questions']

    if question_num > len(quiz_data):
        return redirect(url_for('results'))

    question = quiz_data[question_num - 1]
    return render_template('quiz.html', question=question, question_num=question_num)

@app.route('/submit-plant', methods=['POST'])
def submit_plant():
    data = request.get_json()
    plant = data['plant']
    zone = data['zone']

    with open('static/js/quiz.json') as f:
        quiz_data = json.load(f)['questions']

    correct_zone = next(q['correct_zone'] for q in quiz_data if q['plant'] == plant)
    is_correct = zone == correct_zone

    if 'quiz_placements' not in session:
        session['quiz_placements'] = []

    session['quiz_placements'].append({
        'plant': plant,
        'zone': zone,
        'correct_zone': correct_zone,
        'correct': is_correct
    })

    session.modified = True
    return jsonify({'next_url': url_for('quiz', question_num=len(session['quiz_placements']) + 1)})

@app.route('/results')
def results():
    placements = session.get('quiz_placements', [])
    correct = sum(1 for p in placements if p['correct'])
    total = len(placements)
    return render_template('result.html', placements=placements, score=correct, total=total)

@app.route('/reset-quiz')
def reset_quiz():
    session.pop('quiz_placements', None)
    session.pop('quiz_start_time', None)
    return redirect(url_for('quiz', question_num=1))
#quiz


@app.route('/activity-history')
def activity_history():
    activities = session.get('user_activity', [])
    return render_template('activity-history.html', activities=activities)

@app.route('/try_youorself')
def try_yourself():
    return "Coming Soon"
    


if __name__ == '__main__':
    app.run(debug=True, port=5001)