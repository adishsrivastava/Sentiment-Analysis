from flask import Flask, render_template, request, jsonify

import tensorflow as tf
import pickle
import re
import os

from tensorflow.keras.preprocessing.sequence import pad_sequences


app = Flask(__name__)


# --------------------------------------------------
# Configuration
# --------------------------------------------------

MAX_LENGTH = 200


# --------------------------------------------------
# Get absolute paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "sentiment_rnn.keras"
)

TOKENIZER_PATH = os.path.join(
    BASE_DIR,
    "model",
    "tokenizer.pkl"
)


# --------------------------------------------------
# Load trained model
# --------------------------------------------------

print("Loading RNN model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully!")


# --------------------------------------------------
# Load tokenizer
# --------------------------------------------------

print("Loading tokenizer...")

with open(TOKENIZER_PATH, "rb") as f:
    tokenizer = pickle.load(f)

print("Tokenizer loaded successfully!")


# --------------------------------------------------
# Text preprocessing
#
# IMPORTANT:
# This is identical to the preprocessing used
# during model training.
# --------------------------------------------------

def clean_text(text):

    text = str(text).lower()

    # Remove HTML tags
    text = re.sub(r'<.*?>', ' ', text)

    # Remove URLs
    text = re.sub(r'http\S+|www\S+', ' ', text)

    # Keep only letters and spaces
    text = re.sub(r'[^a-z\s]', ' ', text)

    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text


# --------------------------------------------------
# Prediction function
# --------------------------------------------------

def predict_sentiment(text):

    cleaned = clean_text(text)

    sequence = tokenizer.texts_to_sequences(
        [cleaned]
    )

    padded = pad_sequences(
        sequence,
        maxlen=MAX_LENGTH,
        padding='post',
        truncating='post'
    )

    probability = float(
        model.predict(
            padded,
            verbose=0
        )[0][0]
    )

    if probability >= 0.5:

        sentiment = "Positive"
        confidence = probability

    else:

        sentiment = "Negative"
        confidence = 1 - probability

        # Get token information for "How the model sees your text"
    token_ids = sequence[0]
    index_word = tokenizer.index_word

    tokens = [
        {
            "word": index_word.get(token_id, "<OOV>"),
            "id": token_id
        }
        for token_id in token_ids[:50]
    ]


    # Convert tokens back to words for visualization
token_ids = sequence[0]

index_word = tokenizer.index_word

tokens = [
    {
        "word": index_word.get(token_id, "<OOV>"),
        "id": token_id
    }
    for token_id in token_ids[:50]
]

    return {
        "sentiment": sentiment,
        "confidence": round(confidence * 100, 2),
        "positive_probability": round(probability * 100, 2),
        "negative_probability": round((1 - probability) * 100, 2),

        "analysis": {
            "original": text,
            "cleaned": cleaned,
            "tokens": tokens,
            "token_count": len(token_ids),
            "sequence_length": MAX_LENGTH
        }
    }


# --------------------------------------------------
# Homepage
# --------------------------------------------------

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# --------------------------------------------------
# Prediction API
# --------------------------------------------------

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    data = request.get_json()

    if not data or "text" not in data:

        return jsonify({
            "error": "No text provided."
        }), 400


    text = data["text"].strip()


    if not text:

        return jsonify({
            "error":
                "Please enter some text."
        }), 400


    result = predict_sentiment(text)

    return jsonify(result)


# --------------------------------------------------
# Run Flask
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True
    )