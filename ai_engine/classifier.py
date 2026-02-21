from transformers import pipeline

# Load once globally
_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        print("⏳ Loading BERT model...")
        _classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli"
        )
        print("✅ BERT model loaded.")
    return _classifier


LABELS = [
    "cyber attack",
    "terrorism",
    "financial crime",
    "border incident",
    "civil unrest",
    "natural disaster",
    "general news"
]

SEVERITY_MAP = {
    "cyber attack":      "high",
    "terrorism":         "critical",
    "financial crime":   "medium",
    "border incident":   "high",
    "civil unrest":      "medium",
    "natural disaster":  "high",
    "general news":      "low"
}

CATEGORY_MAP = {
    "cyber attack":      "cyber_attack",
    "terrorism":         "terrorism",
    "financial crime":   "financial_crime",
    "border incident":   "border_incident",
    "civil unrest":      "civil_unrest",
    "natural disaster":  "natural_disaster",
    "general news":      "general_news"
}


def classify_incident(text: str):
    classifier = get_classifier()

    result    = classifier(text, LABELS)
    top_label = result["labels"][0]

    return CATEGORY_MAP[top_label], SEVERITY_MAP[top_label]