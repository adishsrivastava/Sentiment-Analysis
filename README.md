# Sentiment Lab

An interactive playground for comparing recurrent neural networks on sentiment analysis.

This project started as a fairly ordinary Deep Learning lab experiment: train a SimpleRNN on IMDb movie reviews and classify reviews as positive or negative.

I didn't want to leave it in a Colab notebook.

The first model became a small Flask application, which eventually turned into **Sentiment Lab** — an experiment comparing SimpleRNN, LSTM and GRU models trained under the same conditions, along with an interface for exploring not only what they get right, but where they fail.

**[Try Sentiment Lab](YOUR_V3_PRODUCTION_URL)**

> The original SimpleRNN version of the project is preserved on the [`Initial-Iteration-RNN`](../../tree/Initial-Iteration-RNN) branch.

---

## The experiment

All three V3 models were trained using the same:

- IMDb review dataset
- train/test split
- text-cleaning pipeline
- tokenizer
- 10,000-word vocabulary
- 200-token sequence length
- 64-dimensional embedding
- 64 recurrent units
- 32-unit dense layer
- batch size
- early-stopping strategy

The main variable is the recurrent architecture itself.

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

That makes the comparison considerably more useful than training three unrelated models with different settings.

---

## Results

After removing 418 duplicate reviews, the final dataset contained **49,582 reviews**.

- 39,665 reviews formed the training pool
- 9,917 reviews formed the test set

### IMDb test performance

| Model | Accuracy | Macro F1 | Test loss | Parameters | Size |
|---|---:|---:|---:|---:|---:|
| SimpleRNN | 81.36% | 81.33% | 0.4727 | 650,369 | 7.48 MB |
| LSTM | 85.29% | 85.25% | 0.3445 | 675,137 | 7.76 MB |
| **GRU** | **87.08%** | **87.06%** | **0.3264** | 667,073 | 7.67 MB |

GRU was the strongest model on the standard IMDb test set.

The interesting part is that it achieved a **5.73 percentage-point improvement over SimpleRNN** while using only 16,704 additional parameters.

But "GRU is the best model" turned out to be an incomplete conclusion.

---

## Model Arena

A high test accuracy doesn't mean a model understands every kind of language equally well.

I created a separate **80-example diagnostic challenge set** containing four categories:

- Simple sentiment
- Mixed sentiment
- Negation
- Sarcasm

Each category contains 20 hand-written examples with balanced positive and negative labels. None of them were used for training.

| Challenge | SimpleRNN | LSTM | GRU |
|---|---:|---:|---:|
| Simple | 90% | **100%** | **100%** |
| Mixed | 70% | 70% | **90%** |
| Negation | 25% | **35%** | 25% |
| Sarcasm | 35% | **50%** | 35% |

This produced my favourite result from the project.

The GRU scores **87.08%** on the IMDb test set and **90%** on the mixed-sentiment challenge, yet only **25%** on the negation set and **35%** on sarcasm.

In other words, good overall accuracy can hide spectacularly bad performance on a particular linguistic phenomenon.

### Negation is especially painful

Consider:

> I did not hate this movie.

A human understands that *not* changes the meaning of *hate*.

The models often don't.

On positive negation examples, the models scored:

| Model | Accuracy |
|---|---:|
| SimpleRNN | 10% |
| LSTM | 20% |
| GRU | 20% |

This isn't simply random error. The models appear to be systematically influenced by sentiment-heavy words even when negation changes the meaning of the phrase.

### Sarcasm isn't much kinder

Consider:

> Fantastic, another two hours of my life I will never get back.

The word *fantastic* looks positive. The sentence clearly isn't.

On the sarcasm challenge:

| Model | Negative sarcasm | Positive sarcasm |
|---|---:|---:|
| SimpleRNN | 40% | 30% |
| LSTM | **60%** | **40%** |
| GRU | 30% | **40%** |

The challenge set is intentionally small and diagnostic, so these figures shouldn't be interpreted as general-purpose sarcasm benchmarks. They're there to expose interesting failure modes.

---

## What you can do in Sentiment Lab

### Compare models

Enter one sentence and run it through:

```text
SimpleRNN
LSTM
GRU
```

individually, or use **Compare All**.

Each model gets its own negative-to-positive sentiment meter, making disagreements easy to see.

### Model disagreement

Something like:

```text
"This movie wasn't nearly as bad as I expected."

SimpleRNN     Negative
LSTM          Positive
GRU           Positive

⚡ Model disagreement
```

is much more interesting than simply displaying the majority answer.

The disagreement itself tells us something about the architectures.

### See what the models see

The application exposes the preprocessing pipeline:

```text
Original text
      ↓
Cleaning
      ↓
Tokenization
      ↓
Token IDs
      ↓
Padding to 200 tokens
      ↓
Recurrent model
      ↓
Sentiment score
```

