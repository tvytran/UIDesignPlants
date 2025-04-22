from flask import Flask 
from flask import render_template 
from flask import Response, request, jsonify
app = Flask(__name__) 



@app.route("/")
def home(): 
    return render_template("home.html")


@app.route("/learn/<int:lesson>")
def learn(lesson): 
    return render_template("learn.html", lesson=lesson)


@app.route("/quiz/<int:question>")
def quiz(question): 
    return render_template("quiz.html", question=question)

@app.route("/results")
def results():
    return render_template("result.html") 

if __name__ == 'main':
    app.run(debug = True, port=5001)