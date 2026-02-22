from transformers import pipeline

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

LABELS = [
    "cyber attack",
    "financial crime",
    "civil unrest",
    "natural disaster",
    "political instability",
    "data breach",
    "terrorism",
    "other"
]


def classify_incident(text: str):
    result = classifier(text, LABELS)

    top_label = result["labels"][0]
    confidence = float(result["scores"][0])

    # Dynamic severity logic
    if confidence < 0.40:
        severity = "low"
    elif top_label in ["cyber attack", "natural disaster", "terrorism"]:
        severity = "high"
    elif top_label in ["financial crime", "civil unrest"]:
        severity = "medium"
    else:
        severity = "low"

    return top_label, severity, confidence
