import requests
import json

# Try to fetch current stock to get a sense if backend is up
try:
    resp = requests.get('http://127.0.0.1:8000/feed/stock')
    print("Stock endpoint:", resp.status_code, resp.text)
except Exception as e:
    print(e)
