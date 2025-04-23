from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import unquote

app = Flask(__name__)
CORS(app)

def get_watch_server(movie_url):
    """Scrape the watch server URL from the movie page."""
    try:
        print(f"Fetching movie URL: {movie_url}")
        response = requests.get(movie_url)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        watch_servers_ul = soup.find('ul', class_='WatchServersList')
        if watch_servers_ul is None:
            return None

        mycima_server_tag = watch_servers_ul.find('li', class_='MyCimaServer')
        if mycima_server_tag:
            server_url = mycima_server_tag.find('btn').get('data-url')
            return {'watch_server': server_url}
        return None

    except requests.RequestException as req_err:
        print(f"Request error: {req_err}")
        return None
    except Exception as e:
        print(f"Scraping error: {e}")
        return None

@app.route('/get_watch_server', methods=['GET'])
def get_watch_server_info():
    """API endpoint to retrieve the watch server URL."""
    movie_url = request.args.get('url')
    print(f"Received request with url: {movie_url}")

    if not movie_url:
        return jsonify({"error": "Missing url parameter"}), 400

    movie_url = unquote(movie_url)
    print(f"Decoded movie URL: {movie_url}")

    try:
        watch_server = get_watch_server(movie_url)

        if watch_server:
            # ✅ Wrap the response so the frontend receives it correctly
            return jsonify({"watch_server_url": watch_server})
        else:
            return jsonify({"error": "Watch server URL not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
