function setExample(text) {
    document.getElementById("textInput").value = text;
}


async function analyzeSentiment() {

    const text =
        document.getElementById("textInput").value.trim();

    if (!text) {
        alert("Please enter some text.");
        return;
    }


    const button =
        document.querySelector(".analyze");

    button.innerText = "Analyzing...";
    button.disabled = true;


    try {

        const response = await fetch("/predict", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: text
            })

        });


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.error || "Prediction failed"
            );
        }


        document.getElementById(
            "sentiment"
        ).innerText = data.sentiment;


        document.getElementById(
            "confidence"
        ).innerText =
            `${data.confidence}% confidence`;


        document.getElementById(
            "positive"
        ).innerText =
            `${data.positive_probability}%`;


        document.getElementById(
            "negative"
        ).innerText =
            `${data.negative_probability}%`;


        document.getElementById(
            "result"
        ).classList.remove("hidden");


    } catch (error) {

        alert(
            "Something went wrong: " + error.message
        );

    } finally {

        button.innerText = "Analyze Sentiment";
        button.disabled = false;

    }
}