from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins

def get_watch_server(episode_url):
    """Scrape the streaming URL from the episode page."""
    try:
        print(f"Fetching URL: {episode_url}")  # Debugging
        response = requests.get(episode_url)
        response.raise_for_status()  # Raise an error for bad responses
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Locate the ul containing the watch servers
        watch_servers_ul = soup.find('ul', class_='WatchServersList')
        if watch_servers_ul is None:
            return None
        
        # Find the MyCimaServer li and extract the data-url attribute
        mycima_server_tag = watch_servers_ul.find('li', class_='MyCimaServer')
        if mycima_server_tag:
            server_url = mycima_server_tag.find('btn').get('data-url')
            return {'watch_server': server_url}
        return None
    
    except requests.RequestException as req_err:
        print(f"Request error: {req_err}")  # Debugging
        return None
    except Exception as e:
        print(f"Error during scraping: {e}")  # Debugging
        return None

@app.route('/get_watch_server', methods=['GET'])
def get_watch_server_info():
    """API endpoint to retrieve the watch server URL."""
    episode_url = request.args.get('episode_url')
    
    print(f"Received request with episode_url: {episode_url}")  # Debugging
    
    if not episode_url:
        return jsonify({"error": "Missing episode_url parameter"}), 400

    try:
        # Scrape the watch server from the provided episode URL
        watch_server = get_watch_server(episode_url)
        
        if watch_server:
            return jsonify({"watch_server": watch_server['watch_server']})
        else:
            return jsonify({"error": "Watch server URL not found"}), 404
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

