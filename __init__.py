from flask import Flask, render_template, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import requests
from xml.etree import ElementTree

# Initialize Flask app
app = Flask(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('scholarlyinsight-paperpulse-firebase-adminsdk-fbsvc-ef33a94495.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# ArXiv API base URL
ARXIV_API_URL = "http://export.arxiv.org/api/query"

# Home route
@app.route('/')
def index():
    return render_template('index.html')

# Search route
@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('search_query', default='', type=str)
    max_results = request.args.get('max_results', default=10, type=int)

    params = {
        'search_query': query,
        'start': 0,
        'max_results': max_results,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending'
    }

    try:
        response = requests.get(ARXIV_API_URL, params=params)
        articles = parse_arxiv_response(response.text)
        return jsonify(articles)
    except Exception as e:
        print(f"Error fetching from arXiv: {e}")
        return jsonify([])

# Helper function to parse arXiv API XML response
def parse_arxiv_response(xml_response):
    articles = []
    root = ElementTree.fromstring(xml_response)

    for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
        title = entry.find('{http://www.w3.org/2005/Atom}title').text.strip()
        link = entry.find('{http://www.w3.org/2005/Atom}id').text.strip()
        authors = [author.find('{http://www.w3.org/2005/Atom}name').text.strip() for author in entry.findall('{http://www.w3.org/2005/Atom}author')]
        summary = entry.find('{http://www.w3.org/2005/Atom}summary').text.strip()

        articles.append({
            'title': title,
            'link': link,
            'authors': authors,
            'summary': summary
        })

    return articles

# Run app if executed directly
if __name__ == '__main__':
    app.run(debug=True)
