/* ==================================================
   STATE
================================================== */

let currentResult = null;

const examples = {

    simple: [
        "This movie was absolutely brilliant. I loved every minute of it.",
        "The film was boring, predictable and a complete waste of time."
    ],

    sarcasm: [
        "Fantastic. Another two hours of my life I will never get back.",
        "What a masterpiece — if the goal was to put me to sleep."
    ],

    mixed: [
        "The acting was excellent but the story was painfully boring.",
        "I loved the visuals, although the characters were terrible."
    ],

    negation: [
        "I wouldn't say this movie was bad.",
        "This wasn't the worst film I have ever seen."
    ]
};

const challenges = [

    "Write a sarcastic negative review that uses mostly positive words.",

    "Write a positive review containing several negative words.",

    "Write a review that contains both strong praise and strong criticism.",

    "Try to confuse the model using a double negative.",

    "Write something whose literal meaning and intended sentiment are opposites."
];


/* ==================================================
   THEME
================================================== */

function applyTheme(theme) {

    localStorage.setItem(
        "sentiment-theme",
        theme
    );

    document.documentElement.dataset.theme =
        theme;


    const systemDark =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    const resolved =
        theme === "system"
            ? (systemDark ? "dark" : "light")
            : theme;


    document.documentElement.dataset.resolvedTheme =
        resolved;


    document
        .querySelectorAll("[data-theme-option]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.themeOption === theme
            );

        });
}


function initializeTheme() {

    const saved =
        localStorage.getItem(
            "sentiment-theme"
        ) || "system";

    applyTheme(saved);
}


document
    .querySelectorAll("[data-theme-option]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => applyTheme(
                button.dataset.themeOption
            )
        );

    });


window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {

        const theme =
            localStorage.getItem(
                "sentiment-theme"
            ) || "system";

        if (theme === "system") {
            applyTheme("system");
        }

    });


function cycleTheme() {

    const current =
        localStorage.getItem(
            "sentiment-theme"
        ) || "system";

    const themes = [
        "light",
        "dark",
        "system"
    ];

    const index =
        themes.indexOf(current);

    applyTheme(
        themes[(index + 1) % themes.length]
    );
}


/* ==================================================
   EXAMPLES
================================================== */

function renderExamples(category = "simple") {

    const container =
        document.getElementById(
            "exampleCards"
        );

    container.innerHTML = "";


    examples[category].forEach(text => {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "example-card";

        button.textContent = text;

        button.onclick = () => {

            document.getElementById(
                "textInput"
            ).value = text;

            updateCharacterCount();

            document.getElementById(
                "textInput"
            ).focus();
        };


        container.appendChild(
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

                document
                    .querySelectorAll(
                        ".example-tab"
                    )
                    .forEach(tab =>
                        tab.classList.remove(
                            "active"
                        )
                    );


                button.classList.add(
                    "active"
                );


                renderExamples(
                    button.dataset.category
                );
            }
        );

    });


/* ==================================================
   ANALYSIS
================================================== */

async function analyzeSentiment() {

    const input =
        document.getElementById(
            "textInput"
        );

    const text =
        input.value.trim();


    if (!text) {
        input.focus();
        return;
    }


    const button =
        document.getElementById(
            "analyzeButton"
        );


    button.disabled = true;

    button.innerHTML =
        "Analyzing…";


    try {

        const response =
            await fetch(
                "/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            text
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Prediction failed."
            );
        }


        currentResult = {
            text,
            ...data
        };


        renderResult(data);

        saveHistory(
            text,
            data
        );


    } catch (error) {

        alert(
            "Unable to analyze sentiment: " +
            error.message
        );

    } finally {

        button.disabled = false;

        button.innerHTML =
            "Analyze <kbd>Ctrl ↵</kbd>";
    }
}


/* ==================================================
   RESULT UI
================================================== */

