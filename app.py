# ============================================================
# RNN SENTIMENT ANALYSIS WEB APPLICATION
# ============================================================

import os
import re
import pickle

import tensorflow as tf

from flask import Flask, render_template, request, jsonify
from tensorflow.keras.preprocessing.sequence import pad_sequences


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# MODEL CONFIGURATION
#
# These values MUST match the values used during training.
# ============================================================

MAX_LENGTH = 200


# ============================================================
# FILE PATHS
#
# Absolute paths make loading reliable both:
# - locally
# - on Vercel
# ============================================================

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


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("Loading RNN sentiment model...")

try:

    model = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False
    )

    print("Model loaded successfully.")

except Exception as error:

    print("ERROR: Could not load model.")
    print(error)

    raise


# ============================================================
# LOAD TOKENIZER
# ============================================================

print("Loading tokenizer...")

try:

    with open(
        TOKENIZER_PATH,
        "rb"
    ) as file:

        tokenizer = pickle.load(file)

    print("Tokenizer loaded successfully.")

except Exception as error:

    print("ERROR: Could not load tokenizer.")
    print(error)

    raise


# ============================================================
# TEXT PREPROCESSING
#
# IMPORTANT:
# This preprocessing is intentionally identical to the
# preprocessing used while training the RNN.
# ============================================================

def clean_text(text):

    # Convert input to string and lowercase it
    text = str(text).lower()

    # Remove HTML tags
    text = re.sub(
        r"<.*?>",
        " ",
        text
    )

    # Remove URLs
    text = re.sub(
        r"http\S+|www\S+",
        " ",
        text
    )

    # Keep only English letters and spaces
    text = re.sub(
        r"[^a-z\s]",
        " ",
        text
    )

    # Replace repeated whitespace with a single space
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


# ============================================================
# SENTIMENT PREDICTION
# ============================================================

def predict_sentiment(text):

    # --------------------------------------------------------
    # STEP 1: Clean input
    # --------------------------------------------------------

    cleaned = clean_text(text)


    # --------------------------------------------------------
    # STEP 2: Convert text into tokenizer IDs
    # --------------------------------------------------------

    sequence = tokenizer.texts_to_sequences(
        [cleaned]
    )

    token_ids = sequence[0]


    # --------------------------------------------------------
    # STEP 3: Pad/truncate sequence
    #
    # The RNN was trained using sequences of length 200.
    # --------------------------------------------------------

    padded = pad_sequences(
        sequence,
        maxlen=MAX_LENGTH,
        padding="post",
        truncating="post"
    )


    # --------------------------------------------------------
    # STEP 4: Run RNN inference
    #
    # The sigmoid output represents the probability of the
    # positive class.
    # --------------------------------------------------------

    prediction = model.predict(
        padded,
        verbose=0
    )

    probability = float(
        prediction[0][0]
    )


    # --------------------------------------------------------
    # STEP 5: Convert probability into sentiment
    # --------------------------------------------------------

    if probability >= 0.5:

        sentiment = "Positive"

        confidence = probability

    else:

        sentiment = "Negative"

        confidence = 1 - probability


    # --------------------------------------------------------
    # STEP 6: Create token visualization
    #
    # This powers:
    #
    # "How the model sees your text"
    #
    # on the frontend.
    # --------------------------------------------------------

    index_word = tokenizer.index_word

    tokens = []

    for token_id in token_ids[:50]:

        word = index_word.get(
            token_id,
            "<OOV>"
        )

        tokens.append(
            {
                "word": word,
                "id": int(token_id)
            }
        )


    # --------------------------------------------------------
    # STEP 7: Return prediction + explanation
    # --------------------------------------------------------

    return {

        "sentiment":
            sentiment,

        "confidence":
            round(
                confidence * 100,
                2
            ),

        "positive_probability":
            round(
                probability * 100,
                2
            ),

        "negative_probability":
            round(
                (1 - probability) * 100,
                2
            ),

        "analysis": {

            "original":
                text,

            "cleaned":
                cleaned,

            "tokens":
                tokens,

            "token_count":
                len(token_ids),

            "sequence_length":
                MAX_LENGTH

        }

    }


# ============================================================
# HOME PAGE
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ============================================================
# HEALTH CHECK
#
# Useful for confirming that the deployed Flask application
# is alive without running model inference.
#
# Visit:
# /health
# ============================================================

@app.route("/health")
def health():

    return jsonify(
        {
            "status": "ok",
            "model": "SimpleRNN",
            "task": "sentiment-analysis"
        }
    )


# ============================================================
# PREDICTION API
#
# POST /predict
#
# Expected JSON:
#
# {
#     "text": "This movie was amazing!"
# }
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    # --------------------------------------------------------
    # Make sure request contains JSON
    # --------------------------------------------------------

    if not request.is_json:

        return jsonify(
            {
                "error":
                    "Request must contain JSON."
            }
        ), 400


    # --------------------------------------------------------
    # Read JSON safely
    # --------------------------------------------------------

    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify(
            {
                "error":
                    "No request data provided."
            }
        ), 400


    # --------------------------------------------------------
    # Check for text field
    # --------------------------------------------------------

    if "text" not in data:

        return jsonify(
            {
                "error":
                    "No text provided."
            }
        ), 400


    # --------------------------------------------------------
    # Validate input type
    # --------------------------------------------------------

    text = data["text"]


    if not isinstance(
        text,
        str
    ):

        return jsonify(
            {
                "error":
                    "Text must be a string."
            }
        ), 400


    # --------------------------------------------------------
    # Remove surrounding whitespace
    # --------------------------------------------------------

    text = text.strip()


    if not text:

        return jsonify(
            {
                "error":
                    "Please enter some text."
            }
        ), 400


    # --------------------------------------------------------
    # Prevent unnecessarily huge requests
    #
    # Frontend currently limits text to 2000 characters.
    # Backend should enforce the same limit.
    # --------------------------------------------------------

    if len(text) > 2000:

        return jsonify(
            {
                "error":
                    "Text must be 2000 characters or fewer."
            }
        ), 400


    # --------------------------------------------------------
    # Run sentiment analysis
    # --------------------------------------------------------

    try:

        result = predict_sentiment(
            text
        )

        return jsonify(
            result
        )


    except Exception as error:

        print(
            "Prediction error:",
            error
        )

        return jsonify(
            {
                "error":
                    "The model could not process this text."
            }
        ), 500


# ============================================================
# 404 HANDLER
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify(
        {
            "error":
                "Route not found."
        }
    ), 404


# ============================================================
# LOCAL DEVELOPMENT
#
# Vercel imports the Flask `app` object directly.
# Therefore this block runs locally but not as the Vercel
# server entry point.
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )