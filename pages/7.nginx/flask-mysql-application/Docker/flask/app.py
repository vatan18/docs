import os
from flask import Flask, render_template, request, redirect, url_for
from flask_mysqldb import MySQL

app = Flask(__name__)

# Configure MySQL connection parameters
app.config['MYSQL_HOST'] = '172.17.0.1'
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER', 'admin')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD', 'Keepitupn0w@')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DB', 'myDb')
app.config['MYSQL_PORT'] = int(os.environ.get('MYSQL_PORT', 3306))

# Initialize MySQL
mysql = MySQL(app)

@app.route('/')
def hello():
    cur = mysql.connection.cursor()
    cur.execute('SELECT message FROM messages')
    messages = cur.fetchall()
    cur.close()
    return render_template('index.html', messages=messages)

@app.route('/submit', methods=['POST'])
def submit():
    new_message = request.form.get('new_message')
    cur = mysql.connection.cursor()
    cur.execute('INSERT INTO messages (message) VALUES (%s)', [new_message])
    mysql.connection.commit()
    cur.close()
    return redirect(url_for('hello'))
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

