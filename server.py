from flask import Flask, render_template, request, session, redirect, url_for, jsonify
import json
import datetime
import os

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

def save_quiz_result(result_data):
    """Save quiz result to a JSON file"""
    results_file = 'static/js/quiz_results.json'
    
    # Load existing results if file exists
    if os.path.exists(results_file):
        with open(results_file, 'r') as f:
            try:
                results = json.load(f)
            except json.JSONDecodeError:
                results = []
    else:
        results = []
    
    # Add new result with timestamp
    result_data['timestamp'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    results.append(result_data)
    
    # Save updated results
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)

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
    processed_plants = {}
    for plant_id, plant_details in plants_data['plants'].items():
        # Deep copy to avoid modifying the original data if it's used elsewhere
        current_plant = plant_details.copy() 
        # Add the id into the plant's dictionary
        current_plant['id'] = plant_id 
        # Create a short description (e.g., first 100 chars of description)
        description = current_plant.get('description', '')
        # Ensure facts is a list, default to empty list if missing
        current_plant['facts'] = current_plant.get('facts', []) 
        # Ensure scientific_name exists, default to empty string if missing
        current_plant['scientific_name'] = current_plant.get('scientific_name', '') 
        
        current_plant['short_description'] = (description[:100] + '...') if len(description) > 100 else description
        processed_plants[plant_id] = current_plant
        
    record_user_activity('page_view', 'plants_list')
    # Pass the processed dictionary to the template
    return render_template('plants.html', plants=processed_plants) 

@app.route('/plants/<plant_id>')
def plant_detail(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        
        # Get list of all plant IDs for navigation
        plant_ids = list(plants_data['plants'].keys())
        current_index = plant_ids.index(plant_id)
        
        # Get previous and next plant IDs
        prev_plant = None
        next_plant = None
        
        if current_index > 0:
            prev_plant_id = plant_ids[current_index - 1]
            prev_plant = {
                'id': prev_plant_id,
                'name': plants_data['plants'][prev_plant_id]['name']
            }
            
        if current_index < len(plant_ids) - 1:
            next_plant_id = plant_ids[current_index + 1]
            next_plant = {
                'id': next_plant_id,
                'name': plants_data['plants'][next_plant_id]['name']
            }
        
        # Load quiz data to find the correct zone for this plant
        correct_zone = None
        try:
            with open('static/js/quiz.json') as f:
                quiz_questions = json.load(f)['questions']
                question_data = next((q for q in quiz_questions if q['plant'] == plant_id), None)
                if question_data:
                    correct_zone = question_data['correct_zone']
        except FileNotFoundError:
            print(f"Warning: static/js/quiz.json not found.")
        except Exception as e:
             print(f"Error loading or parsing quiz.json in plant_detail: {e}")

        record_user_activity('plant_selection', plant_id)
        
        # Ensure the plant dictionary passed to detail also has necessary fields
        plant_details = plants_data['plants'][plant_id].copy()
        plant_details['id'] = plant_id # Ensure ID is present
        plant_details['facts'] = plant_details.get('facts', []) # Ensure facts list exists
        plant_details['scientific_name'] = plant_details.get('scientific_name', '') # Ensure scientific name exists

        # Pass all necessary data to the single detail template
        return render_template('plant-detail.html', 
                               plant=plant_details,
                               plant_id=plant_id, 
                               correct_zone=correct_zone,
                               prev_plant=prev_plant,
                               next_plant=next_plant)
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
    try:
        data = request.get_json()
        if not data or 'plant' not in data or 'zone' not in data:
            return jsonify({'error': 'Invalid data'}), 400

        plant = data['plant']
        zone = data['zone']
        time_spent = data.get('time_spent', 0)

        with open('static/js/quiz.json') as f:
            quiz_data = json.load(f)['questions']

        # Find the correct zone for this plant
        correct_zone = None
        for q in quiz_data:
            if q['plant'] == plant:
                correct_zone = q['correct_zone']
                break

        if not correct_zone:
            return jsonify({'error': 'Plant not found in quiz data'}), 400

        is_correct = zone == correct_zone

        # Initialize session variables if they don't exist
        if 'quiz_placements' not in session:
            session['quiz_placements'] = []
        if 'question_times' not in session:
            session['question_times'] = []

        # Add the placement
        session['quiz_placements'].append({
            'plant': plant,
            'zone': zone,
            'correct_zone': correct_zone,
            'correct': is_correct
        })
        
        # Add the time
        session['question_times'].append({
            'question': len(session['quiz_placements']),
            'time': time_spent
        })

        session.modified = True

        # Check if we've reached the end of the quiz
        next_question = len(session['quiz_placements']) + 1
        if next_question > len(quiz_data):
            # Save the complete quiz result
            result_data = {
                'placements': session['quiz_placements'],
                'times': session['question_times'],
                'score': sum(1 for p in session['quiz_placements'] if p['correct']),
                'total': len(session['quiz_placements'])
            }
            save_quiz_result(result_data)
            return jsonify({'next_url': url_for('results')})
        else:
            return jsonify({'next_url': url_for('quiz', question_num=next_question)})
    except Exception as e:
        print(f"Error in submit_plant: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/results')
def results():
    placements = session.get('quiz_placements', [])
    correct = sum(1 for p in placements if p['correct'])
    total = len(placements)
    
    # Get question times from session
    question_times = session.get('question_times', [])
    
    return render_template('result.html', 
                         placements=placements, 
                         score=correct, 
                         total=total,
                         question_times=question_times)

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