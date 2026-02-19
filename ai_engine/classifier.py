def classify_incident(text: str):
    text = text.lower()

    if "cyber" in text or "data breach" in text:
        return "cyber_attack", "high"

    if "fraud" in text or "scam" in text:
        return "financial_crime", "medium"

    if "protest" in text or "riot" in text:
        return "civil_unrest", "medium"

    if "earthquake" in text or "flood" in text:
        return "natural_disaster", "high"

    return "other", "low"

