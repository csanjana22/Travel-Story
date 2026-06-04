import requests
import os
import json

def validate_inputs(days, budget):
    try:
        return int(days), float(budget)
    except ValueError:
        return None, None

def save_itinerary(destination, content):
    filename = f"{destination}_plan.pdf"
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(json.dumps(content, indent=4))
        return f"Successfully saved to {filename}"
    except Exception as e:
        return f"Error saving file: {e}"