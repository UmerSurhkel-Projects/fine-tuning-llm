# Fine-Tune a Custom Support Bot

## Project Overview

In this project, you will fine-tune a GPT model to act as a customer support assistant for a fictional company, TechGadgets Inc. You will prepare training data, fine-tune the model, evaluate its performance, and compare it against a base model.

### Learning Objectives

- Prepare real-world training data for fine-tuning
- Understand the complete fine-tuning workflow
- Evaluate and compare model performance
- Learn when fine-tuning is effective and when it is not

## Project Scenario

**Company**: TechGadgets Inc. (fictional online electronics store)

The base GPT model gives generic customer support responses. Your task is to fine-tune a model that:

1. Always mentions the company name “TechGadgets”
2. Uses a consistent, professional response style
3. Provides company-specific policies and information
4. Maintains a friendly but professional tone

## What You Will Build

By the end of this project, you will have:

- A fine-tuned GPT model customized for TechGadgets customer support
- Training and validation datasets in OpenAI JSONL format
- A structured evaluation comparing a base model and a fine-tuned model

## Repository Structure

Your repository should follow this structure:

```

TechGadgets_Support_Bot/
├── data/
│ ├── training_data.jsonl
│ ├── validation_data.jsonl
│ ├── test_cases.py
│ └── data_source.txt
├── notebooks/
│ ├── 01_data_preparation.ipynb
│ ├── 02_fine_tuning.ipynb
│ └── 03_evaluation.ipynb
├── results/
│ ├── comparison_table.csv
│ ├── training_screenshots/
│ └── example_outputs.txt
├── requirements.txt
├── README.md
└── instructions.md

```

## Deliverables

### Data

- `data/training_data.jsonl` (400 examples)
- `data/validation_data.jsonl` (100 examples)
- `data/test_cases.py` (10 original test questions)
- `data/data_source.txt` (Dataset documentation)

### Notebooks

- Data preparation notebook
- Fine-tuning notebook
- Evaluation notebook

### Results

- Comparison table (CSV or markdown)
- Screenshot(s) of completed fine-tuning job
- Example outputs from both base and fine-tuned models

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   - Create a `.env` file with your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

3. **Run notebooks in order:**
   - `notebooks/01_data_preparation.ipynb` - Prepare and adapt the dataset
   - `notebooks/02_fine_tuning.ipynb` - Fine-tune the model
   - `notebooks/03_evaluation.ipynb` - Evaluate and compare models

## Where to Start

Read **Instructions.md** carefully. It contains:

- Dataset information
- Step-by-step coding instructions
- Fine-tuning requirements
- Evaluation methodology

## Success Criteria

Your submission is considered successful if:

- The fine-tuned model consistently mentions TechGadgets
- Responses use correct company policies and information
- Tone and format are consistent and professional
- Performance is measurably better than the base model
- You can clearly explain what fine-tuning improved and what it did not
