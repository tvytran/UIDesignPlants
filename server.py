from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/plants')
def plants():
    return render_template('plants.html')



@app.route('/plants/snake-plant')
def snake_plant():
    return render_template('snake-plant.html')

@app.route('/plants/snake-plant/lighting')
def snake_lighting():
    return render_template('snake-plant-lighting.html')

@app.route('/try-yourself')
def try_yourself():
    # Placeholder for now
    return "This feature is coming soon!"

@app.route('/plants/snake-plant/facts')
def snake_facts():
    return render_template('snake-facts.html')




@app.route('/plants/peace-lily')
def peace_lily():
    return render_template('peace-lily.html')

@app.route('/plants/peace-lily/lighting')
def peace_lily_lighting():
    return render_template('peace-lily-lighting.html')



@app.route('/plant/peace-lily-facts/facts')
def peace_lily_facts():
    return render_template('peace-lily-facts.html')





@app.route('/plants/spider-lily')
def spider_lily():
    return render_template('spider-lily.html')

@app.route('/plants/fiddle-leaf-fig')
def fiddle_leaf_fig():
    return render_template('fiddle-leaf-fig.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001)