import urllib.request
from xml.etree import ElementTree
import requests
from flask import Flask, jsonify, render_template, request
import urllib, urllib.request
import feedparser

app = Flask(__name__)
# app.static_folder = 'static'

# arXiv API base URL
ARXIV_API_URL = "http://export.arxiv.org/api/query?"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['GET','POST'])
def search():
    query = request.args.get('query', type=str)
    max_results = request.args.get('max_results', default=5, type=int)
    target = ""
    if request.method == 'POST':
        target = request.form["search-query"]
    if not target:
        target = "None"

    params = [
        'search_query=' + f'all:{target}',
        'start=' + f'{0}',
        'max_results='+ f'{max_results}',
        'sortBy=submittedDate',
        'sortOrder=descending'
    ]

    url = 'http://export.arxiv.org/api/query?' + '&'.join(params)
    data = urllib.request.urlopen(url)

    feed = feedparser.parse(data)
    results = {}
    for i in range(max_results):
        results.setdefault(i, {})
    count = 0

    for entry in feed.entries:
        #Can add any info if needed
        title = entry.title
        results[count].setdefault("title",title)

        authors = ', '.join(author.name for author in entry.authors)
        results[count].setdefault("authors", authors)

        summary = entry.summary
        results[count].setdefault("summary",summary)

        link = entry.id
        results[count].setdefault("link",link)

        published = entry.published
        results[count].setdefault("published", published)

        count+=1
    return render_template("search.html", articles = results,start = 0)

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