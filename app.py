# ============================================================
# SENTIMENT LAB V3
#
# SimpleRNN vs LSTM vs GRU
# ============================================================

import os
import re
import json
import pickle
import time
import csv

import tensorflow as tf

from flask import (
    Flask,
    render_template,
    request,
    jsonify
)

from tensorflow.keras.preprocessing.sequence import (
    pad_sequences
)


# ============================================================
# FLASK
# ============================================================

app = Flask(__name__)


# ============================================================
# CONFIGURATION
#
# Must match V3 training configuration.
# ============================================================

MAX_LENGTH = 200

MODEL_NAMES = {
    "simple_rnn": "SimpleRNN",
    "lstm": "LSTM",
    "gru": "GRU"
}


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)


MODEL_PATHS = {

    "simple_rnn":
        os.path.join(
            MODEL_DIR,
            "simple_rnn.keras"
        ),

    "lstm":
        os.path.join(
            MODEL_DIR,
            "lstm.keras"
        ),

    "gru":
        os.path.join(
            MODEL_DIR,
            "gru.keras"
        )
}


TOKENIZER_PATH = os.path.join(
    MODEL_DIR,
    "tokenizer.pkl"
)


METADATA_PATH = os.path.join(
    MODEL_DIR,
    "metadata.json"
)


# ============================================================
# LOAD TOKENIZER
# ============================================================

print("Loading V3 tokenizer...")

with open(
    TOKENIZER_PATH,
    "rb"
) as file:

    tokenizer = pickle.load(file)

print("Tokenizer loaded.")


# ============================================================
# LOAD MODEL METADATA
# ============================================================

print("Loading model metadata...")

with open(
    METADATA_PATH,
    "r"
) as file:

    model_metadata = json.load(file)

print("Metadata loaded.")


# ============================================================
# LOAD ALL THREE MODELS
# ============================================================

models = {}

for model_key, model_path in MODEL_PATHS.items():

    print(
        f"Loading {MODEL_NAMES[model_key]}..."
    )

    models[model_key] = (
        tf.keras.models.load_model(
            model_path,
            compile=False
        )
    )

    print(
        f"{MODEL_NAMES[model_key]} loaded."
    )


print("All V3 models loaded successfully.")


# ============================================================
# TEXT CLEANING
#
# Must remain identical to V3 training preprocessing.
# ============================================================

def clean_text(text):

    text = str(text).lower()

    # Remove HTML
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

    # Keep English letters and spaces
    text = re.sub(
        r"[^a-z\s]",
        " ",
        text
    )

    # Collapse whitespace
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


# ============================================================
# PREPROCESS TEXT
# ============================================================

def preprocess_text(text):

    cleaned = clean_text(text)

    sequence = tokenizer.texts_to_sequences(
        [cleaned]
    )

    token_ids = sequence[0]

    padded = pad_sequences(
        sequence,
        maxlen=MAX_LENGTH,
        padding="post",
        truncating="post"
    )

    return (
        cleaned,
        token_ids,
        padded
    )


# ============================================================
# TOKEN VISUALIZATION
# ============================================================

def build_token_data(token_ids):

    index_word = tokenizer.index_word

    tokens = []

    for token_id in token_ids[:50]:

        tokens.append({
            "word": index_word.get(
                token_id,
                "<OOV>"
            ),
            "id": int(token_id)
        })

    return tokens


# ============================================================
# RUN ONE MODEL
# ============================================================

def run_model(
    model_key,
    padded
):

    model = models[model_key]

    start_time = time.perf_counter()

    prediction = model.predict(
        padded,
        verbose=0
    )

    elapsed_ms = (
        time.perf_counter() -
        start_time
    ) * 1000


    positive_score = float(
        prediction[0][0]
    )

    negative_score = (
        1 - positive_score
    )


    if positive_score >= 0.5:

        sentiment = "Positive"

    else:

        sentiment = "Negative"


    return {

        "model":
            MODEL_NAMES[model_key],

        "model_key":
            model_key,

        "sentiment":
            sentiment,

        "positive_score":
            round(
                positive_score * 100,
                2
            ),

        "negative_score":
            round(
                negative_score * 100,
                2
            ),

        "inference_ms":
            round(
                elapsed_ms,
                2
            )

    }


# ============================================================
# VALIDATE REQUEST TEXT
# ============================================================

def get_request_text():

    if not request.is_json:

        return None, (
            jsonify({
                "error":
                    "Request must contain JSON."
            }),
            400
        )


    data = request.get_json(
        silent=True
    )


    if not data:

        return None, (
            jsonify({
                "error":
                    "No request data provided."
            }),
            400
        )


    text = data.get(
        "text"
    )


    if not isinstance(
        text,
        str
    ):

        return None, (
            jsonify({
                "error":
                    "Text must be a string."
            }),
            400
        )


    text = text.strip()


    if not text:

        return None, (
            jsonify({
                "error":
                    "Please enter some text."
            }),
            400
        )


    if len(text) > 2000:

        return None, (
            jsonify({
                "error":
                    "Text must be 2000 characters or fewer."
            }),
            400
        )


    return text, None


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# ============================================================
# HEALTH
# ============================================================

