ai_engine/classifier.py

def classify_incident(text):

    if "cyber" in text:
        return "cyber_attack"

    if "border" in text or "infiltration" in text:
        return "border_tension"

    if "military" in text or "army" in text:
        return "military_activity"

    if "protest" in text or "violence" in text:
        return "civil_unrest"

    return "other"
