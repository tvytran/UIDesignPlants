from flask import Flask, render_template, request, session, redirect, url_for
import json
import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

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
    
@app.route('/activity-history')
def activity_history():
    activities = session.get('user_activity', [])
    return render_template('activity-history.html', activities=activities)

@app.route('/try_youorself')
def try_yourself():
    return "Coming Soon"
    


if __name__ == '__main__':
    app.run(debug=True, port=5001)