@app.route("/health")
def health():

    return jsonify({

        "status":
            "ok",

        "version":
            "3.0",

        "models": [
            "SimpleRNN",
            "LSTM",
            "GRU"
        ]

    })


# ============================================================
# MODEL METADATA API
#
# GET /models
# ============================================================

@app.route("/models")
def model_info():

    return jsonify(
        model_metadata
    )


# ============================================================
# SINGLE MODEL PREDICTION
#
# POST /predict/<model_key>
#
# Example:
#
# /predict/simple_rnn
# /predict/lstm
# /predict/gru
# ============================================================

@app.route(
    "/predict/<model_key>",
    methods=["POST"]
)
def predict_single(model_key):

    if model_key not in models:

        return jsonify({
            "error":
                "Unknown model."
        }), 404


    text, error = get_request_text()

    if error:

        return error


    try:

        (
            cleaned,
            token_ids,
            padded
        ) = preprocess_text(text)


        result = run_model(
            model_key,
            padded
        )


        result["analysis"] = {

            "original":
                text,

            "cleaned":
                cleaned,

            "tokens":
                build_token_data(
                    token_ids
                ),

            "token_count":
                len(token_ids),

            "sequence_length":
                MAX_LENGTH

        }


        return jsonify(
            result
        )


    except Exception as error:

        print(
            "Prediction error:",
            error
        )

        return jsonify({
            "error":
                "The model could not process this text."
        }), 500


# ============================================================
# COMPARE ALL MODELS
#
# POST /compare
# ============================================================

@app.route(
    "/compare",
    methods=["POST"]
)
def compare_models():

    text, error = get_request_text()

    if error:

        return error


    try:

        (
            cleaned,
            token_ids,
            padded
        ) = preprocess_text(text)


        results = {}


        for model_key in [
            "simple_rnn",
            "lstm",
            "gru"
        ]:

            results[model_key] = (
                run_model(
                    model_key,
                    padded
                )
            )


        sentiments = [
            result["sentiment"]
            for result
            in results.values()
        ]


        models_agree = (
            len(set(sentiments)) == 1
        )


        if models_agree:

            agreement = {
                "agree": True,
                "message":
                    f"All three models predict "
                    f"{sentiments[0].lower()} sentiment."
            }

        else:

            positive_models = [

                result["model"]

                for result
                in results.values()

                if result["sentiment"]
                == "Positive"
            ]


            negative_models = [

                result["model"]

                for result
                in results.values()

                if result["sentiment"]
                == "Negative"
            ]


            agreement = {

                "agree":
                    False,

                "positive_models":
                    positive_models,

                "negative_models":
                    negative_models,

                "message":
                    "The models disagree on this input."

            }


        return jsonify({

            "text":
                text,

            "results":
                results,

            "agreement":
                agreement,

            "analysis": {

                "original":
                    text,

                "cleaned":
                    cleaned,

                "tokens":
                    build_token_data(
                        token_ids
                    ),

                "token_count":
                    len(token_ids),

                "sequence_length":
                    MAX_LENGTH

            }

        })


    except Exception as error:

        print(
            "Comparison error:",
            error
        )

        return jsonify({
            "error":
                "The models could not process this text."
        }), 500


# ============================================================
# LEGACY PREDICTION ROUTE
#
# Keeps older frontend/API calls working while V3 is developed.
# Defaults to GRU because it achieved the best standard
# IMDb test accuracy in the V3 experiment.
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict_legacy():

    text, error = get_request_text()

    if error:

        return error


    try:

        (
            cleaned,
            token_ids,
            padded
        ) = preprocess_text(text)


        result = run_model(
            "gru",
            padded
        )


        # Compatibility with V2 frontend
        result["confidence"] = max(
            result["positive_score"],
            result["negative_score"]
        )

        result["positive_probability"] = (
            result["positive_score"]
        )

        result["negative_probability"] = (
            result["negative_score"]
        )


        result["analysis"] = {

            "original":
                text,

            "cleaned":
                cleaned,

            "tokens":
                build_token_data(
                    token_ids
                ),

            "token_count":
                len(token_ids),

            "sequence_length":
                MAX_LENGTH

        }


        return jsonify(
            result
        )


    except Exception as error:

        print(
            "Legacy prediction error:",
            error
        )

        return jsonify({
            "error":
                "The model could not process this text."
        }), 500


# ============================================================
# 404
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error":
            "Route not found."
    }), 404


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )