# Sentiment Analyzer

A small sentiment analysis playground built around a recurrent neural network.

I originally built this as part of a Deep Learning lab experiment to understand how RNNs work with sequential data. Instead of stopping at the notebook, I trained the model on IMDb movie reviews, saved it, built a Flask application around it, and deployed the whole thing as an interactive web app.

The interesting part isn't just whether the model says **positive** or **negative**. The app also lets you see how the input is cleaned and tokenized, try sentences that are deliberately difficult for the model, and explore some of the limitations of a relatively simple RNN.

**[Try the live app](https://sentiment-analysis-ten-omega.vercel.app)**

---

## What it does

Type in a movie review or a sentence and the model returns:

- a positive or negative prediction
- the model's confidence
- positive and negative probability scores
- the cleaned version of the input
- the tokens and token IDs seen by the model

There are also a few features built around experimenting with the model rather than just using it.

### Challenge the RNN

The app includes prompts designed to make the classifier's job harder. Try sarcasm, double negatives, conflicting opinions, or sentences where the literal words don't quite match the intended sentiment.

For example:

> Fantastic. Another two hours of my life I'll never get back.

A human immediately understands the sarcasm. A small RNN may not.

That's part of the fun.

### Difficult examples

The example library is split into:

- **Simple** — straightforward positive and negative statements
- **Sarcasm** — positive vocabulary with negative intent
- **Mixed** — praise and criticism in the same sentence
- **Negation** — sentences such as "I wouldn't say this movie was bad"

These are useful for seeing where binary sentiment classification starts to become less straightforward.

### How the model sees your text

After making a prediction, the preprocessing pipeline can be expanded to show something roughly like:

```text
Original
"This movie was absolutely amazing!"

        ↓

Cleaned
"this movie was absolutely amazing"

        ↓

Tokens
this      movie      was      absolutely      amazing
 11         17        13          425            477

        ↓

Padded sequence (200 tokens)

        ↓

SimpleRNN

        ↓

Positive
```

The intention is to make the inference process a little less opaque.

---

## Model

The classifier is a fairly small Keras model:

```text
Input text
    │
    ▼
Tokenization
    │
    ▼
Padding (200 tokens)
    │
    ▼
Embedding
    │
    ▼
SimpleRNN (64)
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
Positive / Negative
```

| | |
|---|---|
| **Dataset** | IMDb movie reviews |
| **Task** | Binary sentiment classification |
| **Architecture** | SimpleRNN |
| **Vocabulary size** | 10,000 |
| **Maximum sequence length** | 200 |
| **Output** | Positive / Negative |
| **Framework** | TensorFlow / Keras |

The model uses a sigmoid output, so values above `0.5` are classified as positive and values below `0.5` as negative.

---

## Preprocessing

The inference pipeline deliberately uses the same preprocessing that was used during training.

Reviews are:

1. converted to lowercase
2. stripped of HTML
3. stripped of URLs
4. reduced to English letters and whitespace
5. tokenized using the saved training vocabulary
6. padded or truncated to 200 tokens

Keeping the tokenizer is particularly important. Training a new tokenizer at inference time would assign different integer IDs to words and make the saved model effectively useless.

---

## Tech stack

The project is intentionally pretty small.

**Model**

- Python
- TensorFlow
- Keras
- SimpleRNN

**Backend**

- Flask

**Frontend**

- HTML
- CSS
- Vanilla JavaScript

**Deployment**

- Vercel

There is no frontend framework and no database. Prediction history, theme preference, and feedback are stored locally in the browser.

---

## Running it locally

Clone the repository:

```bash
git clone https://github.com/adishsrivastava/RNN-Sentiment-Analysis.git
cd RNN-Sentiment-Analysis
```

Create a virtual environment:

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Run Flask:

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

You can also check that the backend is alive at:

```text
http://127.0.0.1:5000/health
```

---

## API

The frontend talks to a small Flask endpoint that can also be used directly.

### `POST /predict`

Request:

```json
{
  "text": "I absolutely loved this movie."
}
```

Example response:

```json
{
  "sentiment": "Positive",
  "confidence": 92.41,
  "positive_probability": 92.41,
  "negative_probability": 7.59,
  "analysis": {
    "original": "I absolutely loved this movie.",
    "cleaned": "i absolutely loved this movie",
    "tokens": [
      {
        "word": "i",
        "id": 10
      }
    ],
    "token_count": 5,
    "sequence_length": 200
  }
}
```

The exact probabilities depend on the trained model.

---

## Project structure

```text
RNN-Sentiment-Analysis/
│
├── model/
│   ├── sentiment_rnn.keras
│   └── tokenizer.pkl
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
├── .gitignore
└── README.md
```

`sentiment_rnn.keras` contains the trained network, while `tokenizer.pkl` preserves the vocabulary learned from the training data.

---

## Limitations

This model is deliberately not presented as a general-purpose sentiment system.

It was trained on **IMDb movie reviews**, which means its training distribution is fairly specific. It also has only two possible outputs:

```text
Positive
Negative
```

There is no neutral or mixed class.

That leads to some interesting failure cases.

The model may struggle with:

- sarcasm
- irony
- double negatives
- mixed sentiment
- neutral statements
- subtle contextual meaning
- language that differs significantly from IMDb-style reviews

For example:

> The cinematography was beautiful, but everything else was terrible.

contains both positive and negative sentiment, but the model is forced to reduce it to a single label.

Similarly:

> Great. Exactly what I needed today.

could be sincere or sarcastic depending on context that the model simply doesn't have.

These aren't bugs in the web application; they're useful demonstrations of the limits of the model and the task it was trained for.

---

## Why a SimpleRNN?

Mostly because that was the point of the experiment.

There are much stronger approaches to sentiment analysis today. The goal here wasn't to build the best sentiment classifier available; it was to build, train, deploy, and understand a recurrent neural network end to end.

That also gives this project somewhere interesting to go next.

---

## Roadmap

The next major version will turn the project into more of a recurrent-network comparison lab.

- [x] Train a SimpleRNN sentiment classifier
- [x] Build a Flask inference API
- [x] Deploy the trained model
- [x] Add light, dark and system themes
- [x] Add prediction confidence visualization
- [x] Show preprocessing and tokenization
- [x] Add difficult sentiment examples
- [x] Add Challenge the RNN mode
- [x] Add local prediction history
- [ ] Train an LSTM classifier
- [ ] Train a GRU classifier
- [ ] Compare RNN, LSTM and GRU predictions side by side
- [ ] Compare accuracy, parameter count and inference time
- [ ] Collect interesting failure cases into a "Hall of Shame"
- [ ] Add a small transformer baseline

The eventual goal is to make it possible to enter one sentence and watch several sequence models disagree with each other.

---

## Contributing

This started as a learning project, but contributions are welcome.

Some relatively approachable areas to contribute to are:

- adding interesting challenge prompts
- finding reproducible model failure cases
- improving accessibility
- improving the mobile interface
- adding tests
- improving model visualizations
- experimenting with other recurrent architectures

If you're making a larger change, opening an issue first is probably the easiest way to discuss it.

---

## Acknowledgements

The model was trained using the IMDb movie review dataset and built with TensorFlow/Keras.

The interface takes inspiration from the restrained, content-first design of tools such as Notion, while being implemented from scratch for this project.

---

## License

This project is open source. See [`LICENSE`](LICENSE) for details.
