# Sentiment Lab

An interactive playground for comparing recurrent neural networks on sentiment analysis.

**[Try Sentiment Lab →](https://sentiment-analysis-ten-omega.vercel.app/)**

This project started as a fairly ordinary Deep Learning experiment: train a SimpleRNN on IMDb movie reviews and classify text as positive or negative.

I didn't want to leave it sitting in a Colab notebook.

The original model became a small Flask application, and that application eventually evolved into **Sentiment Lab** — a controlled experiment comparing SimpleRNN, LSTM and GRU architectures trained under the same conditions.

Along the way, the project became less about asking *"Which model has the highest accuracy?"* and more about asking:

> **Where do these models succeed, where do they disagree, and what kinds of language completely fool them?**

---

## Live Demo

The latest version is deployed on Vercel:

### [Open Sentiment Lab →](https://sentiment-analysis-ten-omega.vercel.app/)

The original single-model version is preserved in the [`Initial-Iteration-RNN`](../../tree/Initial-Iteration-RNN) branch.

That branch is intentionally kept as a historical snapshot and includes instructions for running the original application locally or deploying your own copy.

---

# The Experiment

V3 retrains the project on the full IMDb review dataset and compares three recurrent architectures:

- **SimpleRNN**
- **LSTM**
- **GRU**

All three models use the same:

- dataset
- train/test split
- text-cleaning pipeline
- tokenizer
- vocabulary
- sequence length
- embedding dimension
- recurrent-unit count
- dense layer
- batch size
- early-stopping strategy

The main variable is the **recurrent architecture itself**.

```text
                         IMDb reviews
                              │
                              ▼
                        preprocessing
                              │
                              ▼
                       shared tokenizer
                              │
                              ▼
                      padded sequences
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
        SimpleRNN            LSTM             GRU
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                        same test set
```

This makes the comparison more meaningful than training three unrelated models with different preprocessing or hyperparameters.

---

# Dataset

The experiment began with the full **50,000-review IMDb dataset**.

Before splitting the data, exact duplicate reviews were removed to reduce the possibility of identical reviews appearing across different subsets.

```text
Original reviews       50,000
Duplicates removed        418
Usable reviews          49,582
Training pool           39,665
Test reviews             9,917
```

The classes remained approximately balanced between positive and negative reviews.

The tokenizer was fitted **only on the training data**, preventing information from the test vocabulary from leaking into preprocessing.

---

# Model Configuration

The three architectures intentionally share most of their surrounding configuration.

```text
Vocabulary size          10,000
Sequence length             200
Embedding dimension           64
Recurrent units               64
Dense units                   32
Batch size                    64
Output activation        Sigmoid
Loss              Binary Crossentropy
Optimizer                    Adam
```

The architecture can be thought of as:

```text
Text
 │
 ▼
Cleaning
 │
 ▼
Tokenizer
 │
 ▼
Padding (200)
 │
 ▼
Embedding (64)
 │
 ├────────────────┬────────────────┐
 ▼                ▼                ▼
SimpleRNN(64)   LSTM(64)         GRU(64)
 │                │                │
 └────────────────┴────────────────┘
                  │
                  ▼
               Dropout
                  │
                  ▼
           Dense (32, ReLU)
                  │
                  ▼
         Dense (1, Sigmoid)
                  │
                  ▼
        Negative ↔ Positive
```

Early stopping was used to avoid continuing training after validation performance stopped improving.

---

# Results

## IMDb Test Performance

| Model | Accuracy | Macro F1 | Test Loss | Parameters | Model Size |
|---|---:|---:|---:|---:|---:|
| SimpleRNN | 81.36% | 81.33% | 0.4727 | 650,369 | 7.48 MB |
| LSTM | 85.29% | 85.25% | 0.3445 | 675,137 | 7.76 MB |
| **GRU** | **87.08%** | **87.06%** | **0.3264** | 667,073 | 7.67 MB |

The progression was:

```text
SimpleRNN
81.36%
   │
   │ +3.93 percentage points
   ▼
LSTM
85.29%
   │
   │ +1.79 percentage points
   ▼
GRU
87.08%
```

Overall:

```text
SimpleRNN → GRU

81.36% → 87.08%

+5.73 percentage points
```

GRU achieved the strongest performance on the standard IMDb test set.

---

## Bigger Isn't Necessarily Better

One result I found particularly interesting was the relatively small difference in model size.

```text
SimpleRNN

650,369 parameters
7.48 MB
81.36% accuracy


GRU

667,073 parameters
7.67 MB
87.08% accuracy
```

GRU uses only:

```text
+16,704 parameters
+0.19 MB
```

compared with SimpleRNN, yet improved test accuracy by **5.73 percentage points**.

LSTM actually contains more parameters than GRU:

```text
LSTM       675,137
GRU        667,073
```

while GRU achieved the better test accuracy.

So the improvement cannot simply be explained by *"the better model is larger."*

---

# Early Stopping

The models also converged differently.

| Model | Best Epoch | Epochs Completed |
|---|---:|---:|
| SimpleRNN | 7 | 9 |
| LSTM | 1 | 3 |
| GRU | 2 | 4 |

The LSTM, for example, reached its best validation loss after the first epoch.

Training continued for two additional epochs because the early-stopping patience was set to two. Once validation loss failed to improve, training stopped and the weights from the best epoch were restored.

This prevented later epochs from being used simply because a larger maximum epoch count had been specified.

---

# Accuracy Isn't the Whole Story

The standard IMDb results initially suggested a simple conclusion:

```text
GRU > LSTM > SimpleRNN
```

But that turned out to be incomplete.

A model can perform well on a broad test set while still failing badly on a particular kind of language.

So I created a separate diagnostic challenge set.

---

# Model Arena

**Model Arena** is an 80-example diagnostic benchmark designed specifically to probe difficult linguistic constructions.

It contains four categories:

```text
Simple sentiment       20 examples
Mixed sentiment        20 examples
Negation               20 examples
Sarcasm                20 examples
                       ───────────
Total                   80 examples
```

Each category contains:

```text
10 positive
10 negative
```

None of these examples were used for training.

## Diagnostic Results

| Challenge | SimpleRNN | LSTM | GRU |
|---|---:|---:|---:|
| Simple | 90% | **100%** | **100%** |
| Mixed | 70% | 70% | **90%** |
| Negation | 25% | **35%** | 25% |
| Sarcasm | 35% | **50%** | 35% |

This produced some of the most interesting results in the project.

---

# Mixed Sentiment

GRU performed particularly well when a sentence contained conflicting sentiment.

For example:

> The acting was excellent, but the story was so terrible that I hated the movie.

The model has to deal with positive and negative information appearing in the same sequence.

Results:

```text
SimpleRNN       70%
LSTM            70%
GRU             90%
```

GRU substantially outperformed the other two architectures on this small diagnostic category.

---

# Negation Breaks the Models

Negation was much harder.

Consider:

> This movie was not bad at all.

A human interprets:

```text
bad
 │
 ▼
negative

not + bad
    │
    ▼
positive / less negative
```

The models frequently failed to make this reversal reliably.

Overall negation performance:

```text
SimpleRNN       25%
LSTM            35%
GRU             25%
```

Because this is a balanced binary challenge, these results are particularly poor.

## Positive Negation

Positive negation was even more difficult.

Examples include:

> I did not hate this movie.

> This movie was not bad at all.

Performance:

| Model | Positive Negation |
|---|---:|
| SimpleRNN | 10% |
| LSTM | 20% |
| GRU | 20% |

This suggests the models can remain heavily influenced by sentiment-heavy words such as *hate* or *bad*, even when negation changes the overall meaning.

---

# Sarcasm Isn't Much Kinder

Consider:

> Fantastic, another two hours of my life I will never get back.

The word:

```text
fantastic
```

is strongly associated with positive sentiment.

But the actual sentence is negative.

Overall sarcasm performance:

```text
SimpleRNN       35%
LSTM            50%
GRU             35%
```

Breaking that down further:

| Model | Negative Sarcasm | Positive Sarcasm |
|---|---:|---:|
| SimpleRNN | 40% | 30% |
| LSTM | **60%** | **40%** |
| GRU | 30% | **40%** |

The challenge set is deliberately small and diagnostic.

These figures should **not** be interpreted as general-purpose sarcasm or negation benchmarks. Their purpose is to expose interesting failure modes that ordinary test accuracy can hide.

---

# What Sentiment Lab Can Do

## Compare All

A single input can be sent through all three models simultaneously.

Instead of returning only one answer, Sentiment Lab displays:

```text
SimpleRNN
LSTM
GRU
```

side by side.

This makes differences between the architectures immediately visible.

---

## Negative ↔ Positive Sentiment Meter

Each model produces a sigmoid output between 0 and 1.

The interface turns this into a negative-to-positive sentiment meter:

```text
NEGATIVE                                  POSITIVE

├────────────────────────────●───────────────────┤
                           76.8%
```

The application refers to this as a **sentiment score**, rather than claiming it represents perfectly calibrated confidence.

A model can produce a strong score and still be wrong.

The Model Arena demonstrates this rather effectively.

---

## Model Disagreement

Sometimes the models disagree.

For example:

```text
"This movie wasn't nearly as bad as I expected."


SimpleRNN       Negative
LSTM            Positive
GRU             Positive


⚡ Model disagreement
```

Rather than hiding this and displaying only a majority prediction, Sentiment Lab exposes the disagreement directly.

The disagreement itself can be informative.

---

# See What the Models See

The application also exposes the preprocessing pipeline.

```text
Original text
      │
      ▼
Cleaning
      │
      ▼
Tokenization
      │
      ▼
Token IDs
      │
      ▼
Padding to 200 tokens
      │
      ▼
Recurrent model
      │
      ▼
Sentiment score
```

This does not make a recurrent neural network completely explainable.

It does, however, make the transformation between what the user typed and what the neural network actually receives considerably less mysterious.

---

# Interactive Model Arena

The diagnostic benchmark isn't just displayed as a table.

Users can browse individual examples from:

- Simple
- Mixed
- Negation
- Sarcasm

For each example, Sentiment Lab shows:

```text
Actual sentiment

SimpleRNN prediction     ✓ / ✗
LSTM prediction          ✓ / ✗
GRU prediction           ✓ / ✗
```

Users can move through the benchmark and send any example directly into the live analyzer.

---

# Hall of Shame

Some sentences managed to fool **all three models**.

Naturally, they deserved their own section.

The **Hall of Shame** automatically identifies diagnostic examples where:

```text
SimpleRNN     WRONG
LSTM          WRONG
GRU           WRONG
```

Clicking one sends it directly into the live three-model analyzer.

The goal isn't to hide model failures.

It's to make them part of the experiment.

---

# Random Challenge

Don't know what to type?

The **Random Challenge** feature selects an example from the diagnostic benchmark and sends it into the live comparison interface.

This makes it easy to explore unusual model behavior without manually constructing adversarial examples.

---

# Project Evolution

## V1 — The Experiment

The project began as a Deep Learning laboratory experiment.

The original objective was straightforward:

> Train a recurrent neural network on sequential text data and perform sentiment analysis.

A SimpleRNN was trained on IMDb movie reviews.

That could have been the end of the project.

---

## V2 — The Application

Instead of leaving the trained model in Colab, I turned it into a Flask web application.

The project gained:

- deployed inference
- a custom interface
- light and dark themes
- preprocessing visualization
- example prompts
- prediction history
- challenge inputs

The source for this original single-model application is preserved on:

### [`Initial-Iteration-RNN`](../../tree/Initial-Iteration-RNN)

That branch contains instructions for running the original application locally or deploying your own copy.

It is intentionally preserved so the evolution of the project remains visible.

---

## V3 — Sentiment Lab

V3 rebuilt the ML experiment around the larger IMDb dataset.

Instead of asking:

> Can a SimpleRNN classify sentiment?

the question became:

> How do different recurrent architectures behave when everything else is controlled?

That led to:

```text
SimpleRNN
    vs
LSTM
    vs
GRU
```

and eventually to:

```text
standard evaluation
        +
diagnostic evaluation
        +
model disagreement
        +
failure analysis
```

The failures turned out to be at least as interesting as the accuracy improvements.

---

# Tech Stack

## Machine Learning

- Python
- TensorFlow
- Keras
- SimpleRNN
- LSTM
- GRU
- scikit-learn
- pandas
- NumPy

## Application

- Flask
- HTML
- CSS
- Vanilla JavaScript

## Deployment

- Vercel

There is deliberately no frontend framework or database in the current version.

---

# Project Structure

```text
Sentiment-Analysis/
│
├── benchmarks/
│   ├── challenge_benchmark.csv
│   └── challenge_results.csv
│
├── model/
│   ├── simple_rnn.keras
│   ├── lstm.keras
│   ├── gru.keras
│   ├── tokenizer.pkl
│   └── metadata.json
│
├── static/
│   ├── script.js
│   └── style.css
│
├── templates/
│   └── index.html
│
├── app.py
├── requirements.txt
├── LICENSE
└── README.md
```

---

# Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/adishsrivastava/Sentiment-Analysis.git
```

Enter the project:

```bash
cd Sentiment-Analysis
```

---

## 2. Create a virtual environment

```bash
python -m venv .venv
```

### Windows

```bash
.venv\Scripts\activate
```

### macOS / Linux

```bash
source .venv/bin/activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

TensorFlow is a large dependency, so installation may take a little while.

---

## 4. Run the application

```bash
python app.py
```

Flask should start locally, normally at:

```text
http://127.0.0.1:5000
```

Open that address in your browser.

---

## 5. Stop the application

Press:

```text
Ctrl + C
```

To exit the virtual environment:

```bash
deactivate
```

---

# API

Sentiment Lab also exposes several endpoints used by the frontend.

## Health Check

```http
GET /health
```

Returns application status and the available models.

---

## Model Information

```http
GET /models
```

Returns metadata about the experiment and trained models.

---

## Diagnostic Benchmark

```http
GET /benchmark
```

Returns:

- benchmark summary
- diagnostic examples
- model predictions
- correct/incorrect results
- Hall of Shame examples

---

## Compare All Models

```http
POST /compare
```

Example request:

```json
{
    "text": "This movie wasn't nearly as bad as I expected."
}
```

The response contains:

- SimpleRNN prediction
- LSTM prediction
- GRU prediction
- positive sentiment scores
- negative sentiment scores
- inference times
- preprocessing information
- model-agreement information

---

## Individual Model Prediction

```text
POST /predict/simple_rnn
POST /predict/lstm
POST /predict/gru
```

Example request:

```json
{
    "text": "I really enjoyed this movie."
}
```

---

# Limitations

Sentiment Lab is an educational and experimental project, not a production language-understanding system.

The models:

- perform binary positive/negative classification
- do not have a neutral class
- were trained primarily on IMDb movie-review language
- may generalize poorly to unrelated domains
- struggle substantially with negation
- struggle substantially with sarcasm
- may assign strong sentiment scores to incorrect predictions
- are sensitive to preprocessing and vocabulary
- should not be interpreted as understanding language in the same way a human does

These limitations are intentionally visible in the application rather than hidden.

---

# A Note on the Diagnostic Benchmark

The 80-example Model Arena benchmark is:

- hand-written
- deliberately challenging
- balanced within each category
- not used for training
- designed for diagnosis rather than general performance measurement

It should **not** be interpreted as an industry-standard benchmark for sarcasm, negation or natural-language understanding.

The standard IMDb test set remains the primary measure of general sentiment-classification performance.

The diagnostic benchmark answers a different question:

> **What happens when we deliberately probe the models with language they're likely to find difficult?**

---

# What's Next?

Some directions I'd like to explore:

- [x] SimpleRNN baseline
- [x] LSTM comparison
- [x] GRU comparison
- [x] Full 50k IMDb experiment
- [x] Shared preprocessing pipeline
- [x] Three-model inference
- [x] Sentiment meters
- [x] Model disagreement detection
- [x] Diagnostic challenge benchmark
- [x] Model Arena
- [x] Hall of Shame
- [x] Random Challenge
- [ ] Larger independent negation benchmark
- [ ] Larger independent sarcasm benchmark
- [ ] Probability calibration
- [ ] Repeated training with multiple random seeds
- [ ] Confidence/calibration analysis
- [ ] Transformer baseline
- [ ] Human feedback collection
- [ ] Feedback-driven continual learning
- [ ] Measure catastrophic forgetting during continual learning
- [ ] Compare recurrent architectures against modern transformer models

One experiment I'm particularly interested in is whether feedback-driven retraining can improve difficult categories such as negation and sarcasm **without reducing performance on ordinary IMDb reviews**.

---

# Previous Version

The original single-model sentiment analyzer has not been deleted.

It is preserved on the:

### [`Initial-Iteration-RNN`](../../tree/Initial-Iteration-RNN) branch

That branch represents the earlier stage of the project and includes instructions for running the original SimpleRNN application locally or deploying your own copy.

Keeping it separate makes it possible to see how the project evolved rather than overwriting its history.

---

# Contributing

Contributions, experiments and interesting failure cases are welcome.

Useful areas include:

- reproducible model failure examples
- diagnostic datasets
- accessibility improvements
- mobile UI improvements
- model evaluation
- automated tests
- additional architectures
- probability calibration
- performance optimization

For substantial model or architecture changes, opening an issue first is probably easiest.

---

# License

Released under the [MIT License](LICENSE).

---

**[Try Sentiment Lab →](https://sentiment-analysis-ten-omega.vercel.app/)**

Built because submitting the notebook felt like an unsatisfying place to stop.