# Detailed Project Instructions: TechGadgets Support Bot

This document contains the complete step-by-step instructions for the TechGadgets fine-tuning assignment. Follow the tasks in order. All required code, formats, and deliverables are described here.

## Task 1: Data Preparation

### Objective

Prepare real-world customer support data in OpenAI JSONL format for fine-tuning a GPT model.

## Dataset Provided

**Dataset Name**: Bitext Customer Support LLM Training Dataset  
**Source**: Hugging Face  
**Size**: 26,872 examples  
**Categories**: Account, shipping, payment, returns, cancellations, feedback  
**Link**: https://huggingface.co/datasets/bitext/Bitext-customer-support-llm-chatbot-training-dataset

## Step 1: Install Required Libraries

```bash
pip install datasets pandas python-dotenv openai
```

## Step 2: Load the Dataset

Create a Python file or Jupyter notebook cell and load the dataset.

```python
from datasets import load_dataset
import pandas as pd

dataset = load_dataset("bitext/Bitext-customer-support-llm-chatbot-training-dataset")
df = pd.DataFrame(dataset["train"])

print(f"Total examples: {len(df)}")
print("Columns:", df.columns)
print("Sample row:")
print(df.iloc[0])
```

## Step 3: Explore the Data

Inspect the dataset to understand the type of customer queries and responses.

```python
for i in range(5):
    print(df["instruction"][i])
```

Make sure you understand the intent, tone, and structure of the data before adapting it.

## Step 4: Adapt the Data to TechGadgets

You must customize the responses so they reflect TechGadgets branding and policies.

### Company Information (Must Be Used)

- Company Name: TechGadgets
- Return Policy: 30-day money-back guarantee
- Shipping:
  - Standard: 3–5 business days
  - Express: 2-day shipping for $9.99

- Support Hours: 24/7 chat, Mon–Fri 9AM–6PM phone
- Warranty: 1-year manufacturer warranty
- Price Match: Matches competitor prices

### Adaptation Function Example

```python
def adapt_to_techgadgets(instruction, response):
    adapted_response = response

    if "TechGadgets" not in adapted_response:
        adapted_response = "At TechGadgets, " + adapted_response

    if "return" in instruction.lower():
        adapted_response += " We offer a 30-day money-back guarantee."

    if "shipping" in instruction.lower():
        adapted_response += (
            " Standard shipping takes 3-5 business days, "
            "and express 2-day shipping is available for $9.99."
        )

    return adapted_response
```

Ensure all adapted responses:

- Mention TechGadgets
- Are factually consistent
- Sound natural and professional

## Step 5: Create Training and Validation Files (JSONL)

### Requirements

- Training examples: 400
- Validation examples: 100
- Format: OpenAI chat fine-tuning JSONL

```python
import json
import os

os.makedirs("data", exist_ok=True)

def write_jsonl(df, start, end, output_path):
    with open(output_path, "w") as f:
        for i in range(start, end):
            record = {
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful customer support assistant for "
                            "TechGadgets, an online electronics store. "
                            "Always be friendly and professional."
                        )
                    },
                    {
                        "role": "user",
                        "content": df["instruction"][i]
                    },
                    {
                        "role": "assistant",
                        "content": adapt_to_techgadgets(
                            df["instruction"][i],
                            df["response"][i]
                        )
                    }
                ]
            }
            f.write(json.dumps(record) + "\n")

write_jsonl(df, 0, 400, "data/training_data.jsonl")
write_jsonl(df, 400, 500, "data/validation_data.jsonl")
```

## Step 6: Validate JSONL Files

Before proceeding, validate your JSONL files.

```python
import json

def validate_jsonl(file_path):
    with open(file_path, "r") as f:
        for line_num, line in enumerate(f, 1):
            obj = json.loads(line)
            assert "messages" in obj, f"Missing messages at line {line_num}"
            for msg in obj["messages"]:
                assert msg["role"] in ["system", "user", "assistant"]
                assert "content" in msg

validate_jsonl("data/training_data.jsonl")
validate_jsonl("data/validation_data.jsonl")
```

## Task 2: Fine-Tune the Model

### Objective

Upload your data and create a fine-tuning job.

### Required Configuration

- Model: `gpt-4o-mini-2024-07-18`
- Epochs: 1
- Batch size: 1
- Seed: 42
- Suffix: `techgadgets-support`

### Deliverables

- Screenshot of the completed fine-tuning job
- Fine-tuned model ID

## Task 3: Create Test Cases

### Objective

Create 10 original customer support questions.

### Requirements

- Must not appear in training or validation data
- Mix of simple, complex, and edge cases

Example:

```python
test_cases = [
    "What is your return policy?",
    "Do you offer express shipping?",
    "My order has not arrived yet",
    "Can I cancel my order?",
    "Do you price match other retailers?"
]
```

Save these in `data/test_cases.py` or your evaluation notebook.

## Task 4: Evaluate Model Performance

### Objective

Compare the base model and the fine-tuned model.

### Evaluation Criteria

- Mentions TechGadgets
- Correct company information
- Professional and friendly tone
- Consistent response format

You must:

1. Run all 10 test cases on both models
2. Score each response using the criteria above
3. Create a comparison table summarizing results

## Optional Task 5: Iteration

Optional improvements include:

- Adding more training examples
- Improving data quality
- Creating multi-turn conversations
- Adjusting hyperparameters
- Testing alternative approaches

## Common Pitfalls to Avoid

- Using training data as test cases
- Forgetting to validate JSONL files
- Committing API keys or secrets
- Expecting perfect performance from small datasets
