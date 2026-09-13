// ============================================================
// SENTIMENT LAB V3
// ============================================================


// ============================================================
// MODEL INFORMATION
// ============================================================

const modelInfo = {

    simple_rnn: {
        name: "SimpleRNN",
        accuracy: 81.36
    },

    lstm: {
        name: "LSTM",
        accuracy: 85.29
    },

    gru: {
        name: "GRU",
        accuracy: 87.08,
        best: true
    }

};


// ============================================================
// EXAMPLES
// ============================================================

const examples = {

    simple: [
        "This movie was absolutely fantastic.",
        "The acting was awful and the story was boring.",
        "I loved every minute of this film.",
        "This was one of the worst movies I have seen."
    ],

    mixed: [
        "The story was predictable, but the performances were so good that I still loved the movie.",
        "The acting was excellent, but the story was so terrible that I hated the movie.",
        "The first half was slow, but the second half was absolutely fantastic.",
        "The visuals were beautiful, although the movie itself was awful."
    ],

    negation: [
        "This movie was not bad at all.",
        "I did not hate this movie.",
        "This movie was not good at all.",
        "I cannot say that I enjoyed this film."
    ],

    sarcasm: [
        "Fantastic, another two hours of my life I will never get back.",
        "What a masterpiece, if the goal was to put me to sleep.",
        "I hate that this movie was so good because now I have to recommend it to everyone.",
        "Really annoying how good the performances were."
    ]

};


// ============================================================
// STATE
// ============================================================

let selectedModel = "compare";
let selectedExampleCategory = "simple";


// ============================================================
// ELEMENTS
// ============================================================

const textInput =
    document.getElementById("text-input");

const characterCount =
    document.getElementById("character-count");

const analyzeButton =
    document.getElementById("analyze-button");

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("error-message");

const resultsSection =
    document.getElementById("results-section");

const modelResults =
    document.getElementById("model-results");

const agreementCard =
    document.getElementById("agreement-card");

const resultModeLabel =
    document.getElementById("result-mode-label");

const exampleGrid =
    document.getElementById("example-grid");


// ============================================================
// THEME
// ============================================================

function resolveTheme(choice) {

    if (choice === "system") {

        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light";
    }

    return choice;
}


function applyTheme(choice) {

    const resolved =
        resolveTheme(choice);

    document.documentElement.setAttribute(
        "data-theme",
        choice
    );

    document.documentElement.setAttribute(
        "data-resolved-theme",
        resolved
    );


    document
        .querySelectorAll(".theme-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.themeChoice === choice
            );

        });
}


function initializeTheme() {

    const saved =
        localStorage.getItem(
            "sentiment-lab-theme"
        ) || "system";

    applyTheme(saved);
}


document
    .querySelectorAll(".theme-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const choice =
                    button.dataset.themeChoice;

                localStorage.setItem(
                    "sentiment-lab-theme",
                    choice
                );

                applyTheme(choice);
            }
        );

    });


window
    .matchMedia(
        "(prefers-color-scheme: dark)"
    )
    .addEventListener(
        "change",
        () => {

            const saved =
                localStorage.getItem(
                    "sentiment-lab-theme"
                ) || "system";

            if (saved === "system") {
                applyTheme("system");
            }

        }
    );


// ============================================================
// NAVIGATION
// ============================================================

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const view =
                    button.dataset.view;

                document
                    .querySelectorAll(".nav-item")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");


                document
                    .querySelectorAll(".view")
                    .forEach(section =>
                        section.classList.remove("active")
                    );


                document
                    .getElementById(
                        `view-${view}`
                    )
                    .classList.add("active");


                document
                    .getElementById("sidebar")
                    .classList.remove("open");

            }
        );

    });


// ============================================================
// MOBILE MENU
// ============================================================

document
    .getElementById("mobile-menu-button")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("sidebar")
                .classList.toggle("open");

        }
    );


// ============================================================
// MODEL SELECTOR
// ============================================================

