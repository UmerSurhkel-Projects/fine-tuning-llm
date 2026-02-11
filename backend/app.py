from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
# Explicitly load the .env from the project root so it works
# even when running this file from the backend/ directory.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

app = Flask(__name__)
# Enable CORS for React frontend with explicit configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Add request logging middleware
@app.before_request
def log_request_info():
    print(f"\n{'='*50}")
    print(f"Request: {request.method} {request.path}")
    print(f"Headers: {dict(request.headers)}")
    if request.is_json:
        print(f"JSON Data: {request.json}")
    print(f"{'='*50}\n")

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables!")
    print(f"Looking for .env at: {ENV_PATH}")
    print(f"Current working directory: {os.getcwd()}")
else:
    print(f"✅ API key loaded successfully (length: {len(api_key)})")

client = OpenAI(api_key=api_key)

#models = client.models.list()
#for m in models.data:
#    print(m.id)


FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal:techgadgets-support:D7e2cpyK"

SYSTEM_MESSAGE = (
    "You are a helpful customer support assistant for "
    "TechGadgets, an online electronics store. "
    "Always be friendly and professional. "
    "Always mention TechGadgets in your responses. "
    "Use company policies: 30-day money-back guarantee, "
    "standard shipping 3-5 business days, express 2-day shipping for $9.99, "
    "24/7 chat support, Mon-Fri 9AM-6PM phone support, "
    "1-year manufacturer warranty, and price matching."
)


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        print(f"Received message: {user_message[:50]}...")
        
        # Verify API key is loaded
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            error_msg = "OPENAI_API_KEY not found in environment variables"
            print(f"ERROR: {error_msg}")
            return jsonify({'error': error_msg}), 500
        
        # Call OpenAI API with fine-tuned model
        print(f"Calling OpenAI API with model: {FINE_TUNED_MODEL}")
        try:
            response = client.chat.completions.create(
                model=FINE_TUNED_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_MESSAGE},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            assistant_message = response.choices[0].message.content
            print(f"Response received: {assistant_message[:50]}...")
            
            return jsonify({
                'response': assistant_message
            })
        except Exception as openai_error:
            # Handle OpenAI-specific errors
            error_message = str(openai_error)
            error_type = type(openai_error).__name__
            
            # Try to extract more details from OpenAI error
            if hasattr(openai_error, 'status_code'):
                error_message = f"OpenAI API Error {openai_error.status_code}: {error_message}"
            if hasattr(openai_error, 'response'):
                try:
                    error_body = openai_error.response.json() if hasattr(openai_error.response, 'json') else {}
                    if 'error' in error_body:
                        error_info = error_body['error']
                        if isinstance(error_info, dict):
                            error_message = error_info.get('message', error_message)
                            error_type = error_info.get('type', error_type)
                except:
                    pass
            
            print(f"OpenAI API Error ({error_type}): {error_message}")
            print(f"Model used: {FINE_TUNED_MODEL}")
            
            # Return a user-friendly error message
            return jsonify({
                'error': error_message,
                'error_type': error_type,
                'model': FINE_TUNED_MODEL,
                'suggestion': 'The fine-tuned model ID may be incorrect, or you may not have access to this model. Try using the base model "gpt-4o-mini-2024-07-18" instead.'
            }), 500
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR DETAILS:\n{error_details}")
        return jsonify({'error': str(e), 'details': error_details}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'api_key_loaded': bool(api_key)})


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500


@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    error_details = traceback.format_exc()
    print(f"UNHANDLED ERROR:\n{error_details}")
    return jsonify({'error': str(e), 'details': error_details}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
