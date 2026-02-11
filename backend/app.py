from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os
import pandas as pd
import re
from datetime import datetime

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


FINE_TUNED_MODEL = "gpt-4o-mini-2024-07-18"  # Base model - works for testing
# FINE_TUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:personal:techgadgets-support:D7e2cpyK"  # Your fine-tuned model

# Load orders data
ORDERS_CSV_PATH = os.path.join(BASE_DIR, "data", "orders.csv")
orders_df = None

try:
    orders_df = pd.read_csv(ORDERS_CSV_PATH)
    print(f"✅ Loaded {len(orders_df)} orders from CSV")
except Exception as e:
    print(f"⚠️ Warning: Could not load orders CSV: {e}")

SYSTEM_MESSAGE = (
    "You are a helpful customer support assistant for TechGadgets, an online electronics store. "
    "Always be friendly and professional. Always mention TechGadgets in your responses.\n\n"
    "You can help customers with:\n"
    "1. Order details and status inquiries\n"
    "2. Order cancellation requests\n"
    "3. Product information\n"
    "4. Shipping and delivery questions\n"
    "5. Returns and refunds\n"
    "6. General customer support\n\n"
    "Company policies:\n"
    "- 30-day money-back guarantee\n"
    "- Standard shipping: 3-5 business days\n"
    "- Express 2-day shipping: $9.99\n"
    "- 24/7 chat support\n"
    "- Mon-Fri 9AM-6PM phone support\n"
    "- 1-year manufacturer warranty\n"
    "- Price matching available\n\n"
    "When customers ask about order details or cancellation, you MUST collect their phone number "
    "for verification purposes. Ask politely: 'Could you please provide your phone number for verification?'"
)

# Store conversation history (in production, use a database or session storage)
conversation_history = {}


def extract_phone_number(text):
    """Extract phone number from text"""
    # Match various phone number formats
    patterns = [
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # 555-123-4567 or 555.123.4567
        r'\(\d{3}\)\s?\d{3}[-.]?\d{4}',    # (555) 123-4567
        r'\b\d{10}\b',                      # 5551234567
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None

def search_orders(query, phone=None):
    """Search orders by order ID, phone number, or customer name"""
    if orders_df is None:
        return None
    
    query = str(query).upper().strip()
    
    # Search by order ID
    if query.startswith('ORD-'):
        result = orders_df[orders_df['order_id'].str.upper() == query]
        if not result.empty:
            return result.iloc[0].to_dict()
    
    # Search by phone number
    if phone:
        phone_clean = re.sub(r'[^\d]', '', phone)
        result = orders_df[orders_df['phone'].str.replace(r'[^\d]', '', regex=True) == phone_clean]
        if not result.empty:
            return result.iloc[0].to_dict()
    
    # Search by phone from query
    phone_in_query = extract_phone_number(query)
    if phone_in_query:
        phone_clean = re.sub(r'[^\d]', '', phone_in_query)
        result = orders_df[orders_df['phone'].str.replace(r'[^\d]', '', regex=True) == phone_clean]
        if not result.empty:
            return result.iloc[0].to_dict()
    
    # Search by customer name (partial match)
    result = orders_df[orders_df['customer_name'].str.upper().str.contains(query, na=False)]
    if not result.empty:
        return result.iloc[0].to_dict()
    
    return None

def format_order_details(order):
    """Format order details for display"""
    if not order:
        return None
    
    return (
        f"Order ID: {order['order_id']}\n"
        f"Customer: {order['customer_name']}\n"
        f"Product: {order['product_name']} (Qty: {order['quantity']})\n"
        f"Order Date: {order['order_date']}\n"
        f"Status: {order['order_status']}\n"
        f"Total Amount: ${order['total_amount']}\n"
        f"Estimated Delivery: {order['estimated_delivery']}\n"
        + (f"Tracking Number: {order['tracking_number']}\n" if order.get('tracking_number') else "")
        + f"Shipping Address: {order['shipping_address']}"
    )

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')  # Use session ID for conversation history
        phone_number = data.get('phone_number', None)  # Phone number if provided
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        print(f"Received message: {user_message[:50]}...")
        print(f"Session ID: {session_id}")
        if phone_number:
            print(f"Phone number provided: {phone_number}")
        
        # Verify API key is loaded
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            error_msg = "OPENAI_API_KEY not found in environment variables"
            print(f"ERROR: {error_msg}")
            return jsonify({'error': error_msg}), 500
        
        # Check if user is asking about orders
        order_keywords = ['order', 'cancel', 'status', 'tracking', 'delivery', 'shipment']
        is_order_query = any(keyword in user_message.lower() for keyword in order_keywords)
        
        # Search for orders if relevant
        order_info = None
        if is_order_query:
            order_info = search_orders(user_message, phone_number)
            if order_info:
                print(f"Found order: {order_info['order_id']}")
        
        # Get conversation history (keep last 3 messages)
        if session_id not in conversation_history:
            conversation_history[session_id] = []
        
        history = conversation_history[session_id]
        
        # Build messages with system prompt and context
        messages = [{"role": "system", "content": SYSTEM_MESSAGE}]
        
        # Add last 3 messages from history (if available)
        for msg in history[-3:]:
            messages.append(msg)
        
        # Add current user message
        current_user_msg = user_message
        
        # If order info found, add it to the context
        if order_info:
            order_details = format_order_details(order_info)
            current_user_msg += f"\n\n[Order Information Available]\n{order_details}"
        
        messages.append({"role": "user", "content": current_user_msg})
        
        # Call OpenAI API
        print(f"Calling OpenAI API with model: {FINE_TUNED_MODEL}")
        try:
            response = client.chat.completions.create(
                model=FINE_TUNED_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=600
            )
            
            assistant_message = response.choices[0].message.content
            print(f"Response received: {assistant_message[:50]}...")
            
            # Update conversation history (keep last 3 messages)
            history.append({"role": "user", "content": user_message})
            history.append({"role": "assistant", "content": assistant_message})
            conversation_history[session_id] = history[-6:]  # Keep last 3 exchanges (6 messages)
            
            # Check if phone number is needed
            needs_phone = (
                is_order_query and 
                not phone_number and 
                ('cancel' in user_message.lower() or 'detail' in user_message.lower() or 'status' in user_message.lower())
            )
            
            response_data = {
                'response': assistant_message,
                'needs_phone': needs_phone and not order_info
            }
            
            # If order found, include order details
            if order_info:
                response_data['order_found'] = True
                response_data['order_id'] = order_info['order_id']
                response_data['order_status'] = order_info['order_status']
            
            return jsonify(response_data)
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
