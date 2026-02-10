"""
Test Cases for TechGadgets Support Bot Evaluation

These are 10 original customer support questions that do NOT appear
in the training or validation datasets. They cover a mix of:
- Simple queries
- Complex queries
- Edge cases
- Different categories (returns, shipping, support, etc.)
"""

test_cases = [
    # Simple queries
    "What is your return policy?",
    "Do you offer express shipping?",
    "How can I contact customer support?",
    
    # Complex queries
    "My order hasn't arrived yet and it's been over a week. What should I do?",
    "Can I return an item I bought last month if I still have the receipt?",
    "I need to change my shipping address for an order that's already been placed. Is that possible?",
    
    # Edge cases
    "Do you price match with other electronics retailers?",
    "What kind of warranty do your products come with?",
    "I accidentally ordered the wrong item. Can I exchange it instead of returning?",
    
    # Multi-intent query
    "I want to cancel my current order and also ask about your refund policy for future purchases"
]
