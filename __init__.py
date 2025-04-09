from xml.etree import ElementTree
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
# app.static_folder = 'static'

# arXiv API base URL
ARXIV_API_URL = "http://export.arxiv.org/api/query?"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query', type=str)
    max_results = request.args.get('max_results', default=5, type=int)

    # Construct arXiv API query
    params = {
        'search_query': f'all:{query}',
        'start': 0,
        'max_results': max_results,
        'sortBy': 'submittedDate',
        'sortOrder': 'descending'
    }

    response = requests.get(ARXIV_API_URL, params=params)
    articles = parse_arxiv_data(response.text)

    return jsonify(articles)

# Parse the XML response
def parse_arxiv_data(xml_data):   
    root = ElementTree.fromstring(xml_data)
    articles = []
    
    for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
        title = entry.find('{http://www.w3.org/2005/Atom}title').text
        summary = entry.find('{http://www.w3.org/2005/Atom}summary').text
        authors = [author.find('{http://www.w3.org/2005/Atom}name').text for author in entry.findall('{http://www.w3.org/2005/Atom}author')]
        link = entry.find('{http://www.w3.org/2005/Atom}id').text
        
        articles.append({
            'title': title,
            'summary': summary,
            'authors': authors,
            'link': link
        })
    
    return articles

if __name__ == '__main__':
    app.run(debug=True)