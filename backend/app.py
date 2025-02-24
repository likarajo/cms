from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# MySQL Configuration
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'db')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'rootpassword')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'testdb')


@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Content Management System API Server"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