This doesn't make a neural network fully explainable, but it does make the input pipeline less mysterious.

### Model Arena

The 80 diagnostic examples can be explored directly in the application.

You can browse Simple, Mixed, Negation and Sarcasm examples and see which architecture got each one right.

### Hall of Shame

Some inputs manage to fool **all three models**.

Naturally, they deserved their own section.

The Hall of Shame automatically surfaces examples where SimpleRNN, LSTM and GRU all predicted the wrong label.

### Random Challenge

If you don't know what to type, the application can select one of the diagnostic examples and throw it into the live three-model comparison.

---

## Architecture

The surrounding network is deliberately kept similar between models.

```text
Text
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
 ├───────────────┬───────────────┐
 ▼               ▼               ▼
SimpleRNN(64)   LSTM(64)        GRU(64)
 │               │               │
 └───────────────┴───────────────┘
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

The sigmoid output is displayed as a **sentiment score**, rather than claiming it is a calibrated confidence probability.

---

## Project evolution

### V1 — The experiment

Train a SimpleRNN for a Deep Learning lab and understand how recurrent networks work with sequential text.

### V2 — The application

Take the trained model out of the notebook.

The project gained:

- Flask inference
- a deployed web interface
- light/dark themes
- preprocessing visualization
- example prompts
- prediction history
- challenge prompts

The source for this iteration is preserved on:

**[`Initial-Iteration-RNN`](../../tree/Initial-Iteration-RNN)**

### V3 — Sentiment Lab

Retrain from scratch on the larger dataset and turn the application into a controlled architecture comparison:

```text
SimpleRNN vs LSTM vs GRU
```

Then deliberately look for cases where the models fail.

That turned out to be considerably more interesting than simply chasing a higher accuracy number.

---

## Tech stack

**Machine learning**

- Python
- TensorFlow
- Keras
- SimpleRNN
- LSTM
- GRU
- scikit-learn
- pandas / NumPy

**Application**

- Flask
- HTML
- CSS
- Vanilla JavaScript

**Deployment**

- Vercel

There is deliberately no frontend framework or database at this stage.

---

## Project structure

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

## Running locally

Clone the repository:

```bash
git clone https://github.com/adishsrivastava/Sentiment-Analysis.git
cd Sentiment-Analysis
```

Create a virtual environment:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

---

## API

### Compare all models

```http
POST /compare
```

Request:

```json
{
  "text": "This movie wasn't nearly as bad as I expected."
}
```

The response contains separate SimpleRNN, LSTM and GRU predictions, sentiment scores, inference times and model-agreement information.

### Individual models

```text
POST /predict/simple_rnn
POST /predict/lstm
POST /predict/gru
```

### Experiment information

```text
GET /models
```

### Diagnostic benchmark

```text
GET /benchmark
```

### Health check

```text
GET /health
```

---

## Limitations

This is an educational/experimental sentiment-analysis project, not a general language-understanding system.

The models:

- were trained primarily on IMDb movie reviews
- perform binary classification only
- have no neutral class
- can struggle with domain shift
- perform poorly on our negation challenge
- perform poorly on sarcasm
- can assign strong scores to incorrect predictions
- should not be treated as reliable interpreters of arbitrary real-world text

Those limitations are intentionally visible in the application rather than hidden.

---

## What's next?

A few directions I'm interested in:

- [x] SimpleRNN baseline
- [x] LSTM comparison
- [x] GRU comparison
- [x] Three-model inference
- [x] Model disagreement
- [x] Diagnostic challenge benchmark
- [x] Model Arena
- [x] Hall of Shame
- [ ] Larger independent negation benchmark
- [ ] Larger independent sarcasm benchmark
- [ ] Probability calibration
- [ ] Repeated training runs with multiple random seeds
- [ ] Transformer baseline
- [ ] Human feedback collection
- [ ] Feedback-driven continual learning
- [ ] Measure whether continual learning improves difficult categories without damaging IMDb performance

The last one is where this project could get particularly interesting.

---

## Previous version

Want to see where this started?

The original single-model application is preserved on the:

**[`Initial-Iteration-RNN`](../../tree/Initial-Iteration-RNN) branch**

A separate archived V2 deployment is also available here:

**[Open Sentiment V2](YOUR_V2_ARCHIVE_URL)**

---

## Contributing

Contributions and experiments are welcome.

Interesting areas include:

- finding reproducible model failure cases
- adding diagnostic examples
- accessibility improvements
- mobile UI improvements
- model evaluation
- tests
- additional architectures

If you're planning a substantial model change, opening an issue first is probably easiest.

---

## License

Released under the [MIT License](LICENSE).

---

Built because submitting the notebook felt like an unsatisfying place to stop.