document
    .querySelectorAll(".mode-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedModel =
                    button.dataset.model;


                document
                    .querySelectorAll(".mode-button")
                    .forEach(item =>
                        item.classList.remove("active")
                    );


                button.classList.add("active");


                if (selectedModel === "compare") {

                    analyzeButton.textContent =
                        "Compare models";

                } else {

                    analyzeButton.textContent =
                        `Analyze with ${modelInfo[selectedModel].name}`;

                }

            }
        );

    });


// ============================================================
// CHARACTER COUNT
// ============================================================

textInput.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${textInput.value.length} / 2000`;

    }
);


// ============================================================
// EXAMPLES
// ============================================================

function renderExamples() {

    exampleGrid.innerHTML = "";


    examples[
        selectedExampleCategory
    ].forEach(text => {

        const button =
            document.createElement("button");

        button.className =
            "example-card";

        button.textContent =
            text;


        button.addEventListener(
            "click",
            () => {

                textInput.value =
                    text;

                characterCount.textContent =
                    `${text.length} / 2000`;

                textInput.focus();

            }
        );


        exampleGrid.appendChild(
            button
        );

    });

}


document
    .querySelectorAll(".example-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedExampleCategory =
                    button.dataset.category;


                document
                    .querySelectorAll(".example-tab")
                    .forEach(item =>
                        item.classList.remove("active")
                    );


                button.classList.add("active");

                renderExamples();

            }
        );

    });


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


// ============================================================
// RESULT CARD
// ============================================================

function createResultCard(result) {

    const info =
        modelInfo[result.model_key];

    const positive =
        result.positive_score;

    const negative =
        result.negative_score;

    const sentimentClass =
        result.sentiment.toLowerCase();


    return `
        <article
            class="result-card
            ${info.best ? "best-model" : ""}"
        >

            <div class="result-header">

                <div>

                    <div class="result-model">
                        ${escapeHtml(result.model)}
                    </div>

                    <div class="result-meta">
                        ${info.accuracy.toFixed(2)}% IMDb test accuracy
                        ·
                        ${result.inference_ms.toFixed(2)} ms inference
                        ${info.best ? " · Best overall" : ""}
                    </div>

                </div>


                <div
                    class="sentiment-label
                    ${sentimentClass}"
                >
                    ${escapeHtml(result.sentiment)}
                </div>

            </div>


            <div class="meter-labels">

                <span>NEGATIVE</span>
                <span>POSITIVE</span>

            </div>


            <div class="sentiment-meter">

                <div class="meter-center"></div>

                <div
                    class="meter-marker"
                    style="left: ${positive}%"
                ></div>

            </div>


            <div class="meter-footer">

                <span>
                    ${negative.toFixed(2)}% negative
                </span>

                <span>
                    ${positive.toFixed(2)}% positive
                </span>

            </div>

        </article>
    `;
}


// ============================================================
// ANALYSIS
// ============================================================

function renderAnalysis(analysis) {

    if (!analysis) {
        return;
    }


    document.getElementById(
        "analysis-original"
    ).textContent =
        analysis.original;


    document.getElementById(
        "analysis-cleaned"
    ).textContent =
        analysis.cleaned;


    document.getElementById(
        "token-count"
    ).textContent =
        analysis.token_count;


    document.getElementById(
        "sequence-length"
    ).textContent =
        analysis.sequence_length;


    const tokenList =
        document.getElementById(
            "token-list"
        );


    tokenList.innerHTML = "";


    analysis.tokens.forEach(token => {

        const element =
            document.createElement("span");

        element.className =
            "token";


        const word =
            document.createTextNode(
                token.word
            );

        const id =
            document.createElement("span");

        id.className =
            "token-id";

        id.textContent =
            token.id;


        element.appendChild(word);
        element.appendChild(id);

        tokenList.appendChild(element);

    });

}


// ============================================================
// AGREEMENT
// ============================================================

function renderAgreement(agreement) {

    if (!agreement) {

        agreementCard.classList.add(
            "hidden"
        );

        return;
    }


    agreementCard.classList.remove(
        "hidden",
        "disagreement"
    );


    if (agreement.agree) {

        agreementCard.innerHTML = `
            <div class="agreement-title">
                ✓ Model agreement
            </div>

            <div>
                ${escapeHtml(agreement.message)}
            </div>
        `;

    } else {

        agreementCard.classList.add(
            "disagreement"
        );


        const positive =
            agreement.positive_models.length
                ? agreement.positive_models.join(", ")
                : "None";


        const negative =
            agreement.negative_models.length
                ? agreement.negative_models.join(", ")
                : "None";


        agreementCard.innerHTML = `
            <div class="agreement-title">
                ⚡ Model disagreement
            </div>

            <div>
                Positive:
                ${escapeHtml(positive)}
                ·
                Negative:
                ${escapeHtml(negative)}
            </div>
        `;

    }

}


// ============================================================
// HISTORY
// ============================================================

function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "sentiment-lab-history"
            )
        ) || [];

    } catch {

        return [];

    }
}


function saveHistory(text) {

    let history =
        getHistory();


    history =
        history.filter(
            item => item !== text
        );


    history.unshift(
        text
    );


    history =
        history.slice(0, 8);


    localStorage.setItem(
        "sentiment-lab-history",
        JSON.stringify(history)
    );


    renderHistory();

}


function renderHistory() {

    const container =
        document.getElementById(
            "history-list"
        );


    const history =
        getHistory();


    container.innerHTML = "";


    if (!history.length) {

        container.innerHTML = `
            <div class="sidebar-empty">
                No analyses yet.
            </div>
        `;

        return;
    }


    history.forEach(text => {

        const button =
            document.createElement("button");

        button.className =
            "history-item";

        button.textContent =
            text;


        button.addEventListener(
            "click",
            () => {

                textInput.value =
                    text;

                characterCount.textContent =
                    `${text.length} / 2000`;

                document
                    .querySelector(
                        '[data-view="analyze"]'
                    )
                    .click();

            }
        );


        container.appendChild(
            button
        );

    });

}


// ============================================================
// API
// ============================================================

async function analyze() {

    const text =
        textInput.value.trim();


    if (!text) {

        showError(
            "Write something before running the models."
        );

        return;
    }


    clearError();

    resultsSection.classList.add(
        "hidden"
    );

    loading.classList.remove(
        "hidden"
    );

    analyzeButton.disabled =
        true;


    try {

        let endpoint;


        if (selectedModel === "compare") {

            endpoint =
                "/compare";

        } else {

            endpoint =
                `/predict/${selectedModel}`;

        }


        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "The models could not process this text."
            );

        }


        modelResults.innerHTML =
            "";


        if (selectedModel === "compare") {

            resultModeLabel.textContent =
                "Compare all";


            const order = [
                "simple_rnn",
                "lstm",
                "gru"
            ];


            order.forEach(key => {

                modelResults.insertAdjacentHTML(
                    "beforeend",
                    createResultCard(
                        data.results[key]
                    )
                );

            });


            renderAgreement(
                data.agreement
            );


            renderAnalysis(
                data.analysis
            );

        } else {

            resultModeLabel.textContent =
                modelInfo[selectedModel].name;


            modelResults.innerHTML =
                createResultCard(data);


            agreementCard.classList.add(
                "hidden"
            );


            renderAnalysis(
                data.analysis
            );

        }


        saveHistory(text);


        resultsSection.classList.remove(
            "hidden"
        );


        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        showError(
            error.message
        );

    } finally {

        loading.classList.add(
            "hidden"
        );

        analyzeButton.disabled =
            false;

    }

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );
}


function clearError() {

    errorMessage.classList.add(
        "hidden"
    );

    errorMessage.textContent =
        "";
}


// ============================================================
// EVENTS
// ============================================================

analyzeButton.addEventListener(
    "click",
    analyze
);


textInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
            &&
            (event.ctrlKey || event.metaKey)
        ) {

            event.preventDefault();

            analyze();

        }

    }
);


// ============================================================
// INITIALIZE
// ============================================================

initializeTheme();
renderExamples();
renderHistory();