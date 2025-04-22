from flask import Flask, render_template
import json

app = Flask(__name__)


# Load plant data
with open('static/js/plants.json') as f:
    plants_data = json.load(f)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/plants')
def plants():
    return render_template('plants.html', plants=plants_data['plants'])

@app.route('/plants/<plant_id>')
def plant_detail(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        return render_template('plant-detail.html', plant=plant, plant_id=plant_id)
    else:
        return "Plant not found", 404

@app.route('/plants/<plant_id>/lighting')
def plant_lighting(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        return render_template('plant-lighting.html', plant=plant, plant_id=plant_id)
    else:
        return "Plant not found", 404

@app.route('/plants/<plant_id>/facts')
def plant_facts(plant_id):
    if plant_id in plants_data['plants']:
        plant = plants_data['plants'][plant_id]
        return render_template('plant-facts.html', plant=plant, plant_id=plant_id)
    else:
        return "Plant not found", 404

@app.route('/try_youorself')
def try_yourself():
    return "Coming Soon"
    


if __name__ == '__main__':
    app.run(debug=True, port=5001)