function renderResult(data) {

    const section =
        document.getElementById(
            "resultSection"
        );


    section.classList.remove(
        "hidden"
    );


    document.getElementById(
        "sentiment"
    ).textContent =
        data.sentiment;


    document.getElementById(
        "sentimentIcon"
    ).textContent =
        data.sentiment === "Positive"
            ? "🙂"
            : "🙁";


    document.getElementById(
        "confidenceText"
    ).textContent =
        `The model is ${data.confidence}% confident in this prediction.`;


    const confidenceLabel =
        data.confidence >= 85
            ? "High confidence"
            : data.confidence >= 65
                ? "Moderate confidence"
                : "Low confidence";


    document.getElementById(
        "confidenceBadge"
    ).textContent =
        confidenceLabel;


    document.getElementById(
        "positiveValue"
    ).textContent =
        `${data.positive_probability}%`;


    document.getElementById(
        "negativeValue"
    ).textContent =
        `${data.negative_probability}%`;


    requestAnimationFrame(() => {

        document.getElementById(
            "positiveBar"
        ).style.width =
            `${data.positive_probability}%`;


        document.getElementById(
            "negativeBar"
        ).style.width =
            `${data.negative_probability}%`;

    });


    renderExplanation(
        data.analysis
    );


    document.getElementById(
        "feedbackMessage"
    ).textContent = "";


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* ==================================================
   EXPLANATION
================================================== */

function renderExplanation(analysis) {

    if (!analysis) {
        return;
    }


    document.getElementById(
        "originalText"
    ).textContent =
        analysis.original;


    document.getElementById(
        "cleanedText"
    ).textContent =
        analysis.cleaned;


    document.getElementById(
        "tokenCount"
    ).textContent =
        `${analysis.token_count} tokens before padding`;


    const tokenList =
        document.getElementById(
            "tokenList"
        );


    tokenList.innerHTML = "";


    analysis.tokens.forEach(token => {

        const element =
            document.createElement(
                "span"
            );

        element.className =
            "token";


        element.innerHTML =
            `${escapeHTML(token.word)}
             <small>${token.id}</small>`;


        tokenList.appendChild(
            element
        );

    });
}


/* ==================================================
   HISTORY
================================================== */

function getHistory() {

    return JSON.parse(
        localStorage.getItem(
            "sentiment-history"
        ) || "[]"
    );
}


function saveHistory(text, data) {

    let history =
        getHistory();


    history.unshift({

        text,

        sentiment:
            data.sentiment,

        confidence:
            data.confidence,

        date:
            Date.now()

    });


    history =
        history.slice(0, 8);


    localStorage.setItem(
        "sentiment-history",
        JSON.stringify(history)
    );


    renderHistory();
}


function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );

    const history =
        getHistory();


    container.innerHTML = "";


    if (!history.length) {

        container.innerHTML =
            `<p class="history-empty">
                No analyses yet.
             </p>`;

        return;
    }


    history.forEach(item => {

        const button =
            document.createElement(
                "button"
            );

        button.className =
            "history-item";


        button.innerHTML = `
            <span>
                ${item.sentiment === "Positive"
                    ? "🙂"
                    : "🙁"}
            </span>

            <span>
                ${escapeHTML(item.text)}
            </span>
        `;


        button.onclick = () => {

            document.getElementById(
                "textInput"
            ).value =
                item.text;

            updateCharacterCount();

        };


        container.appendChild(
            button
        );

    });
}


/* ==================================================
   FEEDBACK
================================================== */

function submitFeedback(correct) {

    if (!currentResult) {
        return;
    }


    const stats =
        JSON.parse(
            localStorage.getItem(
                "sentiment-feedback"
            ) ||
            '{"correct":0,"total":0}'
        );


    stats.total += 1;


    if (correct) {
        stats.correct += 1;
    }


    localStorage.setItem(
        "sentiment-feedback",
        JSON.stringify(stats)
    );


    document.getElementById(
        "feedbackMessage"
    ).textContent =
        correct
            ? "Thanks — glad it got this one."
            : "Interesting — you found a failure case.";
}


/* ==================================================
   CHALLENGE
================================================== */

function startChallenge() {

    const challenge =
        challenges[
            Math.floor(
                Math.random() *
                challenges.length
            )
        ];


    const input =
        document.getElementById(
            "textInput"
        );


    input.value = "";

    input.placeholder =
        challenge;


    updateCharacterCount();

    input.focus();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ==================================================
   GENERAL UI
================================================== */

function updateCharacterCount() {

    const input =
        document.getElementById(
            "textInput"
        );


    document.getElementById(
        "characterCount"
    ).textContent =
        `${input.value.length} / 2000`;
}


function newAnalysis() {

    const input =
        document.getElementById(
            "textInput"
        );


    input.value = "";

    input.placeholder =
        "Write something...";


    document.getElementById(
        "resultSection"
    ).classList.add(
        "hidden"
    );


    currentResult = null;

    updateCharacterCount();

    input.focus();
}


function toggleSidebar() {

    document.getElementById(
        "sidebar"
    ).classList.toggle(
        "open"
    );
}


/* ==================================================
   MODAL
================================================== */

function openModelModal() {

    document.getElementById(
        "modelModal"
    ).classList.remove(
        "hidden"
    );
}


function closeModelModal(event) {

    if (
        event &&
        event.target !== event.currentTarget
    ) {
        return;
    }


    document.getElementById(
        "modelModal"
    ).classList.add(
        "hidden"
    );
}


/* ==================================================
   KEYBOARD SHORTCUTS
================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key === "Enter"
        ) {

            event.preventDefault();

            analyzeSentiment();
        }


        if (
            event.key === "Escape"
        ) {

            document.getElementById(
                "modelModal"
            ).classList.add(
                "hidden"
            );
        }

    }
);


/* ==================================================
   SECURITY UTILITY
================================================== */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent = value;

    return div.innerHTML;
}


/* ==================================================
   INITIALIZATION
================================================== */

initializeTheme();
renderExamples();
renderHistory();
updateCharacterCount();