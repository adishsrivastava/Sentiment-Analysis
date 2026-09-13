# RNN Sentiment Analyzer — Initial Iteration

This branch preserves the original version of my sentiment-analysis project.

The project began as a Deep Learning experiment using a **Simple Recurrent Neural Network (SimpleRNN)** for binary sentiment classification of IMDb movie reviews.

After training the model, I turned it into a small Flask application where a user could enter text and receive a positive or negative sentiment prediction.

This branch is intentionally preserved as a snapshot of that initial iteration.

For the latest version of the project — including SimpleRNN, LSTM and GRU model comparison, Model Arena, diagnostic benchmarks and failure analysis — see the [`main`](../../tree/main) branch.

---

## What this version contains

The initial application uses:

- Python
- TensorFlow / Keras
- SimpleRNN
- Flask
- HTML
- CSS
- JavaScript

The basic pipeline is:

```text
User text
    ↓
Text cleaning
    ↓
Tokenizer
    ↓
Sequence conversion
    ↓
Padding
    ↓
SimpleRNN
    ↓
Sigmoid output
    ↓
Positive / Negative
```

---

## Project structure

The exact structure may vary slightly depending on the commit, but the application follows this general layout:

```text
Sentiment-Analysis/
│
├── model/
│   ├── sentiment_rnn.keras
│   └── tokenizer.pkl
│
├── static/
│   ├── style.css
│   └── script.js
│
├── templates/
│   └── index.html
│
├── app.py
├── requirements.txt
└── README.md
```

---

# Running locally

## 1. Clone this branch

To clone the initial iteration directly:

```bash
git clone --branch Initial-Iteration-RNN --single-branch https://github.com/adishsrivastava/Sentiment-Analysis.git
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

## 3. Install the dependencies

```bash
pip install -r requirements.txt
```

TensorFlow is a fairly large dependency, so installation may take some time.

---

## 4. Run the Flask application

```bash
python app.py
```

The terminal should show a local Flask address, normally:

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

in the terminal.

To leave the virtual environment:

```bash
deactivate
```

---

# Deploying your own copy

This branch can also be used as the starting point for your own deployment.

## Vercel

1. Fork this repository or import it into your own GitHub account.
2. Create a new project in Vercel.
3. Import the GitHub repository.
4. Configure the project to deploy the `Initial-Iteration-RNN` branch.
5. Make sure all files required by the Flask application and trained model are included.
6. Install dependencies from `requirements.txt`.
7. Deploy the project.

### TensorFlow and Vercel

TensorFlow creates a very large Python function bundle.

If Vercel rejects the deployment because the function exceeds its normal bundle-size limit, the deployment may require Vercel's large-function support/configuration.

This is a limitation worth keeping in mind if you are deploying this version yourself.

You can also deploy the Flask application to another Python-compatible hosting provider if preferred.

---

# Model limitations

This was an early educational experiment rather than a production sentiment-analysis system.

The model:

- performs binary positive/negative classification
- has no neutral sentiment class
- was trained primarily on IMDb movie-review language
- may generalize poorly to unrelated domains
- can struggle with negation
- can struggle with sarcasm
- should not be interpreted as genuinely understanding the text

These limitations eventually became part of the motivation for expanding the project.

---

# Where the project went next

The current version on [`main`](../../tree/main) evolved this experiment into **Sentiment Lab**.

Instead of relying on a single SimpleRNN, the newer project compares:

```text
SimpleRNN
    vs
LSTM
    vs
GRU
```

under controlled training conditions.

It also includes diagnostic testing for:

- simple sentiment
- mixed sentiment
- negation
- sarcasm

along with model disagreement analysis, Model Arena and a Hall of Shame for examples that fool all three architectures.

This branch remains unchanged so the progression from the original experiment to the current project can be inspected directly.

---

## License

This project is released under the [MIT License](LICENSE).